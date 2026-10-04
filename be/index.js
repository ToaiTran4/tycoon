import 'dotenv/config.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { apiRouter } from './src/routes/games.js';
import { setIo } from './src/services/realtime.js';
import { boot as bootScheduler } from './src/services/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) }));
}
app.use(express.json({ limit: '5mb' }));
app.use('/api', apiRouter);

const FE_DIST = process.env.FE_DIST || '../fe/dist';
const feDist = path.resolve(__dirname, FE_DIST);
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FE !== 'false') {
  app.use(express.static(feDist));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(feDist, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: '/socket.io',
  cors: process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) } : undefined,
});
io.on('connection', (socket) => {
  socket.on('join', (code) => {
    if (typeof code === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(code)) {
      socket.join(`game-${code}`);
    }
  });
});
setIo(io);
await bootScheduler();

const PORT = Number(process.env.PORT ?? 3000);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[tycoon] server listening on 0.0.0.0:${PORT}`);
});
