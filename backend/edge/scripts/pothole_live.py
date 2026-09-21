import cv2
import time
import requests
from ultralytics import YOLO

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent / "utils"))

from storage_utils import upload_snapshot

MODEL_PATH= "../weights/pothole.pt"
VIDEO_SOURCE= "../../data/sample1.mp4"
API_URL= "http://127.0.0.1:8000/api/events"
Confidence_Threshold= 0.65
Cooldown_Time= 5
Bus_ID= "bus-101"
Consecutive_Frames_Req= 3

demo_lat= 22.5046
demo_lon= 86.2029

model= YOLO(MODEL_PATH)

def send_event(confience: float, image_bytes: bytes):
    snapshot_url= upload_snapshot(image_bytes, event_type="pothole")

    payload= {
        "event_type": "pothole",
        "priority": "routine",
        "confidence": confience,
        "lat": demo_lat,
        "lon": demo_lon,
        "bus_id": Bus_ID,
        "snapshot_url": snapshot_url,
        "extra": {"source": "pothole_live.py"},
    }
    response= requests.post(API_URL, json=payload, timeout=10)
    print(f"[pothole_live] Event sent -> {response.status_code}, confidence={confience:.2f}")

consecutive_hits= 0

def main():
    cap= cv2.VideoCapture(VIDEO_SOURCE)
    if not cap.isOpened():
        print("ERROR: could not open video source")
        return

    last_sent_time= 0

    print("Starting pothole detection... press 'q' to quit")
    while True:
        ret, frame = cap.read()
        if not ret:
            print("End of video / camera disconnected")
            break

        results= model(frame, verbose=False)[0]

        best_confidence= 0
        for box in results.boxes:
            conf= float(box.conf[0])
            if conf > best_confidence:
                best_confidence= conf

            x1, y1, x2, y2= map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,0,255), 2)
            cv2.putText(frame, f"pothole, {conf:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)

        if best_confidence >= Confidence_Threshold:
            consecutive_hits += 1
        else:
            consecutive_hits= 0

        now= time.time()
        if consecutive_hits >= Consecutive_Frames_Req and (now - last_sent_time) >= Cooldown_Time:
            success, buffer= cv2.imencode(".jpg", frame)
            if success:
                send_event(best_confidence, buffer.tobytes())
                last_sent_time= now
                consecutive_hits= 0

        cv2.imshow("Pothole Detection (press q to quit)", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

