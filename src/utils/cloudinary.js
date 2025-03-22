import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";


const uploadOnCloudinary = async (localFilePath, email, fileType) => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        if (!localFilePath) return null;

        const sanitizedEmail = email.replace(/[@.]/g, "_");

        // ✅ Correct format logic
        let format = "jpg"; // Default for profile pictures
        if (fileType === "pdf") format = "pdf"; // For certificates only

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: fileType === "pdf" ? "auto" : "image", // 🔥 Ensures PDFs are handled correctly
            public_id: `${sanitizedEmail}_${fileType}`,
            format, // ✅ Ensures correct format for each file type
            overwrite: false
        });

        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        if (localFilePath) {
            fs.unlinkSync(localFilePath);
        }
        throw new ApiError(500, "Something went wrong while uploading to cloudinary", error.message);
    }
};




const deleteOnCloudinary = async (publicId) => {
    try {
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
          });
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting from cloudinary", error.message);
    }
}



export {uploadOnCloudinary, deleteOnCloudinary}