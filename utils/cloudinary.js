// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier'; // New: Buffer to stream

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const stream = cloudinary.uploader.upload_stream(
        { 
          folder: 'todos',
          resource_type: options.resource_type || 'auto',
          allowed_formats: options.allowed_formats || ['jpg', 'png', 'jpeg', 'pdf'],
          ...options 
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error.message);
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            resolve(result.secure_url);
          }
        }
      );
      // Critical: Use streamifier to pipe buffer to stream
      streamifier.createReadStream(buffer).pipe(stream);
    } catch (err) {
      console.error('Cloudinary Stream Setup Error:', err);
      reject(err);
    }
  });
};

export const deleteFromCloudinary = async (url) => {
  try {
    const publicId = url.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary Delete Error:', err.message);
  }
};