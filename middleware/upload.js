// middleware/upload.js
import multer from 'multer';

const storage = multer.memoryStorage();  // Critical: Memory only (Vercel-safe)

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    console.error('Multer Filter Reject:', file.fieldname, file.mimetype);
    cb(new Error(`Invalid file: ${file.fieldname}`), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB
  fileFilter,
});

export const multiUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);