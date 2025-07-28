
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const handleRequest = require('../utils/requestHandler');
const { loadData } = require('../db');
const router = express.Router();

const BACKUP_DIR = process.env.BACKUP_PATH || path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);

router.get('/backups', async (req, res) => {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backups = await Promise.all(files.filter(f => f.endsWith('.json')).map(async f => {
            const stats = await fs.stat(path.join(BACKUP_DIR, f));
            return { filename: f, createdAt: stats.mtime.toISOString(), size: stats.size };
        }));
        res.json(backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (e) {
        if (e.code === 'ENOENT') {
            res.json([]);
        } else {
            console.error("Error reading backups:", e);
            res.status(500).json({error: "Failed to read backups."});
        }
    }
});

router.post('/backups/create', async (req, res) => {
    try {
        const data = await loadData();
        const filename = `backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
        await fs.writeFile(path.join(BACKUP_DIR, filename), JSON.stringify(data, null, 2));
        res.status(201).json({ message: 'Backup created successfully.' });
    } catch (e) { 
        console.error('Backup creation failed:', e);
        res.status(500).json({ error: 'Backup failed.' }); 
    }
});

router.get('/backups/:filename', (req, res) => {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    res.download(filePath, (err) => {
        if(err) {
            console.error("Backup download error:", err);
            res.status(404).json({error: 'File not found.'});
        }
    });
});

router.delete('/backups/:filename', async (req, res) => {
    try {
        await fs.unlink(path.join(BACKUP_DIR, req.params.filename));
        res.json({ message: 'Backup deleted.' });
    } catch (e) { res.status(500).json({ error: 'Delete failed.' }); }
});

router.post('/backups/restore/:filename', handleRequest(async (data, req) => {
    try {
        const backupData = await fs.readFile(path.join(BACKUP_DIR, req.params.filename), 'utf-8');
        const dataToRestore = JSON.parse(backupData);
        // Overwrite the entire data object
        Object.keys(data).forEach(key => delete data[key]);
        Object.assign(data, dataToRestore);
        return { body: { message: 'Restore successful.' }};
    } catch (e) {
        console.error('Backup restore failed:', e);
        throw new Error('Restore failed.');
    }
}));


module.exports = router;
