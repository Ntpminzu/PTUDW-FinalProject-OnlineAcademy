// File: src/middlewares/upload.mdw.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Đường dẫn đến thư mục public/temp_upload (dựa trên app.js, 'src/public' là thư mục tĩnh)
const tempUploadDir = path.join(__dirname, '../public/temp_upload');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
    console.log(`Đã tạo thư mục: ${tempUploadDir}`);
}

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempUploadDir); // Lưu file vào src/public/temp_upload
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất (Date + tên gốc) để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Khởi tạo multer với cấu hình lưu trữ
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 * 1024 // Giới hạn 200MB (cho video)
    },
    fileFilter: function (req, file, cb) {
        // Chỉ cho phép upload ảnh và video
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mov)$/i)) {
            return cb(new Error('Chỉ cho phép file ảnh (JPG, PNG, GIF, WEBP) hoặc video (MP4, WEBM, OGG, MOV).'), false);
        }
        cb(null, true);
    }
});

export default upload;