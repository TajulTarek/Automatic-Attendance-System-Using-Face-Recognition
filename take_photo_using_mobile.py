import requests
import cv2
import numpy as np
import time

MOBILE_IP = "10.201.42.242"  # Replace with your mobile's IP
PORT = "8080"                # Default IP Webcam port
URL = f"http://{MOBILE_IP}:{PORT}/shot.jpg"  # IP Webcam snapshot URL

count = 1

print("Press 'Ctrl + C' to stop capturing images.")

while True:
    try:
        response = requests.get(URL, stream=True)  # Fetch a fresh image
        if response.status_code == 200:
            image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
            frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

            if frame is not None:
                filename = f"captured_image_{count}.jpg"
                cv2.imwrite(filename, frame)
                print(f"Image saved as {filename}")
                count += 1
            else:
                print("Failed to decode image.")
        else:
            print("Failed to fetch image from IP Webcam.")

    except Exception as e:
        print(f"Error: {e}")

    time.sleep(5)  # Capture every 5 seconds
