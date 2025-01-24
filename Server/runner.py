import subprocess

# Define the command
command = [
    "python", 
    "detect.py", 
    "--weights", "best.pt", 
    "--source", "C:/Users/tarek/OneDrive/Desktop/Attendance/group.webp"
]

# Run the command and capture the output
try:
    result = subprocess.run(
        command, 
        capture_output=True, 
        text=True,  # Ensures the output is a string
        check=True  # Raises an error if the command fails
    )

    for line in result.stdout.splitlines():
        x1, y1, x2, y2 = map(int, line.split())

except subprocess.CalledProcessError as e:
    print("Error running detect.py:")
    print(e.stderr)
