import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js"; // Import your User model

const authorizedRole = (...roles) => {
    return async (req, res, next) => {
        try {
            // Ensure req.user exists and has id
            if (!req.user || !req.user.id) {
                throw new ApiError(401, "User not authenticated 123");
            }

            // Fetch user details since tokens only contain userId
            const user = await User.findById(req.user.id);

            if (!user) {
                throw new ApiError(404, "User not found");
            }

            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: "You are not authorized to access this route" });
            }

            next(); // Continue to the next middleware

        } catch (error) {
            next(new ApiError(500, "Something went wrong while authorizing the user", error.message));
        }
    };
};

export { authorizedRole };