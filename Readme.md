# API Documentation

## Overview
This API provides authentication and post management functionalities for Admin users. It includes user registration, login, logout, and post creation with structured error handling.

## Base URL
```
https://alumni-backend-kjdc.onrender.com/api/v1
```

---

## 1. **Register User API**

### Endpoint
```
POST /register
```

### Request Body
```json
{
    "email": "user@example.com", // required
    "password": "securePassword", // required
    "fullname": "John Doe", 
    "bio": "Software Developer",
    "profilePic": "https://example.com/profile.jpg",  
    "degree": "BSc IT", // required
    "branch": "Computer Science", // required
    "graduationYear": 2025, // required 
    "graduationCertificate": "https://example.com/certificate.jpg" // required
}
```

### Expected Responses
**Success:**
- **Status Code:** `201`
- **Response Body:**
```json
{
    "status": 200,
    "data": {
        "user": { ... },
        "student": { ... }
    },
    "message": "User registered successfully"
}
```

**Errors:**
- **400:** Missing required fields (e.g., `email`, `password`, etc.)
- **409:** Email already exists
- **500:** Internal server error

---

## 2. **Login User API**

### Endpoint
```
POST /login
```

### Request Body
```json
{
    "email": "user@example.com",
    "password": "securePassword"
}
```

### Expected Responses
**Success:**
- **Status Code:** `200`
- **Response Body:**
```json
{
    "status": 200,
    "data": {
        "user": { ... },
        "accessToken": "<ACCESS_TOKEN>",
        "refreshToken": "<REFRESH_TOKEN>"
    },
    "message": "User logged in successfully"
}
```

**Errors:**
- **400:** Missing required fields (`email`, `password`)
- **404:** Invalid credentials
- **401:** Incorrect password

---

## 3. **Logout User API**

### Endpoint
```
POST /logout
```

### Headers
```
Authorization: Bearer <ACCESS_TOKEN>
```

### Expected Responses
**Success:**
- **Status Code:** `200`
- **Response Body:**
```json
{
    "status": 200,
    "message": "User logged out successfully"
}
```

**Errors:**
- **401:** Missing or invalid token
- **500:** Internal server error

---

## 4. **Create Post (Admin Only)**

### Endpoint
```
POST /admin/createPost
```

### Headers
```
Authorization: Bearer <ACCESS_TOKEN>
```

### Request Body
```json
{
    "content": "This is a test post",
    "media": ["https://example.com/image1.jpg", "https://example.com/image2.png"]
}
```

### Expected Responses
**Success:**
- **Status Code:** `201`
- **Response Body:**
```json
{
    "status": 201,
    "message": "Post created successfully",
    "data": {
        "post": { ... }
    }
}
```

**Errors:**
- **400:** Missing content or media
- **401:** Unauthorized (Admin only)
- **500:** Internal server error

---

## Error Handling

### Common Errors:
- **400 Bad Request:** Invalid input or missing fields
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Unexpected server issues

---

## File Upload Rules
- Maximum **5** files per request
- Supported formats: **JPEG, PNG, GIF, PDF, MP4, MPEG, AVI, MOV**
- Maximum file size: **50MB per file**

---

## Notes
- Secure cookies (`httpOnly`, `secure`, `sameSite=Strict`) are used for authentication tokens
- Cloudinary is used for media storage
- Mongoose handles data validation and database operations

---
This documentation provides a clear and beginner-friendly guide for integrating authentication and post creation in the frontend application.

