import requests 
from PIL import Image
import numpy as np
import time
from util import  *
from runner import yolo_detect
import dlib


# def predict():
#     # This function is receiving the base64 encoded image and processing it
#     data = request.get_json()  # Get the JSON data sent from the frontend
#     base64_image = data.get('image')  # Extract the base64 image string
    
#     # Decode the base64 image string
#     image_data = base64.b64decode(base64_image)
#     image = Image.open(io.BytesIO(image_data))  # Convert the binary data to a PIL image
#     image = image.convert('RGB')  # Ensure image is in RGB mode

#     # Convert to numpy array
#     image_np = np.array(image, 'uint8')

#     # Now you can process the image (e.g., face detection, recognition, etc.)
#     result = get_class_from_np_img(image_np)

#     return result


# def classify(img_path):
#     # Initialize your model or any necessary components
#     initialize()
#     return predict_class(img_path)

import time  # Import the time module

if __name__ == "__main__":

    initialize()

    while True:
        try:
            face_detection_type='yolov8'
            option = "1"

            if option == "1":
                start_time = time.time()

                image_path = capture_image_from_webcam()

                end_time = time.time()
                execution_time = end_time - start_time

                print(f"Execution Time: {execution_time:.4f} seconds")
                if image_path is None:
                    continue  
            elif option == "2":
                image_path = "C:/Users/tarek/OneDrive/Desktop/Attendance/uploads_photo/image_1738267122992.png"

            if face_detection_type=='yolov8':
    
                bounding_boxes=yolo_detect(image_path)

                face_detection = dlib.rectangles()
                for x1, y1, x2, y2 in bounding_boxes:
                    face_detection.append(dlib.rectangle(left=x1, top=y1, right=x2, bottom=y2))

                image_np=load_image_from_path(image_path)

                results = get_class_from_yolo_img(image_np,face_detection)

            else:

                image_np = load_image_from_path(image_path)

                results = get_class_from_np_img(image_np)

            call_api_with_result(results,"gallery 1")

            print("Result:", results)

            time.sleep(5)

        except Exception as e:
            print(f"An error occurred: {e}")