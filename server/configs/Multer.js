import multer from "multer";
import path from "path";
import fs from "fs";

// Use /tmp directory which is writable in Vercel's serverless environment
const uploadPath = "/tmp/uploads";

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

export { upload };
export default upload;