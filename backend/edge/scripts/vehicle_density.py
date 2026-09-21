from ultralytics import YOLO
import supervision as sv
import cv2
from datetime import datetime, timezone
import numpy as np
from pathlib import Path

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "utils"))

from event_client import send_telemetry
from gps_matcher import simulate_route

Vehicle_Class_IDs= {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}
Rickshaw_Class_ID= 100
Rickshaw_Label= "auto_rickshaw"

Route_Start= (22.7046, 86.3029)
Route_End= (22.7160, 86.3150)
Window_Secs= 10

def merge_detections(coco_detections, rickshaw_detections):
    if len(rickshaw_detections) > 0:
        rickshaw_detections.class_id = np.full(len(rickshaw_detections), Rickshaw_Class_ID)

    if len(coco_detections) == 0:
        return rickshaw_detections
    
    if len(rickshaw_detections) == 0:
        return coco_detections

    return sv.Detections.merge([coco_detections, rickshaw_detections])

def process_video(video_path: str, output_path: str= "vehicle_output.mp4", conf_threshold: float= 0.5, bus_id: str= "bus-101", send_events: bool= True):

    SCRIPT_DIR = Path(__file__).resolve().parent

    coco_model= YOLO(str(SCRIPT_DIR.parent / "weights" / "yolov8s.pt"))
    rickshaw_model= YOLO(str(SCRIPT_DIR.parent / "weights" / "rickshaw.pt"))
    tracker= sv.ByteTrack()
    box_annotator= sv.BoxAnnotator()
    label_annotator= sv.LabelAnnotator()

    cap= cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Could not open video at '{video_path}'")
    fps= cap.get(cv2.CAP_PROP_FPS) or 25
    w, h= int(cap.get(3)), int(cap.get(4))
    total_frames= int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    writer= cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    frames_per_window= int(fps * Window_Secs)

    class_names= {**Vehicle_Class_IDs, Rickshaw_Class_ID: Rickshaw_Label}
    window_seen_ids= set()
    window_class_counts= {name:0 for name in class_names.values()}
    all_time_seen_ids= set()

    frame_idx= 0
    while True:
        ret, frame= cap.read()
        if not ret:
            break

        coco_results= coco_model(frame, verbose=False)[0]
        coco_detections= sv.Detections.from_ultralytics(coco_results)
        coco_mask= [
            (cls_id in Vehicle_Class_IDs) and (conf >= conf_threshold)
            for cls_id, conf in zip(coco_detections.class_id, coco_detections.confidence)
        ]
        coco_detections= coco_detections[coco_mask]

        rickshaw_results= rickshaw_model(frame, verbose=False)[0]
        rickshaw_detections= sv.Detections.from_ultralytics(rickshaw_results)
        rickshaw_mask= [conf >= conf_threshold for conf in rickshaw_detections.confidence]
        rickshaw_detections= rickshaw_detections[rickshaw_mask]

        detections= merge_detections(coco_detections, rickshaw_detections)
        detections= tracker.update_with_detections(detections)

        for tid, cls_id in zip(detections.tracker_id, detections.class_id):
            all_time_seen_ids.add(tid)
            if tid not in window_seen_ids:
                window_seen_ids.add(tid)
                window_class_counts[class_names[int(cls_id)]] += 1

        if frame_idx > 0 and frame_idx % frames_per_window == 0:
            if send_events and window_seen_ids:
                lat, lon= simulate_route(*Route_Start, *Route_End, frame_idx, total_frames)
                send_telemetry(
                    bus_id=bus_id,
                    recorded_at=datetime.now(timezone.utc).isoformat(),
                    vehicle_count=len(window_seen_ids),
                    class_breakdown=window_class_counts,
                    lat=lat, lon=lon,
                )
                print(f"[telemetry] frame {frame_idx}: {len(window_seen_ids)} vehicles, {window_class_counts}")
            window_seen_ids= set()
            window_class_counts= {name:0 for name in class_names.values()}

        labels= [f"#{tid} {class_names[cls_id]} {conf:.2f}"
                 for tid, cls_id, conf in zip(detections.tracker_id, detections.class_id, detections.confidence)]
        annotated= box_annotator.annotate(frame.copy(), detections)
        annotated= label_annotator.annotate(annotated, detections, labels)
        cv2.putText(annotated, f"Distinct vehicles so far: {len(all_time_seen_ids)}",
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
        writer.write(annotated)
        frame_idx += 1

    if send_events and window_seen_ids:
        lat, lon= simulate_route(*Route_Start, *Route_End, frame_idx, total_frames)
        send_telemetry(bus_id=bus_id, recorded_at=datetime.now(timezone.utc).isoformat(), vehicle_count=len(window_seen_ids), class_breakdown=window_class_counts, lat=lat, lon=lon)

    cap.release()
    writer.release()
    print(f"Processed {frame_idx} frames. Total distinct vehicles: {len(all_time_seen_ids)}")
    return {"total": len(all_time_seen_ids)}

if __name__ == "__main__":
    import sys
    process_video(sys.argv[1] if len(sys.argv) > 1 else "../../data/Asish3.mp4")