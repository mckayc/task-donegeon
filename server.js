
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import fs from 'fs/promises';
import { AppDataSource, databaseDirectory, assetsDirectory } from './src/data/data-source.js';
import { User } from './src/data/entities/User.js';
import { Quest } from './src/data/entities/Quest.js';
import { QuestGroup } from './src/data/entities/QuestGroup.js';


// Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser());
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'insecure_default_secret_for_testing_only';

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
        const admins = await userRepository.find({ where: { role: 'admin' }, select: ['gameName', 'id'] });
        const firstRun = admins.length === 0;

        let dbStatus = 'ERROR';
        let dbPathInfo = null;
        if (AppDataSource.isInitialized) {
            dbStatus = process.env.APP_DATA_PATH ? 'CONNECTED_CUSTOM' : 'CONNECTED_DEFAULT';
            dbPathInfo = path.join(databaseDirectory, 'task-donegeon.sqlite');
        }

        const statuses = {
            firstRun,
            admins,
            db: dbStatus,
            dbPath: dbPathInfo,
            gemini: process.env.API_KEY && process.env.API_KEY !== 'thiswontworkatall' ? 'CONNECTED' : 'NOT_CONFIGURED',
            jwt: process.env.JWT_SECRET && process.env.JWT_SECRET !== 'insecure_default_secret_for_testing_only' ? 'CONFIGURED' : 'NOT_CONFIGURED'
        };
        res.json(statuses);
    } catch (error) {
        console.error("Error fetching status:", error);
        res.status(500).json({
            firstRun: true, // Assume first run on error
            admins: [],
            db: 'ERROR',
            dbPath: null,
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


// --- AUTH ENDPOINTS ---

// Auth endpoint for admin login
app.post('/api/auth/login', async (req, res) => {
    const { gameName, password } = req.body;
    if (!gameName || !password) {
        return res.status(400).json({ message: 'Game Name and password are required.' });
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const admin = await userRepository.findOne({ where: { gameName, role: 'admin' } });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials or not an admin.' });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: admin.id, gameName: admin.gameName, role: admin.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.json({ message: 'Login successful', user: { gameName: admin.gameName, role: admin.role } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).send();
    }
    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).send();
    }
};

// Auth endpoint to check current user session
app.get('/api/me', authMiddleware, (req, res) => {
    res.status(200).send();
});

// Auth endpoint for logout
app.post('/api/auth/logout', (req, res) => {
    res.cookie('token', '', { expires: new Date(0), httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ message: 'Logged out successfully.' });
});


// --- ASSET ENDPOINTS ---
app.get('/api/quests', authMiddleware, async (req, res) => {
    try {
        const questRepository = AppDataSource.getRepository(Quest);
        const quests = await questRepository.find({
            relations: ['questGroup'],
            order: {
                title: "ASC"
            }
        });
        res.json(quests);
    } catch (error) {
        console.error('Error fetching quests:', error);
        res.status(500).json({ message: 'An error occurred while fetching quests.' });
    }
});

app.get('/api/quest-groups', authMiddleware, async (req, res) => {
    try {
        const questGroupRepository = AppDataSource.getRepository(QuestGroup);
        const groups = await questGroupRepository.find({ order: { title: "ASC" } });
        res.json(groups);
    } catch (error) {
        console.error('Error fetching quest groups:', error);
        res.status(500).json({ message: 'An error occurred while fetching quest groups.' });
    }
});

// --- SETUP ENDPOINTS ---
app.post('/api/setup/seed-data', authMiddleware, async (req, res) => {
    const userRepository = AppDataSource.getRepository(User);
    const questGroupRepository = AppDataSource.getRepository(QuestGroup);
    const questRepository = AppDataSource.getRepository(Quest);
    
    try {
        const playerCount = await userRepository.count({ where: { role: 'player' } });
        if (playerCount > 0) {
            return res.status(409).json({ message: 'Sample data already exists. Aborting seed.' });
        }

        // 1. Create Sample Players
        const playersData = [
            { firstName: 'Leo', lastName: 'The Brave', gameName: 'LeoTheBrave', birthday: '2015-05-10', pin: '1234', role: 'player', password: 'password123' },
            { firstName: 'Mia', lastName: 'The Wise', gameName: 'MiaTheWise', birthday: '2014-09-22', pin: '5678', role: 'player', password: 'password123' },
        ];
        const createdPlayers = [];
        for (const playerData of playersData) {
            const hashedPin = await bcrypt.hash(playerData.pin, 10);
            const hashedPassword = await bcrypt.hash(playerData.password, 10);
            const newPlayer = userRepository.create({ ...playerData, pin: hashedPin, password: hashedPassword });
            const savedPlayer = await userRepository.save(newPlayer);
            createdPlayers.push(savedPlayer);
        }

        // 2. Seed Quest Groups from JSON file in the user-configurable assets directory
        const questGroupsPath = path.join(assetsDirectory, 'quest-groups', 'default.json');
        const questGroupsData = JSON.parse(await fs.readFile(questGroupsPath, 'utf-8'));

        for (const groupData of questGroupsData) {
            const existingGroup = await questGroupRepository.findOne({ where: { title: groupData.title } });
            if (!existingGroup) {
                const newGroup = questGroupRepository.create(groupData);
                await questGroupRepository.save(newGroup);
            }
        }
        
        // 3. Seed Quests from JSON file in the user-configurable assets directory
        const questsPath = path.join(assetsDirectory, 'quests', 'default.json');
        const questsData = JSON.parse(await fs.readFile(questsPath, 'utf-8'));

        for (const questData of questsData) {
            const existingQuest = await questRepository.findOne({ where: { title: questData.title } });
            if (!existingQuest) {
                const questGroup = await questGroupRepository.findOne({ where: { title: questData.questGroup } });
                
                const newQuest = questRepository.create({
                    ...questData,
                    questGroup: questGroup || null,
                    assignedUsers: createdPlayers // Assign to our new sample players
                });
                await questRepository.save(newQuest);
            }
        }
        
        res.status(201).json({ message: 'Sample players and assets created successfully!' });

    } catch (error) {
        console.error('Error seeding data:', error);
        res.status(500).json({ message: 'An error occurred while creating sample data.' });
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
