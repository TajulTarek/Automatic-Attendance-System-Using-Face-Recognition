import sys
import json
import cv2
import numpy as np
import os
import dlib
import pickle
from PIL import Image
from datetime import datetime

def load_mp(file_path):
    with open(file_path, 'rb') as f:
        loaded_mp = pickle.load(f)
    #print(f"Dictionary loaded from {file_path}")
    return loaded_mp

def save_mp(mp, file_path):
    with open(file_path, 'wb') as f:
        pickle.dump(mp, f)
    #print(f"Dictionary saved to {file_path}")

def process_image(image_path, ID):
    try:
        folder_path = "C:/Users/tarek/OneDrive/Desktop/Attendance/cropped/train/" + ID
        image = Image.open(image_path).convert("RGB")
        image_np = np.array(image, 'uint8')

        # Create the folder if it doesn't exist
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

        # Initialize dlib components
        face_detector = dlib.get_frontal_face_detector()
        points_detector = dlib.shape_predictor('C:/Users/tarek/OneDrive/Desktop/Attendance/Weights/shape_predictor_68_face_landmarks.dat')
        face_descriptor_extractor = dlib.face_recognition_model_v1('C:/Users/tarek/OneDrive/Desktop/Attendance/Weights/dlib_face_recognition_resnet_model_v1.dat')

        # Detect faces in the image
        face_detection = face_detector(image_np, 1)

        # Load or initialize face descriptors
        descriptors_path = "C:/Users/tarek/OneDrive/Desktop/Attendance/Model/face_descriptors_final.npy"
        if os.path.exists(descriptors_path):
            loaded_descriptors = np.load(descriptors_path)
        else:
            loaded_descriptors = np.empty((0, 128))  # Initialize an empty array with 128 columns
        #print(f"Loaded face descriptors with shape: {loaded_descriptors.shape}")

        # Load or initialize the mapping dictionary
        loaded_mp = load_mp("C:/Users/tarek/OneDrive/Desktop/Attendance/Model/mp_final.pkl")

        for face in face_detection:
            # Extract the face region
            x, y, w, h = face.left(), face.top(), face.width(), face.height()
            cropped_face = image_np[y:y+h, x:x+w]

            # Save the cropped face image
            current_time = datetime.now().strftime("%Y%m%d_%H%M%S")  # Format: YYYYMMDD_HHMMSS
            face_filename = os.path.join(folder_path, f"face_{current_time}.jpg")
            cv2.imwrite(face_filename, cv2.cvtColor(cropped_face, cv2.COLOR_RGB2BGR))
            #print(f"Saved cropped face image: {face_filename}")

            # Compute face descriptor
            points = points_detector(image_np, face)
            face_descriptor = face_descriptor_extractor.compute_face_descriptor(image_np, points)
            face_descriptor = [f for f in face_descriptor]
            face_descriptor = np.asarray(face_descriptor, dtype=np.float64)
            face_descriptor = face_descriptor[np.newaxis, :]

            # Append the new descriptor to the existing descriptors
            loaded_descriptors = np.concatenate((loaded_descriptors, face_descriptor), axis=0)
            #print(face_descriptor)

            # Update the mapping dictionary
            loaded_mp[face_filename] = ID

        # Save the updated descriptors and mapping

        descriptors_save_path="C:/Users/tarek/OneDrive/Desktop/Attendance/Model/face_descriptors_final.npy"
        np.save(descriptors_save_path, loaded_descriptors)
        #print(f"Face descriptors saved to {descriptors_path}")

        mp_file_path = 'C:/Users/tarek/OneDrive/Desktop/Attendance/Model/mp_final.pkl'
        save_mp(loaded_mp, mp_file_path)

        return {"success": True, "message": "Successfully Added"}

    except Exception as e:
        print(f"Error: {e}")
        return {"success": False, "message": str(e)}

# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "message": "Invalid arguments"}))
        sys.exit(1)

    image_path = sys.argv[1]
    ID = sys.argv[2]

    result = process_image(image_path, ID)
    print(json.dumps(result))  # ✅ Ensure JSON is printed
    sys.exit(0 if result["success"] else 1) 