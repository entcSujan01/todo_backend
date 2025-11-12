// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todos.js';

dotenv.config();

const app = express();

// ---------- CORS (Production-Ready) ----------
app.options('*', cors()); // Handle preflight for all routes

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'https://todo-frontend-entcsujan01s-projects.vercel.app', // Hardcoded fallback
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Fallback: Force headers (defense in depth)
app.use((req, res, next) => {
  const origin = process.env.CLIENT_URL || 'https://todo-frontend-entcsujan01s-projects.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// ---------- Body Parser ----------
app.use(express.json({ limit: '15mb' }));

// ---------- DB Connection (Resilient) ----------
let dbConnected = false;
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');
    dbConnected = true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    dbConnected = false;
    // Don't exit – Vercel serverless can retry
  }
};

connectDB();

// ---------- Routes ----------
app.use('/api/todos', (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  next();
}, todoRoutes);

// ---------- Health Check ----------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ---------- 404 ----------
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------- Global Error Handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---------- Start Server (Vercel Serverless Export) ----------
const PORT = process.env.PORT?.trim() || 5000;

// For local dev
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;