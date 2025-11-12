// utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';  // New: Buffer → stream

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Cloudinary: Starting upload, buffer size:', buffer.length);  // Log size

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
            console.log('Cloudinary Success URL:', result.secure_url);
            resolve(result.secure_url);
          }
        }
      );

      // Critical: Pipe buffer to stream using streamifier
      streamifier.createReadStream(buffer).pipe(stream);
    } catch (err) {
      console.error('Cloudinary Stream Error:', err);
      reject(err);
    }
  });
};

export const deleteFromCloudinary = async (url) => {
  try {
    const publicId = url.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId);
    console.log('Cloudinary Delete Success:', publicId);
  } catch (err) {
    console.error('Cloudinary Delete Error:', err.message);
  }
};