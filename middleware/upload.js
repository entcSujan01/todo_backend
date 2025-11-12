import multer from 'multer';

// Store files in memory → stream directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.fieldname === 'pdf' && file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: (req, file) => {
      return file.fieldname === 'pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    },
  },
  fileFilter,
});

export const multiUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);