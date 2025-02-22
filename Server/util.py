import config
import numpy as np
import dlib
import pickle
import time
import cv2
import os
import requests
import pandas as pd

baseUrl="https://automatic-attendance-system-using-face.onrender.com"

def initialize():
    global loaded_descriptors, loaded_mp, mp_list, face_detector, points_detector, face_descriptor_extractor

    # Load face descriptors
    save_path = config.FACE_DESCRIPTOR_PATH
    loaded_descriptors = np.load(save_path)

    # Load mapping
    mp_file_path = config.MP_FILE_PATH
    with open(mp_file_path, 'rb') as f:
        loaded_mp = pickle.load(f)
    mp_list = list(loaded_mp.items())

    # Load models
    face_detector = dlib.get_frontal_face_detector()
    points_detector = dlib.shape_predictor(
        config.SHAPE_PREDICTOR_PATH
    )
    face_descriptor_extractor = dlib.face_recognition_model_v1(
        config.FACE_RECOGNITION_MODEL_PATH
    )


def call_api_with_result(result,room_no):
    url = baseUrl+"/models/result"
    data = {"result": result,"room_no":room_no} # Data to be sent in the POST request
    headers = {"Content-Type": "application/json"}  # Set headers for JSON content

    try:
        # Sending a POST request to the Node.js API with the result data
        response = requests.post(url, json=data, headers=headers)

        # Checking the response from the API
        if response.status_code == 200:
            print("API Response:", response.json())  # Print the response from your Node.js API
        else:
            print(f"Error    : {response.status_code} - {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")  # Error handling for the HTTP request



def capture_image_from_webcam(save_dir="./captured_images", filename="image.jpg",delay=3):
    
    cam = cv2.VideoCapture(0)  # Open the webcam (index 0)
    if not cam.isOpened():
        raise Exception("Could not open the webcam")

    print(f"Webcam activated. Capturing image ...")
    #time.sleep(delay)  # Wait for the specified delay

    ret, frame = cam.read()
    if not ret:
        cam.release()
        raise Exception("Failed to capture an image from the webcam")
    
    print("Image captured successfully.")

    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    cv2.imwrite(save_path, frame)
    print(f"Image saved at: {save_path}")

    cam.release()
    cv2.destroyAllWindows()
    return save_path
    
def load_image_from_path(image_path):

    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at {image_path}")
    return image


# def predict_class(img_path):
#     from PIL import Image
#     import numpy as np

#     global loaded_descriptors
#     image=Image.open(img_path).convert('RGB')
#     image_np=np.array(image,'uint8')
#     face_detection=face_detector(image_np,1)
#     for face in face_detection:
#         points=points_detector(image_np,face)

#         face_descriptor = face_descriptor_extractor.compute_face_descriptor(image_np, points)
#         face_descriptor = [f for f in face_descriptor]
#         face_descriptor = np.asarray(face_descriptor, dtype=np.float64)
#         face_descriptor = face_descriptor[np.newaxis, :]

#         distances = np.linalg.norm(face_descriptor - loaded_descriptors, axis = 1)
#         min_index=np.argmin(distances)
#         #print(min_index)
#         min_distance=distances[min_index]
#         #print(min_distance)
#         if min_distance<=0.5:
#             name_pred=mp_list[min_index][1]
#         else:
#             name_pred='Undefined'

#         #cv2.putText(image_np, 'Pred: ' + str(name_pred), (10, 10), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0,0,255))
#         #cv2.putText(image_np, 'Exp : ' + str(name_real), (10, 50), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0,255,0))
#         #print(name_pred)
#         return name_pred
    
def get_class_from_np_img(image_np):
    
    results = [] 

    face_detection=face_detector(image_np,1)

    #print(type(face_detection))

    for face in face_detection:

        points=points_detector(image_np,face)

        face_descriptor = face_descriptor_extractor.compute_face_descriptor(image_np, points)
        face_descriptor = [f for f in face_descriptor]
        face_descriptor = np.asarray(face_descriptor, dtype=np.float64)
        face_descriptor = face_descriptor[np.newaxis, :]

        distances = np.linalg.norm(face_descriptor - loaded_descriptors, axis = 1)
        min_index=np.argmin(distances)
        #print(min_index)
        min_distance=distances[min_index]
        #print(min_distance)
        if min_distance<=0.5:
            name_pred=mp_list[min_index][1]
        else:
            name_pred='Undefined'
        results.append(name_pred)

    return results

def get_class_from_yolo_img(image_np,face_detection):
    results = [] 
    for face in face_detection:
        points=points_detector(image_np,face)

        face_descriptor = face_descriptor_extractor.compute_face_descriptor(image_np, points)
        face_descriptor = [f for f in face_descriptor]
        face_descriptor = np.asarray(face_descriptor, dtype=np.float64)
        face_descriptor = face_descriptor[np.newaxis, :]

        distances = np.linalg.norm(face_descriptor - loaded_descriptors, axis = 1)
        
        min_index=np.argmin(distances)
        min_distance=distances[min_index]
        #print(min_distance)
        if min_distance<=0.5:
            name_pred=mp_list[min_index][1]
        else:
            name_pred='Undefined'
        results.append(name_pred)

    return results


def capture_from_camera(room_no,camera_ip):
    CAMERA_IP = camera_ip
        
    URL = f"http://{CAMERA_IP}/shot.jpg"

    try:
        response = requests.get(URL, stream=True)  # Fetch a fresh image
        if response.status_code == 200:
            image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
            frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

            if frame is not None:
                filename = f"captured_images/captured_image_{room_no}.jpg"
                cv2.imwrite(filename, frame)
                print(f"Image saved as {filename}")
            else:
                print("Failed to decode image.")
        else:
            print("Failed to fetch image from IP Webcam.")

    except Exception as e:
        print(f"Error: {e}")
    return filename

def initialize_insight_face():

    from insightface.app import FaceAnalysis


    # configure face analysis
    faceapp = FaceAnalysis(name='buffalo_sc',
                        root='insightface_model',
                        providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])

    faceapp.prepare(ctx_id=0, det_size=(640,640), det_thresh=0.5)
    # warning: don't set det_thresh < 0.3

    # Load the NPZ file
    file_np = np.load('C:/Users/tarek/OneDrive/Desktop/Attendance/Model/insight_face/dataframe_students_teacher.npz', allow_pickle=True)
    dataframe = pd.DataFrame(file_np['arr_0'], columns=file_np['arr_1'])


def capture_from_ip_camera(room_no,url):

    cap = cv2.VideoCapture(url)
    # Check if the stream is opened
    if not cap.isOpened():
        print("Error: Could not open video stream")
        exit()

    # Read a frame
    ret, frame = cap.read()
    if ret is not None:
        filename = f"captured_images/captured_image_{room_no}.jpg"
        cv2.imwrite(filename, frame)
        print(f"Image saved as {filename}")
    else:
        print("Failed to decode image.")

    # Release the capture object
    cap.release()
    cv2.destroyAllWindows()
    return filename