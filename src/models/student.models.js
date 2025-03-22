import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema({
    fullname: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
        minlength: [3, "Full name must be at least 3 characters long"],
        maxlength: [50, "Full name cannot exceed 50 characters"]
    },
    bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"]
    },
    profilePic: {
        type: String,
    },
    degree: {
        type: String,
        required: [true, "Degree is required"],
        trim: true
    },
    branch: {
        type: String,
        required: [true, "Branch is required"],
        trim: true
    },
    graduationYear: {
        type: Number,
        required: [true, "Graduation year is required"],
        min: [2000, "Graduation year must be after 2000"],
        max: [2100, "Graduation year must be before 2100"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    graduationCertificate: {
        type: String,
        required: [true, "Graduation certificate is required"]
    },
    classRepresentative: {
        type: Boolean,
        default: false
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"]
    }
}, {
    timestamps: true,
    strict: true
});

export const Student = mongoose.model("Student", studentSchema);

