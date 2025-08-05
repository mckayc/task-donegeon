import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/auth/status
// Checks if the application has been set up (i.e., if any user exists)
router.get('/status', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        res.json({ isSetupComplete: userCount > 0 });
    } catch (error) {
        console.error("Error checking status:", error);
        res.status(500).json({ error: "Could not check application status." });
    }
});

// POST /api/auth/setup
// Creates the first administrative user. This can only be done once.
router.post('/setup', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return res.status(403).json({ error: 'Setup has already been completed.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { username, passwordHash },
        });

        res.status(201).json({ message: 'Master account created successfully.' });
    } catch (error) {
        console.error("Error during setup:", error);
        res.status(500).json({ error: 'Failed to create master account.' });
    }
});

// POST /api/auth/login
// Logs in a user and returns a JWT
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error("JWT_SECRET is not defined.");
        return res.status(500).json({ error: "Server configuration error." });
    }

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({ token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

export default router;
