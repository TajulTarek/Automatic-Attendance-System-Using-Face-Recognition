import subprocess

# Define the command
def yolo_detect(img_path):
    command = [
        "python", 
        "./Server/yolov9-face-detection/yolov9/detect.py", 
        "--weights", "./Server/yolov9-face-detection/yolov9/best.pt",
        "--source", img_path
    ]

    try:
        result = subprocess.run(
            command, 
            capture_output=True, 
            text=True,  # Ensures the output is a string
            check=True  # Raises an error if the command fails
        )
        points=[]
        for line in result.stdout.splitlines():
            x1, y1, x2, y2 = map(int, line.split())
            #print(x1,y1,x2,y2)
            points.append([x1,y1,x2,y2]);
        return points

    except subprocess.CalledProcessError as e:
        print("Error running detect.py:")
        print(e.stderr)

