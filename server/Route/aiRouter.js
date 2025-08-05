import express from "express";
import { requireAuth } from "@clerk/express";
import { auth } from "../middleware/auth.js";
import { generateArticle, generateBlogTitle, generateImage, removeImageBackGround, removeImageObject, ReviewResume } from "../controllers/aiController.js";
import { upload } from "../configs/Multer.js";

const aiRouter = express.Router();

aiRouter.post("/generate-article", requireAuth(), auth, generateArticle);
aiRouter.post("/generate-blog-title", requireAuth(), auth, generateBlogTitle);
aiRouter.post("/generate-image", requireAuth(), auth, generateImage);

aiRouter.post("/remove-image-background", upload.single("image") , auth, removeImageBackGround);
aiRouter.post("/review-resume", upload.single("resume") , auth, ReviewResume);
aiRouter.post("/remove-image-object", upload.single("image") , auth, removeImageObject);




export default aiRouter;
