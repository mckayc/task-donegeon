
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { AppDataSource } from './src/data/data-source.js';
import { User } from './src/data/entities/User.js';

// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
const PORT = process.env.PORT || 3000;

// Initialize database connection on server start
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });

// API endpoint to get connection statuses and first-run status
app.get('/api/status', async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const admin = await userRepository.findOne({ where: { role: 'admin' } });
        const firstRun = !admin;

        let dbStatus = 'ERROR';
        if (AppDataSource.isInitialized) {
            dbStatus = process.env.DATABASE_PATH ? 'CONNECTED_CUSTOM' : 'CONNECTED_DEFAULT';
        }

        const statuses = {
            firstRun,
            db: dbStatus,
            gemini: process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall' ? 'CONNECTED' : 'NOT_CONFIGURED',
            jwt: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'insecure_default_secret_for_testing_only' ? 'CONFIGURED' : 'NOT_CONFIGURED'
        };
        res.json(statuses);
    } catch (error) {
        console.error("Error fetching status:", error);
        res.status(500).json({
            firstRun: true, // Assume first run on error
            db: 'ERROR',
            gemini: 'NOT_CONFIGURED',
            jwt: 'NOT_CONFIGURED',
        });
    }
});

// API endpoint to create the first admin user
app.post('/api/users/create-admin', async (req, res) => {
    const userRepository = AppDataSource.getRepository(User);
    const adminExists = await userRepository.findOne({ where: { role: 'admin' } });

    if (adminExists) {
        return res.status(403).json({ message: 'An admin account already exists.' });
    }

    const { firstName, lastName, gameName, birthday, pin, password } = req.body;

    if (!firstName || !lastName || !gameName || !birthday || !pin || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(pin, 10);

        const newUser = userRepository.create({
            firstName,
            lastName,
            gameName,
            birthday,
            pin: hashedPin,
            password: hashedPassword,
            role: 'admin',
        });

        await userRepository.save(newUser);
        res.status(201).json({ message: 'Admin account created successfully.' });
    } catch (error) {
        console.error('Error creating admin user:', error);
        // Check for unique constraint violation on gameName
        if (error.code === 'SQLITE_CONSTRAINT') {
             return res.status(409).json({ message: 'That Game Name is already taken.' });
        }
        res.status(500).json({ message: 'An error occurred while creating the admin account.' });
    }
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