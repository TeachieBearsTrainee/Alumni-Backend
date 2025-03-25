// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"
// import { ApiError } from "./ApiError.js";


// const uploadOnCloudinary = async (localFilePath, email, fileType) => {
//     try {
//         cloudinary.config({
//             cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//             api_key: process.env.CLOUDINARY_API_KEY,
//             api_secret: process.env.CLOUDINARY_API_SECRET
//         });

//         if (!localFilePath) return null;

//         const sanitizedEmail = email.replace(/[@.]/g, "_");

//         // ✅ Correct format logic
//         let format = "jpg"; // Default for profile pictures
//         if (fileType === "pdf") format = "pdf"; // For certificates only

//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: fileType === "pdf" ? "auto" : "image", // 🔥 Ensures PDFs are handled correctly
//             public_id: `${sanitizedEmail}_${fileType}`,
//             format, // ✅ Ensures correct format for each file type
//             overwrite: false
//         });

//         fs.unlinkSync(localFilePath);
//         return response;

//     } catch (error) {
//         if (localFilePath) {
//             fs.unlinkSync(localFilePath);
//         }
//         throw new ApiError(500, "Something went wrong while uploading to cloudinary", error.message);
//     }
// };




// const deleteOnCloudinary = async (publicId) => {
//     try {
//         cloudinary.config({ 
//             cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//             api_key: process.env.CLOUDINARY_API_KEY, 
//             api_secret: process.env.CLOUDINARY_API_SECRET 
//           });
//         const response = await cloudinary.uploader.destroy(publicId);
//         return response;
//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while deleting from cloudinary", error.message);
//     }
// }



// export {uploadOnCloudinary, deleteOnCloudinary}

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

/**
 * Configures Cloudinary credentials
 */
const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - Path to the local file
 * @param {string} email - User's email
 * @param {string} fileType - Type of file (e.g., image, pdf, video)
 * @returns {object|null} - Cloudinary response or null
 */

const uploadOnCloudinary = async (localFilePath, email, fileType) => {
    try {
        if (!localFilePath) return null;

        configureCloudinary();

        const sanitizedEmail = email.replace(/[@.]/g, "_");

        // Define format based on file type
        let format = "jpg"; // Default format for images
        if (fileType === "pdf") format = "pdf";

        // Ensure unique public_id to prevent overwrites
        const timestamp = Date.now();
        const publicId = `${sanitizedEmail}_${fileType}_${timestamp}`;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: fileType === "pdf" ? "auto" : "image",
            public_id: publicId,
            format,
            overwrite: false
        });

        // Delete local file after successful upload
        try {
            fs.unlinkSync(localFilePath);
        } catch (err) {
            console.error("Error deleting local file:", err.message);
        }

        return response;
    } catch (error) {
        // Cleanup local file if upload fails
        try {
            if (localFilePath) fs.unlinkSync(localFilePath);
        } catch {}

        throw new ApiError(500, "Cloudinary upload failed", error.message);
    }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {object} - Cloudinary response
 */
const deleteOnCloudinary = async (publicId) => {
    try {
        configureCloudinary();
        const response = await cloudinary.uploader.destroy(publicId);
        return response;
    } catch (error) {
        throw new ApiError(500, "Cloudinary deletion failed", error.message);
    }
};

export { uploadOnCloudinary, deleteOnCloudinary };
