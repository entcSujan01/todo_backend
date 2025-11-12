// middleware/upload.js
import multer from 'multer';

const storage = multer.memoryStorage(); // Memory only (Vercel-safe)

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    console.error(`Multer Filter Error: Invalid file type for ${file.fieldname} - ${file.mimetype}`);
    cb(new Error(`Invalid file type for ${file.fieldname}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter,
});

export const multiUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);