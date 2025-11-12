import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todos.js';

dotenv.config();

const app = express();

// ---------- Middleware ----------
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));

// ---------- DB ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// ---------- Routes ----------
app.use('/api/todos', todoRoutes);

// ---------- Health ----------
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ---------- Start ----------
const PORT = process.env.PORT?.trim() || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));