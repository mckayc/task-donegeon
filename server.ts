
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import http from 'http';
import { WebSocketServer } from 'ws';
import { AppDataSource } from './src/data/data-source';
import { User } from './src/data/entities/User';
import { User as UserInterface } from './types';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'a-secure-secret-for-jwt-should-be-in-env';

// WebSocket setup
wss.on('connection', ws => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => console.log('Client disconnected'));
});

const broadcast = (data: any) => {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
};

// Initialize database
AppDataSource.initialize()
  .then(() => console.log("Data Source has been initialized!"))
  .catch((err) => console.error("Error during Data Source initialization:", err));

// --- API Endpoints ---

// Pre-run check for frontend wizard
app.get('/api/pre-run-check', async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const adminCount = await userRepository.count({ where: { role: 'Donegeon Master' } });
        // In a real app with migrations, we'd check a settings table.
        // For now, if an admin exists, we assume data exists.
        if (adminCount > 0) {
            res.json({ dataExists: true, version: 1, appName: 'Task Donegeon' });
        } else {
            res.json({ dataExists: false });
        }
    } catch (error) {
        console.error("Pre-run check failed:", error);
        // If the DB isn't ready, it's effectively a first run for the user.
        res.json({ dataExists: false });
    }
});


// First Run: Create Admin
app.post('/api/first-run', async (req, res) => {
  const { adminUserData, setupChoice, blueprint } = req.body;
  
  const userRepository = AppDataSource.getRepository(User);
  const adminExists = await userRepository.findOne({ where: { role: 'Donegeon Master' } });
  if (adminExists) {
    return res.status(403).json({ error: 'An admin account already exists.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(adminUserData.password, 10);
    const hashedPin = await bcrypt.hash(adminUserData.pin, 10);

    const newAdmin = userRepository.create({
      ...adminUserData,
      password: hashedPassword,
      pin: hashedPin,
      // Ensure default values are set
      avatar: {},
      ownedAssetIds: [],
      personalPurse: {},
      personalExperience: {},
      guildBalances: {},
      ownedThemes: ['emerald', 'rose', 'sky'],
      hasBeenOnboarded: true,
    });
    
    await userRepository.save(newAdmin);

    // TODO: Implement logic for 'guided', 'scratch', 'import' setups
    // This would involve seeding other tables (Quests, Guilds, etc.)
    
    // For now, we just create the admin and send back the initial state
    const data = await getFullState();
    broadcast({ type: 'FULL_STATE_UPDATE', payload: data });
    
    res.status(201).json({ message: 'Setup complete!', user: newAdmin });
  } catch (error) {
    console.error('First run error:', error);
    res.status(500).json({ error: 'Failed to create admin user.' });
  }
});


// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Helper to get full state - replace with more granular updates later
async function getFullState(): Promise<{ users: UserInterface[] }> {
    const users = await AppDataSource.getRepository(User).find();
    return { users };
}