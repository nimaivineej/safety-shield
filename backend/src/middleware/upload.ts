import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ValidationError } from '../utils/errors';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedAudioTypes = /webm|ogg|mp4|m4a|mpeg|wav/;

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = allowedImageTypes.test(ext) && allowedImageTypes.test(file.mimetype);
    const isAudio =
        allowedAudioTypes.test(ext) ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype === 'video/webm'; // Chrome records webm with video/webm mime

    if (isImage || isAudio) {
        return cb(null, true);
    } else {
        cb(new ValidationError('Only image or audio files are allowed'));
    }
};

// Configure multer
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    },
    fileFilter: fileFilter,
});
