import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();

// app.use(cors({
//     origin: "http://localhost:5173",
//     methods:"*",
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"]
// }));

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5175",
    "http://localhost:5174",
    "https://alumni-client-rajendra.vercel.app",
    "https://alumni-client-delta.vercel.app"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods:"*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Logging
app.use(morgan("common"));

// Common Middleware
app.use(express.json({ limit: "10mb" }));  // Increased limit for larger payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRoute from "./routes/user.routes.js";
import adminRoute from "./routes/admin.routes.js";
import { verifyJWT } from "./middlewares/auth.middleware.js";
import { refreshAccessToken } from "./controllers/user.controller.js";
import { authorizedRole } from "./middlewares/role.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Routes
app.use("/api/v1/", userRoute);
app.use("/api/v1/admin",refreshAccessToken, verifyJWT, authorizedRole("admin"), adminRoute);
app.get("/api/v1/check", refreshAccessToken, verifyJWT, authorizedRole("user"), (req, res) => {
    res.send("authorized");
});
app.get("/api/v1/vercel-check", (req, res) => {
    res.send("vercel");
});

// Error Handling Middleware (ALWAYS LAST)
app.use(errorHandler);

export { app };