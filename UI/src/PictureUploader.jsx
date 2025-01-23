import React, { useState } from "react";
import axios from "axios";

const PictureUploader = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setResult(null);
        setError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setError("Please select a file to upload.");
            return;
        }

        // Convert the image to base64 string
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Image = reader.result.split(',')[1]; // Extract base64 string from the data URI
            try {
                // Send the base64 image string to the Flask backend
                const response = await axios.post("http://localhost:5000/predict", { image: base64Image });
                setResult(response.data);
            } catch (err) {
                setError("An error occurred while processing the file. Please try again. "+err);
            }
        };

        reader.readAsDataURL(selectedFile); // Read the file as a Data URL (Base64)
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Upload Image for Face Recognition</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Select Image</label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={handleFileChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md mt-2"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition duration-300"
                    >
                        Submit
                    </button>
                </form>

                {result && (
                    <div className="mt-6 bg-green-100 p-4 rounded-md">
                        <h2 className="text-xl font-semibold text-green-800">Prediction Result</h2>
                        <pre className="text-sm text-gray-700">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                )}
                {error && (
                    <div className="mt-6 bg-red-100 p-4 rounded-md">
                        <h2 className="text-xl font-semibold text-red-800">Error</h2>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PictureUploader;
