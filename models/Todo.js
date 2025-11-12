import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  dueDate: { type: Date },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Todo', todoSchema);