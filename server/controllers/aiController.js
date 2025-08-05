import { GoogleGenerativeAI } from "@google/generative-ai";
import { clerkClient } from "@clerk/express";
import sql from "../configs/db.js";
import { response } from "express";
import { v2 as cloudinary } from "cloudinary"
import axios from "axios";
import FormData from 'form-data';
import { Buffer } from "buffer";
import { v4 as uuidv4 } from 'uuid';
import fs from "fs";
import { PDFDocument } from 'pdf-lib';
import Replicate from "replicate";

import upload from "../configs/Multer.js";
import { url } from "inspector";
// import cloudinary from "../utils/cloudinary.js";

const LIGHTX_API_KEY = process.env.LIGHTX_API_KEY;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;

    // Validate input
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Article topic is required"
      });
    }

    // Determine word count based on length
    let wordCount = "";
    let targetWords = "";

    if (length <= 800) {
      wordCount = "500-800 words";
      targetWords = "short";
    } else if (length <= 1200) {
      wordCount = "800-1200 words";
      targetWords = "medium";
    } else {
      wordCount = "1200+ words";
      targetWords = "long";
    }

    const articlePrompt = `
      Write a comprehensive, well-structured article on the topic: "${prompt}"

      Requirements:
      - Length: ${wordCount}
      - Professional and engaging tone
      - Clear structure with introduction, main content, and conclusion
      - Use proper headings and subheadings
      - Make it informative and valuable to readers
      - Include relevant examples where appropriate

      Structure:
      1. Compelling headline/title
      2. Engaging introduction that hooks the reader
      3. Well-organized main content with clear sections
      4. Strong conclusion that summarizes key points
      5. Natural flow between paragraphs

      Please write a ${targetWords} article that provides real value to readers interested in this topic.
    `;

    console.log(`Generating ${targetWords} article for user ${userId}`);

    // Generate article using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(articlePrompt);
    const article = await result.response.text();

    // Save to database
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${articlePrompt}, ${article}, 'article')
    `;

    console.log(`Article generated successfully for user ${userId}`);

    res.json({
      success: true,
      content: article,
      message: "Article generated successfully!",
      metadata: {
        topic: prompt,
        targetLength: wordCount,
        generatedLength: article.length
      }
    });

  } catch (error) {
    console.error("Error in GenerateArticle:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate article. Please try again."
    });
  }
};


export const generateBlogTitle = async (req, res) => {
  try {
    console.log("Blog title request received:", {
      keyword: req.body.keyword,
      category: req.body.category
    });

    const { userId } = req.auth();
    const { keyword, category } = req.body;
    const plan = req.plan;

    // Validate input
    if (!keyword) {
      console.log("Error: Keyword is missing");
      return res.status(400).json({
        success: false,
        message: "Keyword is required"
      });
    }

    // Create model instance
    console.log("Creating AI model instance");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("AI model instance created");

    // Create a structured prompt
    const prompt = `Generate a compelling, SEO-friendly blog title for the following topic:
    
    Keyword: ${keyword}
    Category: ${category}
    
    The title should be attention-grabbing, concise, and suitable for ${category.toLowerCase()} content.`;
    console.log("Generated prompt:", prompt);

    try {
      console.log("Generating content with AI");
      const result = await model.generateContent(prompt);
      console.log("AI response received");
      const response = await result.response;
      const title = await response.text();

      console.log("Generated title:", title);

      // Format and return the response
      return res.status(200).json({
        success: true,
        title: title.trim()
      });
    } catch (aiError) {
      console.error("Error in AI generation:", aiError);
      throw aiError;
    }
  } catch (error) {
    console.error("Error in generateBlogTitle handler:", {
      message: error.message,
      stack: error.stack
    });

    // Return a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? error.message
      : "Failed to generate blog title";

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};





export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth(); // Updated for Clerk's latest API
    const { prompt, publish } = req.body;
    const plan = req.plan;

    console.log("Detected Plan:", plan);

    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "This feature is only available for premium subscribers"
      });
    }

    // Stability AI API Request
    const response = await axios.post(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    );

    const imageBase64 = response.data.artifacts[0].base64;
    const base64Image = `data:image/png;base64,${imageBase64}`;

    // Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(base64Image, {
      public_id: `ai-image-${uuidv4()}`,
      folder: "generated"
    });

    // Save to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({
      success: true,
      content: secure_url,
      message: "Image generated successfully!"
    });

  } catch (error) {
    console.error("Error generating image:", error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate image: " + (error?.response?.data?.message || error.message)
    });
  }
};


export const removeImageBackGround = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    console.log("Detected Plan:", plan);

    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "This feature is only available for premium subscribers"
      });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    // Upload to Cloudinary
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      // NOTE: Actual background removal requires an Add-on or external tool.
      transformation: [{ effect: "background_removal" }],
    });

    // Save to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${"Remove background from image"}, ${secure_url}, ${'image'}, ${false})
    `;

    res.json({
      success: true,
      content: secure_url,
      message: "Background removed successfully!"
    });

  } catch (error) {
    console.error("Error removing background:", error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to remove background: " + (error?.response?.data?.message || error.message)
    });
  }
};


