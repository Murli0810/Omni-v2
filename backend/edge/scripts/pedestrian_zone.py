from ultralytics import YOLO
import supervision as sv
import cv2
import numpy as np
import time

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "utils"))

from event_client import send_event
from gps_matcher import simulate_route
from storage_utils import upload_snapshot

Person_Class_ID= 0
Route_Start= (22.80498, 86.16442)
Route_End= (22.80600, 86.16550)
Cooldown_Secs= 8

def point_in_zone(point, zone_polygon):
    return cv2.pointPolygonTest(zone_polygon, point, False) >= 0

def get_default_zone(frame_width, frame_height):
    zone= np.array([
        [int(frame_width * 0.15), frame_height],
        [int(frame_width * 0.85), frame_height],
        [int(frame_width * 0.65), int(frame_height * 0.55)],
        [int(frame_width * 0.35), int(frame_height * 0.55)],
    ], dtype= np.int32)
    return zone

def process_video(video_path: str, output_path: str= "pedestrian_output.mp4", conf_threshold: float= 0.5, bus_id: str= "bus-101", send_events: bool= True):
    model= YOLO("../weights/yolov8s.pt")
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

    zone= get_default_zone(w ,h)
    alert_events= []
    last_alert_time_by_track= {}
    frame_idx= 0

    while True:
        ret, frame= cap.read()

        if not ret:
            break

        results= model(frame, verbose=False)[0]
        detections= sv.Detections.from_ultralytics(results)
        mask= [
            (cls_id == Person_Class_ID) and (conf >= conf_threshold)
            for cls_id, conf in zip(detections.class_id, detections.confidence)
        ]
        detections= detections[mask]
        detections= tracker.update_with_detections(detections)

        labels= []
        now= time.time()
        for tid, box, conf in zip(detections.tracker_id, detections.xyxy, detections.confidence):
            x1, y1, x2, y2= box
            foot_print= (int(x1+x2 / 2), int(y2))
            in_danger_zone= point_in_zone(foot_print, zone)

            if in_danger_zone:
                labels.append(f"ALERT #{tid}")
                last_sent= last_alert_time_by_track.get(tid, 0)

                if send_event and (now - last_sent) >= Cooldown_Secs:
                    alert_events.append({"frame": frame_idx, "tracker_id": int(tid)})
                    last_alert_time_by_track[tid]= now

                    success, buffer= cv2.imencode(".jpg", frame)
                    snapshot_url= upload_snapshot(buffer.tobytes(), event_type="pedestrian_alert") if success else None

                    lat, lon= simulate_route(*Route_Start, *Route_End, frame_idx, total_frames)
                    send_event(
                        event_type="pedestrian_alert",
                        priority="critical",
                        confidence=float(conf),
                        lat=lat, lon=lon,
                        bus_id=bus_id,
                        snapshot_url=snapshot_url,
                        extra={"tracker_id": int(tid)},
                    )
            else:
                labels.append(f"person #{tid}")

        annotated= frame.copy()
        cv2.polylines(annotated, [zone], isClosed=True, color=(0,255,255), thickness=2)
        annotated= box_annotator.annotate(annotated, detections)
        annotated= label_annotator.annotate(annotated, detections, labels)
        writer.write(annotated)
        frame_idx += 1

    cap.release()
    writer.release()

    print(f"Processed {frame_idx} frames.")
    print(f"Total danger-zone alert events sent: {len(alert_events)}")
    return alert_events

if __name__ == "__main__":
    import sys
    video_path= sys.argv[1] if len(sys.argv) > 1 else "../../data/Asish3.mp4"
    process_video(video_path)