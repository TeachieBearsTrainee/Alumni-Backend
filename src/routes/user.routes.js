import {Router} from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(upload.fields([{name: "profilePic", maxCount: 1}, {name: "graduationCertificate", maxCount: 1}]),registerUser)

// SecuredRoute
router.route("/login").post(loginUser) 
router.route("/logout").post(verifyJWT, logoutUser)


// router.route("/register").get(registerUser)

export default router