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
    print(f"Dictionary loaded from {file_path}")
    return loaded_mp

def test_load():
    descriptors_path = "C:/Users/tarek/OneDrive/Desktop/Attendance/Model/face_descriptors_final.npy"
    if os.path.exists(descriptors_path):
        loaded_descriptors = np.load(descriptors_path)
    else:
        loaded_descriptors = np.empty((0, 128))  # Initialize an empty array with 128 columns
    print(f"Loaded face descriptors with shape: {loaded_descriptors.shape}")
    loaded_mp=load_mp("C:/Users/tarek/OneDrive/Desktop/Attendance/Model/mp_final.pkl")
    print(loaded_mp)

test_load()