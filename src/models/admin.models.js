import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema({
    profilePic: {
        type: String,
        trim: true,
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: "students"
    }],
    userId:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})





export const Admin = mongoose.model("Admin", adminSchema)