import cv2
import datetime

STREAM_URL = "http://192.168.1.42:8080/video"
OUTPUT_PATH = "../../data/demo_session.mp4"

cap = cv2.VideoCapture(STREAM_URL)
fps = cap.get(cv2.CAP_PROP_FPS) or 20
w, h = int(cap.get(3)), int(cap.get(4))
writer = cv2.VideoWriter(OUTPUT_PATH, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

start_time = datetime.datetime.now()
print(f"Recording started at: {start_time.isoformat()}  <- SAVE THIS TIMESTAMP, you need it for GPS sync")

print("Press 'q' to stop recording.")
while True:
    ret, frame = cap.read()
    if not ret:
        break
    writer.write(frame)
    cv2.imshow("Recording (press q to stop)", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
writer.release()
cv2.destroyAllWindows()
print(f"Saved to {OUTPUT_PATH}")