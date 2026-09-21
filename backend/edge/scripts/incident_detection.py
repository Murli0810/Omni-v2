import supervision as sv
from ultralytics import YOLO
import cv2
import numpy as np
import easyocr
import time
from pathlib import Path
from datetime import datetime, timezone

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "utils"))

from event_client import send_event
from gps_matcher import simulate_route
from storage_utils import upload_snapshot

Script_Dir= Path(__file__).resolve().parent

vehicle_Class_IDs= {2:"car", 3:"motorcycle", 5:"bus", 7:"truck"}

Route_Start= (22.9046, 86.3029)
Route_End= (22.9160, 86.3150)

Speed_Pixels_Per_Frame_Threshold= 45
Overlap_IOU_Threshold= 0.35
Post_Contact_Escape_Frames= 20
Cooldown_Secs= 10

def compute_iou(box_a, box_b):
    xa1, ya1, xa2, ya2= box_a
    xb1, yb1, xb2, yb2= box_b
    inter_x1, inter_y1= max(xa1, xb1), max(ya1, yb1)
    inter_x2, inter_y2= max(xa2, xb2), max(ya2, yb2)
    inter_area= max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
    area_a= (xa2 - xa1) * (ya2 - ya1)
    area_b= (xb2 - xb1) * (yb2 - yb1)
    union= area_a + area_b - inter_area
    return inter_area / union if union > 0 else 0

def read_plate(ocr_reader, frame, box):
    x1, y1, x2, y2= map(int, box)
    x1, y1= max(0, x1), max(0, y1)
    crop= frame[y1:y2, x1:x2]
    if crop.size == 0:
        return None, 0.0

    h, w= crop.shape[:2]
    if h < 60:
        scale= 60 / h
        crop= cv2.resize(crop, int(w * scale), 60, interpolation=cv2.INTER_CUBIC)

    gray= cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    gray= cv2.equalizeHist(gray)
    
    results= ocr_reader.readtext(gray)
    if not results:
        return None, 0.0

    best= max(results, key= lambda r: r[2])
    text, confidence= best[1], float(best[2])
    return text.strip(), confidence

def boxes_plausibly_in_contact(box_a, box_b, iou_threshold=0.35, size_ratio_threshold=0.5):
    iou = compute_iou(box_a, box_b)
    if iou < iou_threshold:
        return False
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    size_ratio = min(area_a, area_b) / max(area_a, area_b)
    return size_ratio >= size_ratio_threshold

def process_video(video_path: str, output_path: str= "incident_output.mp4", conf_threshold: float= 0.5, bus_id: str= "bus-101", send_events: bool= True):
    model= YOLO(str(Script_Dir.parent / "weights" / "yolov8s.pt"))
    tracker= sv.ByteTrack()
    box_annotator= sv.BoxAnnotator()
    label_annotator= sv.LabelAnnotator()
    ocr_reader= easyocr.Reader(['en'], gpu=False)

    cap= cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video at '{video_path}'")
    fps= cap.get(cv2.CAP_PROP_FPS) or 25
    w, h= int(cap.get(3)), int(cap.get(4))
    total_frames= int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    writer= cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    last_centers= {}
    last_alert_time= {}
    watch_after_contact= {}
    fleeing_frame_counts= {}

    frame_idx= 0
    while True:
        ret, frame= cap.read()
        if not ret:
            break

        results= model(frame, verbose=False)[0]
        detections= sv.Detections.from_ultralytics(results)
        mask= [
            (cls_id in vehicle_Class_IDs) and (conf >= conf_threshold)
            for cls_id, conf in zip(detections.class_id, detections.confidence)
        ]
        detections= detections[mask]
        detections= tracker.update_with_detections(detections)

        now= time.time()
        boxes= detections.xyxy
        tracker_ids= detections.tracker_id
        class_ids= detections.class_id
        confidences= detections.confidence

        for i in range(len(boxes)):
            for j in range(i+1, len(boxes)):
                iou= compute_iou(boxes[i], boxes[j])
                if boxes_plausibly_in_contact(boxes[i], boxes[j]):
                    watch_after_contact[tracker_ids[i]]= Post_Contact_Escape_Frames
                    watch_after_contact[tracker_ids[j]]= Post_Contact_Escape_Frames

        labels= []
        for idx, (tid, cls_id, box, conf) in enumerate(zip(tracker_ids, class_ids, boxes, confidences)):
            cx, cy= (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
            speed= 0.0
            if tid in last_centers:
                px, py= last_centers[tid]
                speed= ((cx - px) ** 2 + (cy - py) ** 2) ** 0.5
            last_centers[tid]= (cx, cy)

            triggered_type= None

            if speed >= Speed_Pixels_Per_Frame_Threshold:
                triggered_type= "rash_driving"

            if tid in watch_after_contact:
                watch_after_contact[tid] -= 1
                if speed >= Speed_Pixels_Per_Frame_Threshold:
                    fleeing_frame_counts[tid] = fleeing_frame_counts.get(tid, 0) + 1
                else:
                    fleeing_frame_counts[tid] = 0
                
                if fleeing_frame_counts.get(tid, 0) >= 3:
                    triggered_type = "hit_and_run"

                if watch_after_contact[tid] <= 0:
                    del watch_after_contact[tid]
                    fleeing_frame_counts.pop(tid, None)

            last_sent= last_alert_time.get(tid, 0)
            if triggered_type and send_events and (now - last_sent) >= Cooldown_Secs:
                last_alert_time[tid]= now

                plate_text, plate_confidence= read_plate(ocr_reader, frame, box)

                success, buffer= cv2.imencode(".jpg", frame)
                snapshot_url= upload_snapshot(buffer.tobytes(), event_type=triggered_type) if success else None

                lat, lon= simulate_route(*Route_Start, *Route_End, frame_idx, total_frames)
                send_event(
                    event_type=triggered_type,
                    priority="critical",
                    confidence=float(conf),
                    lat=lat, lon=lon,
                    bus_id=bus_id,
                    snapshot_url=snapshot_url,
                    extra={
                        "tracker_id": int(tid),
                        "vehicle_type": vehicle_Class_IDs.get(int(cls_id), "vehicle"),
                        "plate_text": plate_text or "UNREADABLE",
                        "plate_confidence": round(plate_confidence * 100, 1) if plate_text else 0,
                        "speed_est": f"{speed:.0f} px/frame (est.)"
                    },
                )
                labels.append(f"#{tid} {triggered_type.upper()}")
            else:
                labels.append(f"#{tid} {vehicle_Class_IDs.get(int(cls_id), 'vehicle')}")

        annotated= box_annotator.annotate(frame.copy(), detections)
        annotated= label_annotator.annotate(annotated, detections, labels)
        writer.write(annotated)
        frame_idx += 1

    cap.release()
    writer.release()
    print(f"Processed {frame_idx} frames.")

if __name__ == "__main__":
    import sys
    process_video(sys.argv[1] if len(sys.argv) > 1 else "../../data/Asish3.mp4")






