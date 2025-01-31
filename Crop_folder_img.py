import cv2
import os

def crop_face(image_path):
    # Read the image
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # Convert to grayscale for face detection

    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return None  # No face detected

    # Take the first face (you can modify this to select a specific one if needed)
    (x, y, w, h) = faces[0]

    # Crop the face from the image
    cropped_img = img[y:y+h, x:x+w]

    return cropped_img

data_dir = "C:/Users/tarek/OneDrive/Desktop/more ds/Pics 2020331097-20250129T165336Z-001"
cropped_data_dir = 'c:/Users/tarek/OneDrive/Desktop/Attendance/temp_data'


face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

valid_extensions = {".jpg", ".jpeg", ".png"}

for person in os.listdir(data_dir):
    print(person)
    person_path = os.path.join(data_dir, person)
    if os.path.isdir(person_path):
        # Filter valid and existing image files
        images = [
            img for img in os.listdir(person_path)
            if os.path.splitext(img)[1].lower() in valid_extensions and
            os.path.exists(os.path.join(person_path, img))
        ]


        cropped_img_dir = os.path.join(cropped_data_dir, person)
        os.makedirs(cropped_img_dir, exist_ok=True)
        for img in images:
            src_path = os.path.join(person_path, img)
            cropped_img = crop_face(src_path)

            if cropped_img is not None:
                # Save the cropped face image
                dest_path = os.path.join(cropped_img_dir, img)
                cv2.imwrite(dest_path, cropped_img)

