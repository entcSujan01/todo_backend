// routes/todos.js
import express from 'express';
import Todo from '../models/Todo.js';
import { multiUpload } from '../middleware/upload.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// GET all todos
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    console.error('GET /todos error:', err.message);
    res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// POST - Create new todo
router.post('/', multiUpload, async (req, res) => {
  try {
    console.log('POST /todos - Files:', !!req.files?.image, !!req.files?.pdf);
    console.log('POST /todos - Body:', req.body);

    const { text, dueDate, completed } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Text is required' });
    }

    let imageUrl = '';
    let pdfUrl = '';

    // === IMAGE UPLOAD ===
    const imageFile = req.files?.image?.[0];
    if (imageFile) {
      console.log(`Uploading image: ${imageFile.originalname} (${imageFile.buffer?.length || 0} bytes)`);
      if (!imageFile.buffer || imageFile.buffer.length === 0) {
        return res.status(400).json({ message: 'Image file is empty or corrupted' });
      }
      imageUrl = await uploadToCloudinary(imageFile.buffer, {
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      });
      console.log('Image uploaded:', imageUrl);
    }

    // === PDF UPLOAD ===
    const pdfFile = req.files?.pdf?.[0];
    if (pdfFile) {
      console.log(`Uploading PDF: ${pdfFile.originalname} (${pdfFile.buffer?.length || 0} bytes)`);
      if (!pdfFile.buffer || pdfFile.buffer.length === 0) {
        return res.status(400).json({ message: 'PDF file is empty or corrupted' });
      }
      pdfUrl = await uploadToCloudinary(pdfFile.buffer, {
        resource_type: 'raw',
        allowed_formats: ['pdf'],
      });
      console.log('PDF uploaded:', pdfUrl);
    }

    const todo = new Todo({
      text: text.trim(),
      dueDate: dueDate || null,
      imageUrl,
      pdfUrl,
      completed: completed === 'true',
    });

    const saved = await todo.save();
    console.log('Todo saved with ID:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('POST /todos error:', err.message);
    res.status(400).json({ message: err.message || 'Failed to create todo' });
  }
});

// PUT - Update existing todo
router.put('/:id', multiUpload, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    const { text, dueDate, completed } = req.body;

    // Update text fields
    if (text?.trim()) todo.text = text.trim();
    if (dueDate) todo.dueDate = dueDate;
    if (completed !== undefined) todo.completed = completed === 'true';

    // === IMAGE REPLACE ===
    const imageFile = req.files?.image?.[0];
    if (imageFile) {
      if (todo.imageUrl) {
        console.log('Deleting old image:', todo.imageUrl);
        await deleteFromCloudinary(todo.imageUrl);
      }
      console.log(`Uploading new image: ${imageFile.originalname}`);
      todo.imageUrl = await uploadToCloudinary(imageFile.buffer, { resource_type: 'image' });
    }

    // === PDF REPLACE ===
    const pdfFile = req.files?.pdf?.[0];
    if (pdfFile) {
      if (todo.pdfUrl) {
        console.log('Deleting old PDF:', todo.pdfUrl);
        await deleteFromCloudinary(todo.pdfUrl);
      }
      console.log(`Uploading new PDF: ${pdfFile.originalname}`);
      todo.pdfUrl = await uploadToCloudinary(pdfFile.buffer, { resource_type: 'raw' });
    }

    const updated = await todo.save();
    res.json(updated);
  } catch (err) {
    console.error('PUT /todos error:', err.message);
    res.status(400).json({ message: err.message || 'Failed to update todo' });
  }
});

// DELETE - Remove todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    // Delete associated files
    if (todo.imageUrl) {
      console.log('Deleting image from Cloudinary:', todo.imageUrl);
      await deleteFromCloudinary(todo.imageUrl);
    }
    if (todo.pdfUrl) {
      console.log('Deleting PDF from Cloudinary:', todo.pdfUrl);
      await deleteFromCloudinary(todo.pdfUrl);
    }

    await Todo.deleteOne({ _id: req.params.id });
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error('DELETE /todos error:', err.message);
    res.status(500).json({ message: 'Failed to delete todo' });
  }
});

export default router;