import './loadEnv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { connectDb } from './db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import { initSocket } from './socket';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

async function start() {
  try {
    await connectDb();
    initSocket(server);
    server.listen(PORT, () =>
      console.log(`API ready on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
