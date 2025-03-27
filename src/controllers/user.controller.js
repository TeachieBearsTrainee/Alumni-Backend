import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "express-async-handler"
import jwt from "jsonwebtoken";
import { Student } from "../models/student.models.js";
import mongoose from "mongoose";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from 'fs/promises';
import { Post } from "../models/post.model.js";

const deleteLocalFiles = async (filePaths) => {
    // console.log("filePaths (before check):", filePaths);

    // Ensure filePaths is an array or convert it if needed
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];

    for (const path of paths) {
        if (path) {
            try {
                await fs.unlink(path);
                // console.log(`Deleted file: ${path}`);
            } catch (err) {
                // console.error(`Failed to delete file: ${path}`, err);
            }
        }
    }
};

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        // console.log("Error generating access and refresh token", error)
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    const { email, password, ...studentData } = req.body;
    // if (!password) {
    //     await deleteLocalFiles(req.files?.graduationCertificate?.[0]?.path);
    //     return res.status(400).json(new ApiResponse(400, null, "Password is required"));
    // }

    // if (!email) {
    //     await deleteLocalFiles(req.files?.graduationCertificate?.[0]?.path);
    //     return res.status(400).json(new ApiResponse(400, null, "Email is required"));
    // }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        await deleteLocalFiles(req.files?.graduationCertificate?.[0]?.path);
        throw new ApiError(409, "User with this email already exists");
    }

    const filePaths = {
        profilePicPath: req.files?.profilePic?.[0]?.path,
        graduationCertificatePath: req.files?.graduationCertificate?.[0]?.path,
        introVideoPath: req.files?.introVideo?.[0]?.path
    };

    const uploadedFiles = {};

    try {
        for (const [key, path] of Object.entries(filePaths)) {
            if (path) {
                const fileType = key.includes("Video") ? "video" : key.includes("Certificate") ? "pdf" : "image";
                uploadedFiles[key] = await uploadOnCloudinary(path, email, fileType);
            }
        }
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        await deleteLocalFiles(filePaths);
        throw new ApiError(500, "Failed to upload files.");
    }

    try {
        const user = new User({ email, password });
        const student = new Student({
            ...studentData,
            userID: user.id,
            profilePic: uploadedFiles.profilePicPath?.url,
            graduationCertificate: uploadedFiles.graduationCertificatePath?.url,
            introVideo: uploadedFiles.introVideoPath?.url
        });

        await user.save({ session });
        await student.save({ session });

        await session.commitTransaction();
        session.endSession();

        await deleteLocalFiles(filePaths);

        return res.status(201).json(new ApiResponse(200, { user, student }, "User registered successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        await deleteLocalFiles(filePaths);
        for (const file of Object.values(uploadedFiles)) {
            if (file) await deleteOnCloudinary(file.public_id);
        }

        if (error.name === "ValidationError") {
            const errorMessages = Object.values(error.errors).map(err => err.message);
            throw new ApiError(400, errorMessages.join(", "));
        }

        throw new ApiError(500, "Something went wrong while registering the user");
    }
});


const loginUser = asyncHandler(async (req, res) => {
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

const logoutUser = asyncHandler(async (req, res) => {
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

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        return next(new ApiError(401, "Refresh token is required"));
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?.id);

        if (!user || incomingRefreshToken !== user.refreshToken) {
            // console.log(incomingRefreshToken, "|", user?.refreshToken);
            return next(new ApiError(401, "Invalid refresh token"));
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict" // Added for CSRF protection
        };

        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

        res
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
        // .status(200)
        // .json({ message: "Access token refreshed successfully" });  // Added response

        next();

    } catch (error) {
        // console.error("Error refreshing token:", error);

        if (error.name === "TokenExpiredError") {
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            return next(new ApiError(401, "Refresh token expired"));
        }

        return next(new ApiError(500, "Something went wrong while refreshing access token"));
    }
});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findByIdAndUpdate(req.user._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(401, "Old password is invalid")
    }

    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    return res.status(200).json(new ApiResponse(200, "Password changed successfully"))
})

const getPosts = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    // Fetch posts with pagination
    const posts = await Post.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v");

    if (posts.length === 0) {
        throw new ApiError(404, "No posts found");
    }

    // Use ApiResponse for structured response
    return res.status(200).json(
        new ApiResponse(200, {
            currentPage: page,
            totalPages,
            totalPosts,
            posts
        }, "Posts fetched successfully")
    );
});



export { registerUser, loginUser, refreshAccessToken, logoutUser, changeCurrentPassword, generateAccessAndRefereshTokens, deleteLocalFiles, getPosts }