// {......Object removal.........}


export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const { object } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "This feature is only available for premium subscribers"
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(image.path);
    const { public_id } = uploadResult;

    // Generate URL with object removal transformation
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image"
    });

    // Insert into database
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'image')
    `;

    res.json({
      success: true,
      content: imageUrl,
      message: "Successfully removed object from image!"
    });

  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to remove object: " + (error?.response?.data?.message || error.message)
    });
  }
};








// ... (rest of the code remains the same)
// Simple function to extract basic text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    // Note: pdf-lib doesn't have built-in text extraction
    // This is a basic implementation - for better text extraction,
    // you might need to use it with other libraries

    let text = '';
    for (let i = 0; i < pages.length; i++) {
      // This is a simplified approach
      // pdf-lib is mainly for PDF creation/modification, not text extraction
      text += `Page ${i + 1} content\n`;
    }

    return text;
  } catch (error) {
    throw new Error('Failed to process PDF: ' + error.message);
  }
}

export const ReviewResume = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        error: true,
        message: "This feature is only available for premium subscribers"
      });
    }

    if (!resume) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "The file size exceeds the allowed limit (5MB)"
      });
    }

    if (resume.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid PDF file"
      });
    }

    // For now, let's use a simple approach - convert PDF to base64 and send to Gemini directly
    const dataBuffer = fs.readFileSync(resume.path);
    const base64Pdf = dataBuffer.toString('base64');

    const prompt = `
      I have uploaded a PDF resume. Please analyze this resume and provide detailed feedback on:

      **STRENGTHS:**
      - Positive aspects of the resume
      - Strong points in experience and skills

      **AREAS FOR IMPROVEMENT:**
      - Content gaps or weaknesses
      - Missing information
      - Better presentation suggestions

      **FORMATTING & STRUCTURE:**
      - Layout and organization feedback
      - Readability improvements

      **RECOMMENDATIONS:**
      - Specific actionable steps
      - Keywords to consider adding
      - Industry best practices

      **OVERALL SCORE:** Rate from 1-10 with explanation.

      Please provide comprehensive, constructive feedback to help improve this resume.
    `;

    // Send PDF directly to Gemini for analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Pdf
        }
      },
      { text: prompt }
    ]);

    const feedback = await result.response.text();

    // Save feedback to DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${feedback}, 'resume')
    `;

    // Clean up uploaded file
    try {
      fs.unlinkSync(resume.path);
    } catch (cleanupError) {
      console.log('File cleanup warning:', cleanupError.message);
    }

    res.json({
      success: true,
      content: feedback,
      message: "Resume reviewed successfully!"
    });

  } catch (error) {
    console.error("Error in ReviewResume:", error);

    // Clean up uploaded file in case of error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('File cleanup warning:', cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to review resume: " + error.message
    });
  }
};