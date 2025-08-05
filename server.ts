
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq, sql } from 'drizzle-orm';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'insecure_default_secret_for_testing_only';

// API endpoint to get connection statuses
app.get('/api/status', async (_req, res) => {
    const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const usersExist = userCountResult[0].count > 0;

    const statuses = {
        db: {
          status: 'CONNECTED',
          customPath: !!process.env.APP_DATA_PATH && process.env.APP_DATA_PATH !== './data'
        },
        gemini: process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall' ? 'CONNECTED' : 'NOT_CONFIGURED',
        jwt: JWT_SECRET !== 'insecure_default_secret_for_testing_only' ? 'CONFIGURED' : 'NOT_CONFIGURED',
        usersExist: usersExist
    };
    res.json(statuses);
});

// API endpoint to get admin users for login screen
app.get('/api/users/admins', async (_req, res) => {
    try {
        const adminUsers = await db.select({ id: users.id, gameName: users.gameName }).from(users);
        res.json(adminUsers);
    } catch (error) {
        console.error('Failed to fetch admin users:', error);
        res.status(500).json({ message: 'Error fetching users from database.' });
    }
});

// API endpoint to create the first user
app.post('/api/users/create', async (req, res) => {
    if (req.body.isInitialSetup) {
        const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
        if (userCountResult[0].count > 0) {
            return res.status(403).json({ message: 'Initial user already created.' });
        }
    }

    const { firstName, lastName, gameName, birthday, pin, password } = req.body;
    if (!firstName || !gameName || !password) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUsers = await db.insert(users).values({
            firstName,
            lastName,
            gameName,
            birthday,
            pin,
            password: hashedPassword,
        }).returning({
            id: users.id,
            gameName: users.gameName
        });
        
        const newUser = newUsers[0];
        const token = jwt.sign({ id: newUser.id, gameName: newUser.gameName }, JWT_SECRET, { expiresIn: '1d' });

        console.log('New user created:', newUser);
        res.status(201).json({ token });

    } catch(error) {
        console.error('Failed to create user:', error);
        res.status(500).json({ message: 'Error creating user in database.' });
    }
});

// API endpoint for user login
app.post('/api/auth/login', async (req, res) => {
    const { userId, password } = req.body;
    
    if (!userId || !password) {
        return res.status(400).json({ message: 'User ID and password are required.' });
    }

    try {
        const userResult = await db.select().from(users).where(eq(users.id, Number(userId)));

        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const user = userResult[0];
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user.id, gameName: user.gameName }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An internal error occurred during login.' });
    }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
