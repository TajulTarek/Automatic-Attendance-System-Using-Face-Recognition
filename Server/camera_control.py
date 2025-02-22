import threading
import time
from PIL import Image
import numpy as np
import dlib
import config
from util import *
from runner import yolo_detect

# Global stop event
stop_event = threading.Event()

# Function to process a single camera
def process_camera(room_no, camera_url,camera_type):
    initialize()
    #initialize_insight_face()

    face_detection_type='yolov8'
    model=""

    while not stop_event.is_set():  # Check if the stop event is triggered
        try:
            # Capture image from the camera
            if camera_type=="ip":
                image_path = capture_from_ip_camera(room_no, camera_url)
            else:
                image_path = capture_from_camera(room_no,camera_url)
            
            if image_path is None:
                print(f"No image captured from Camera {room_no}. Retrying...")
                time.sleep(1)  # Wait before retrying
                continue
            
            # Process the image based on the selected model
            if model == "insight_face":
                print(f"Processing with InsightFace for Camera {room_no}")
                
            elif face_detection_type == 'yolov8':
                # Perform YOLOv8 face detection
                bounding_boxes = yolo_detect(image_path)  # Detect faces
                face_detection = dlib.rectangles()
                for x1, y1, x2, y2 in bounding_boxes:
                    face_detection.append(dlib.rectangle(left=x1, top=y1, right=x2, bottom=y2))
                
                # Load the image and classify faces
                image_np = load_image_from_path(image_path)
                results = get_class_from_yolo_img(image_np, face_detection)
            
            else:
                # Fallback to default processing
                image_np = load_image_from_path(image_path)
                results = get_class_from_np_img(image_np)

            # Call API with the results
            call_api_with_result(results, f"{room_no}")
            print(f"Result for Camera {room_no}: {results}")
            
            # Sleep for a short duration before processing the next frame
            time.sleep(5)  # Adjust sleep time as needed

        except Exception as e:
            print(f"An error occurred in Camera {room_no}: {e}")
            time.sleep(1)  # Wait before retrying after an error

    print(f"Stopping thread for Camera {room_no}...")

# Main function to start threads for all cameras
if __name__ == "__main__":
    # List of cameras (ID and URL pairs)
    cameras = [
        # {"room_no": "g2", "url": config.G2_CAMERA_URL, "camera_type":"ip"},
        {"room_no": "gallery 2", "url": config.G1_CAMERA_URL, "camera_type":"mobile"},
        # Add more cameras as needed
    ]

    # Create and start threads for each camera
    threads = []
    for camera in cameras:
        t = threading.Thread(
            target=process_camera,
            args=(camera["room_no"], camera["url"],camera["camera_type"])
        )
        t.start()
        threads.append(t)

    try:
        # Keep the main thread alive until interrupted
        print("Press Ctrl+C to stop all threads.")
        while True:
            time.sleep(1)  # Keep the main thread running

    except KeyboardInterrupt:
        # Signal all threads to stop
        print("\nStopping all threads...")
        stop_event.set()

        # Wait for all threads to complete
        for t in threads:
            t.join()

        print("All threads stopped. Exiting program.")