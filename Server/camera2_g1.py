import time
from PIL import Image
import numpy as np
import time
from util import  *
from runner import yolo_detect
import dlib

if __name__ == "__main__":

    initialize()
    #initialize_insight_face()

    while True:
        try:
            face_detection_type='yolov8'
            model=""
            option = "1"

            if option == "1":

                image_path = capture_from_camera("g1","10.101.5.93","8080") # 0.2 sec

                if image_path is None:
                    continue 

            elif option == "2":
                image_path = "C:/Users/tarek/OneDrive/Desktop/Attendance/uploads_photo/image_1738267122992.png"

            if model=="insight_face":
                print("model")
                

            elif face_detection_type=='yolov8':
                
               
                bounding_boxes=yolo_detect(image_path) # 12 sec



                face_detection = dlib.rectangles()
                for x1, y1, x2, y2 in bounding_boxes:
                    face_detection.append(dlib.rectangle(left=x1, top=y1, right=x2, bottom=y2))

                image_np=load_image_from_path(image_path)

                results = get_class_from_yolo_img(image_np,face_detection)  # 0 sec

            else:

                image_np = load_image_from_path(image_path)

                results = get_class_from_np_img(image_np)

            call_api_with_result(results,"gallery 1")

            print("Result:", results)

            #time.sleep(5)


        except Exception as e:
            print(f"An error occurred: {e}")
    