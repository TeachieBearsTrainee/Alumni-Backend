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
    const { content } = req.body;
    const filePath = req.files?.media; // Get uploaded files

    if (!content && (!req.files || req.files.media.length === 0)) {
        return res.status(400).json(new ApiResponse(400, null, "Post must have content or at least one media file"));
    }

     // ✅ Restrict media files to a maximum of 5
     if (filePath && filePath.length > 5) {
        return res.status(400).json(new ApiResponse(400, null, "A post cannot have more than 5 media files"));
    }

    let mediaUrls = [];

    try {
        if (filePath) {
            for (let i = 0; i < filePath.length; i++) {
                const fileType = filePath[i].mimetype.startsWith("image") ? "image" : "video";
                const uploadedFile = await uploadOnCloudinary(filePath[i].path, req.user.email, fileType);
                
                // ✅ Store the secure URL in the array
                mediaUrls.push(uploadedFile.secure_url);
            }
        }

        // ✅ Create and store the post in the database
        const newPost = await Post.create({
            content,
            media: mediaUrls
        });

        return res.status(201).json(new ApiResponse(201, newPost, "Post created successfully"));
    } catch (error) {
        // console.log("Error creating post:", error);

        // Cleanup Cloudinary uploads in case of error
        for (const url of mediaUrls) {
            await deleteOnCloudinary(url);
        }

        // Cleanup local files
        await Promise.all(filePath.map(file => fs.unlink(file.path).catch(() => {})));

        throw new ApiError(500, "Failed to create post");
    }
});









export { createPost, loginAdmin, logoutAdmin };
