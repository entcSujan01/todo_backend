// routes/todos.js
import express from 'express';
import Todo from '../models/Todo.js';
import { multiUpload } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// GET all (unchanged)
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    console.error('GET Todos Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST (Fixed Upload with Logging)
router.post('/', multiUpload, async (req, res) => {
  try {
    console.log('POST Request Files:', req.files); // Log for debug
    console.log('POST Request Body:', req.body); // Log for debug

    const { text, dueDate, completed } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    let imageUrl = '', pdfUrl = '';

    // Image Upload
    if (req.files?.image?.[0]) {
      console.log('Uploading Image:', req.files.image[0].originalname);
      imageUrl = await uploadToCloudinary(req.files.image[0].buffer, {
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
      });
      console.log('Image Uploaded URL:', imageUrl);
    }

    // PDF Upload
    if (req.files?.pdf?.[0]) {
      console.log('Uploading PDF:', req.files.pdf[0].originalname);
      pdfUrl = await uploadToCloudinary(req.files.pdf[0].buffer, {
        resource_type: 'raw',
        allowed_formats: ['pdf'],
      });
      console.log('PDF Uploaded URL:', pdfUrl);
    }

    const todo = new Todo({
      text,
      dueDate: dueDate || null,
      imageUrl,
      pdfUrl,
      completed: completed === 'true',
    });

    const saved = await todo.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('POST Todos Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// PUT / UPDATE (Similar Fixes)
router.put('/:id', multiUpload, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });

    todo.text = req.body.text ?? todo.text;
    todo.dueDate = req.body.dueDate ?? todo.dueDate;
    todo.completed = req.body.completed !== undefined ? req.body.completed === 'true' : todo.completed;

    // Image Update
    if (req.files?.image?.[0]) {
      if (todo.imageUrl) await deleteFromCloudinary(todo.imageUrl);
      todo.imageUrl = await uploadToCloudinary(req.files.image[0].buffer, { resource_type: 'image' });
    }
    // PDF Update
    if (req.files?.pdf?.[0]) {
      if (todo.pdfUrl) await deleteFromCloudinary(todo.pdfUrl);
      todo.pdfUrl = await uploadToCloudinary(req.files.pdf[0].buffer, { resource_type: 'raw' });
    }

    const updated = await todo.save();
    res.json(updated);
  } catch (err) {
    console.error('PUT Todos Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// DELETE (Unchanged)
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });

    if (todo.imageUrl) await deleteFromCloudinary(todo.imageUrl);
    if (todo.pdfUrl) await deleteFromCloudinary(todo.pdfUrl);

    await Todo.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE Todos Error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;