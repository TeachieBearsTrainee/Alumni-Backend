import mongoose, { Schema } from "mongoose";

const mediaSchema = new Schema({
    url:{
        type:String,
    }
}, {
    timestamps: true
})





export const Media = mongoose.model("media", mediaSchema)