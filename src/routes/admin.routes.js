import express from "express";
import { createPost } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/createPost", verifyJWT, upload.fields([{name: "media", maxCount: 5}]), createPost); // ✅ Auth required

export default router;
