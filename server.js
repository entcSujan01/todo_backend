// server.js – FINAL PRODUCTION VERSION
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todos.js';

dotenv.config();

const app = express();

// ---------- CORS (Bulletproof) ----------
app.use((req, res, next) => {
  const origin = process.env.CLIENT_URL || 'https://todo-frontend-ten-omega.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'https://todo-frontend-ten-omega.vercel.app',
  credentials: true,
}));

// ---------- Body Parser ----------
app.use(express.json({ limit: '15mb' }));

// ---------- DB ----------
let dbConnected = false;
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    dbConnected = true;
  } catch (err) {
    console.error('MongoDB error:', err);
    dbConnected = false;
  }
};
connectDB();

// ---------- Routes ----------
app.use('/api/todos', (req, res, next) => {
  if (!dbConnected) return res.status(503).json({ error: 'DB not ready' });
  next();
}, todoRoutes);

// ---------- Health ----------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: dbConnected ? 'connected' : 'disconnected' });
});

// ---------- 404 ----------
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Export for Vercel ----------
export default app;