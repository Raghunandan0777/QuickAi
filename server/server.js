import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { clerkMiddleware,  requireAuth } from '@clerk/express'
import aiRouter from "./Route/aiRouter.js"
import connectCloudinary from "./configs/Cloudinary.js"
import userRouter from "./Route/userRouter.js"



// Load environment variables
dotenv.config()

await connectCloudinary()

// Initialize express app
const app = express()


// Middleware setup
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

// Root endpoint
app.get('/', (req,res) => {
    console.log("Root endpoint hit");
    res.send("server is live")
})



// API middleware
app.use(requireAuth())

// API routes
app.use('/api/ai', aiRouter)
app.use('/api/user', userRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error in middleware:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
   
});