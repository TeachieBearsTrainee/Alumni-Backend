import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    content: {
        type: String,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    media: [{
        type: String
    }]
}, {
    timestamps: true
});






export const Post = mongoose.model("post", postSchema)