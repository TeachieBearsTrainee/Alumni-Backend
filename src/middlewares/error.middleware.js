import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import multer from "multer"; // Import Multer to check error type

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Handle Multer Errors
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            console.log("LIMIT_UNEXPECTED_FILE", error);
            error = new ApiError(400, "Unexpected file field. Please use 'media' as the key for file uploads.");
        } else if (error.code === "LIMIT_FILE_SIZE") {
            error = new ApiError(400, "File size exceeds the allowed limit of 50MB.");
        } else if (error.code === "LIMIT_FILE_COUNT") {
            error = new ApiError(400, "Too many files uploaded. Please upload a maximum of 5 files.");
        } else {
            error = new ApiError(400, "File upload error.");
        }
    }    

    // Handle Mongoose CastError (Invalid ID)
    if (error?.name === "CastError") {
        error = new ApiError(400, "Invalid ID format");
    }

    // Handle Mongoose ValidationError (Schema Validation)
    if (error instanceof mongoose.Error.ValidationError) {
        error = new ApiError(400, "Validation Error", error.errors);
    }

    // If not an ApiError, wrap it properly
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error instanceof mongoose.Error ? 500 : 400);
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], error?.stack);
    }

    // Response Object
    const response = {
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }) // Show stack trace only in dev mode
    };

    return res.status(error.statusCode || 500).json(response);
};

// Process-Level Error Handling (Prevents Crashes)
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

export { errorHandler };
