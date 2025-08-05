
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'insecure_default_secret_for_testing_only';

// In-memory "database"
let users = [];
let nextUserId = 1;

// API endpoint to get connection statuses
app.get('/api/status', (req, res) => {
    const statuses = {
        db: {
          status: 'CONNECTED',
          customPath: !!process.env.APP_DATA_PATH && process.env.APP_DATA_PATH !== './data'
        },
        gemini: process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall' ? 'CONNECTED' : 'NOT_CONFIGURED',
        jwt: JWT_SECRET !== 'insecure_default_secret_for_testing_only' ? 'CONFIGURED' : 'NOT_CONFIGURED',
        usersExist: users.length > 0
    };
    res.json(statuses);
});

// API endpoint to get admin users for login screen
app.get('/api/users/admins', (req, res) => {
    const adminUsers = users
      .map(u => ({ id: u.id, gameName: u.gameName }));
    res.json(adminUsers);
});

// API endpoint to create the first user
app.post('/api/users/create', (req, res) => {
    if (users.length > 0 && req.body.isInitialSetup) {
        return res.status(403).json({ message: 'Initial user already created.' });
    }

    const { firstName, lastName, gameName, birthday, pin, password } = req.body;
    if (!firstName || !gameName || !password) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const newUser = {
        id: nextUserId++,
        firstName,
        lastName,
        gameName,
        birthday,
        pin,
        password, // In a real app, hash and salt this!
    };
    users.push(newUser);

    const token = jwt.sign({ id: newUser.id, gameName: newUser.gameName }, JWT_SECRET, { expiresIn: '1d' });

    console.log('New user created:', newUser);
    console.log('Current users:', users);

    res.status(201).json({ token });
});

// API endpoint for user login
app.post('/api/auth/login', (req, res) => {
    const { userId, password } = req.body;
    
    if (!userId || !password) {
        return res.status(400).json({ message: 'User ID and password are required.' });
    }

    const user = users.find(u => u.id.toString() === userId.toString());

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // In a real app, use bcrypt.compare
    if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, gameName: user.gameName }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
});


// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
