import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import validator from "validator"

const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"];

const userSchema = new Schema({
    email: {
        type: String,
        // required: [true, 'Please enter your email'],
        unique: [true, "Email already exists"],
        lowercase: true,
        trim: true,
        validate: {
            validator: function (value) {
                if (!validator.isEmail(value)) return false; // First, check if it's a valid email
    
                const domain = value.split('@')[1]; // Extract domain part
                return allowedDomains.includes(domain); // Check if it's in the allowed list
            },
            message: 'Please enter a valid email with an allowed domain',
        },
    },
    password: {
        type: String,
        // required: [true, "Password is required"],
        // minlength: [8, "Password must be at least 8 characters"],
        // maxlength: [12, "Password must be less than 12 characters"],
    },
    refreshToken: {
        type: String
    },
    role: { 
        type: String, 
        enum: ["user", "admin"], 
        default: "user" 
    },
}, {
    timestamps: true
})

/*--------------------------------*/ 

// Mongoose pre-save hook to hash the password before saving the user document
userSchema.pre("save", async function (next) {
    // Check if the password field has been modified
    if (!this.isModified("password")) return next();  // If password is not changed, skip hashing and proceed

    // Hash the new password before saving
    this.password = await bcrypt.hash(this.password, 10);  // Hash the password

    next();  // Proceed to save the document after hashing
});


userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

/*--------------------------------*/ 


// Method to generate an access token for a user       "SYNTAX:- jwt.sign(payload, secret, options)"
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            id: this._id,          // Unique user ID from MongoDB
            email: this.email,      // User's email for authentication
        },
        process.env.ACCESS_TOKEN_SECRET, // Secret key used to sign the token
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Token expiration time
    );
};


// Method to generate a refresh token for a user
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id  // Unique user ID from MongoDB (used to identify the user)
        },
        process.env.REFRESH_TOKEN_SECRET, // Secret key used to sign the refresh token
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY } // Token expiration time (longer duration than access token)
    );
};


/*--------------------------------*/ 





export const User = mongoose.model("User", userSchema)