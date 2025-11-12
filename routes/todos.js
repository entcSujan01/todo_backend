import express from 'express';
import Todo from '../models/Todo.js';
import { multiUpload } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// GET all
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE
router.post('/', multiUpload, async (req, res) => {
  try {
    const { text, dueDate, completed } = req.body;
    let imageUrl = '', pdfUrl = '';

    if (req.files?.image?.[0]) {
      imageUrl = await uploadToCloudinary(req.files.image[0].buffer, {
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png'],
      });
    }
    if (req.files?.pdf?.[0]) {
      pdfUrl = await uploadToCloudinary(req.files.pdf[0].buffer, {
        resource_type: 'raw',
        allowed_formats: ['pdf'],
      });
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
    res.status(400).json({ message: err.message });
  }
});

// UPDATE
router.put('/:id', multiUpload, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });

    todo.text = req.body.text ?? todo.text;
    todo.dueDate = req.body.dueDate ?? todo.dueDate;
    todo.completed = req.body.completed !== undefined ? req.body.completed === 'true' : todo.completed;

    if (req.files?.image?.[0]) {
      if (todo.imageUrl) await deleteFromCloudinary(todo.imageUrl);
      todo.imageUrl = await uploadToCloudinary(req.files.image[0].buffer, { resource_type: 'image' });
    }
    if (req.files?.pdf?.[0]) {
      if (todo.pdfUrl) await deleteFromCloudinary(todo.pdfUrl);
      todo.pdfUrl = await uploadToCloudinary(req.files.pdf[0].buffer, { resource_type: 'raw' });
    }

    const updated = await todo.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Not found' });

    if (todo.imageUrl) await deleteFromCloudinary(todo.imageUrl);
    if (todo.pdfUrl) await deleteFromCloudinary(todo.pdfUrl);

    await Todo.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;