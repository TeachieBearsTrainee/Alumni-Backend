import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Handle Mongoose CastError
    if (error?.name === "CastError") {
        error = new ApiError(400, "Invalid ID format");
    }

    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || (error instanceof mongoose.Error ? 500 : 400);
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors || [], error?.stack);
    }

    const response = {
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack })
    };

    return res.status(error.statusCode || 500).json(response);
};

export { errorHandler };
