import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-blue-100">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Attendance System</h1>
                <p className="text-lg text-gray-600 mb-6">Click below to upload a photo for face recognition</p>
                <Link to="/upload">
                    <button className="bg-blue-500 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-600 transition duration-300">
                        Go to Upload Page
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default HomePage;
