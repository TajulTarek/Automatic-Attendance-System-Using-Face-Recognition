import config
import numpy as np
import dlib
import pickle
import time
import cv2

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

def capture_image_from_webcam(delay=3):
    
    cam = cv2.VideoCapture(0)  # Open the webcam (index 0)
    if not cam.isOpened():
        raise Exception("Could not open the webcam")

    print(f"Webcam activated. Capturing image in {delay} seconds...")
    time.sleep(delay)  # Wait for the specified delay

    ret, frame = cam.read()
    if not ret:
        cam.release()
        raise Exception("Failed to capture an image from the webcam")
    
    print("Image captured successfully.")
    cam.release()
    cv2.destroyAllWindows()
    return frame

def load_image_from_path(image_path):

    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at {image_path}")
    return image


def predict_class(img_path):
    from PIL import Image
    import numpy as np

    global loaded_descriptors
    image=Image.open(img_path).convert('RGB')
    image_np=np.array(image,'uint8')
    face_detection=face_detector(image_np,1)
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

        #cv2.putText(image_np, 'Pred: ' + str(name_pred), (10, 10), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0,0,255))
        #cv2.putText(image_np, 'Exp : ' + str(name_real), (10, 50), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (0,255,0))
        #print(name_pred)
        return name_pred
    
def get_class_from_np_img(image_np):
    
    results = [] 

    face_detection=face_detector(image_np,1)

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


