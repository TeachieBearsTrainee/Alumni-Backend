import asyncHandler from "express-async-handler";
import { User } from "../models/user.models.js";
import { deleteLocalFiles } from "./user.controller.js";
import { Post } from "../models/post.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs/promises';


const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json(
            new ApiResponse(
                400,
                null,
                "Email and password are required."
            )
        );
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json(
            new ApiResponse(
                404,
                null,
                "Invalid email or password."
            )
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        return res.status(401).json(
            new ApiResponse(
                401,
                null,
                "Invalid email or password."
            )
        );
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    // Remove sensitive data before sending
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true, // Ensures cookies are sent only over HTTPS
        sameSite: 'Strict' // Improves CSRF protection
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully."
            )
        );
});

const logoutAdmin = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"))
})

const createPost = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;
        const files = req.files?.media || []; // Ensure `files` is always an array

        // ✅ Validate post content or media presence
        if (!content && files.length === 0) {
            return res.status(400).json(new ApiResponse(400, null, "Post must have content or at least one media file"));
        }

        // ✅ Restrict media files to a maximum of 5
        if (files.length > 5) {
            return res.status(400).json(new ApiResponse(400, null, "A post cannot have more than 5 media files"));
        }

        let mediaUrls = [];

        // ✅ Upload files if present
        for (const file of files) {
            if (!file?.path) continue; // Safeguard against unexpected `undefined` files

            const fileType = file.mimetype.startsWith("image") ? "image" : "video";
            const uploadedFile = await uploadOnCloudinary(file.path, req.user.email, fileType);

            mediaUrls.push(uploadedFile.secure_url);
        }

        // ✅ Store the post in the database
        const newPost = await Post.create({
            content,
            media: mediaUrls,
        });

        return res.status(201).json(new ApiResponse(201, newPost, "Post created successfully"));
    } catch (error) {
        console.error("Error creating post:", error);

        // ✅ Cleanup Cloudinary uploads in case of error
        await Promise.all(mediaUrls.map(url => deleteOnCloudinary(url)));

        // ✅ Cleanup local files safely
        if (req.files?.media) {
            await Promise.all(req.files.media.map(file => fs.unlink(file.path).catch(() => {})));
        }

        next(new ApiError(500, "Failed to create post"));
    }
});










export { createPost, loginAdmin, logoutAdmin };
