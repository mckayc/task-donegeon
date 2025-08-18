
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const { pipeline } = require('stream/promises');

const UPLOADS_DIR = '/app/data/assets';
const REPO_URL_BASE = 'https://api.github.com/repos/google/codewithme-task-donegeon/contents/public/image-packs';
const RAW_URL_BASE = 'https://raw.githubusercontent.com/google/codewithme-task-donegeon/main/public/image-packs';

const router = express.Router();

const fetchFromGitHub = (url) => {
    return new Promise((resolve, reject) => {
        const options = { headers: { 'User-Agent': 'Task-Donegeon-App' } };
        https.get(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`GitHub API responded with status code ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
};

// GET /api/image-packs
router.get('/', async (req, res) => {
    try {
        const contents = await fetchFromGitHub(REPO_URL_BASE);
        const packs = contents
            .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
            .map(dir => ({
                name: dir.name,
                sampleImageUrl: `${RAW_URL_BASE}/${dir.name}/_preview.png`
            }));
        res.json(packs);
    } catch (error) {
        console.error("Could not fetch image packs list:", error);
        res.status(500).json({ error: "Could not fetch image packs from repository." });
    }
});

// GET /api/image-packs/:packName
router.get('/:packName', async (req, res) => {
    try {
        const packName = req.params.packName;
        const packContents = await fetchFromGitHub(`${REPO_URL_BASE}/${packName}`);
        
        const filesWithStatus = await Promise.all(
            packContents
                .filter(item => item.type === 'file' && !item.name.startsWith('_'))
                .map(async (file) => {
                    const localPath = path.join(UPLOADS_DIR, packName, file.name);
                    const exists = await fs.access(localPath).then(() => true).catch(() => false);
                    return {
                        name: file.name,
                        category: packName,
                        url: file.download_url,
                        exists
                    };
                })
        );
        res.json(filesWithStatus);
    } catch (error) {
         console.error(`Could not fetch details for pack ${req.params.packName}:`, error);
        res.status(500).json({ error: `Could not fetch details for pack.` });
    }
});

// POST /api/image-packs/import
router.post('/import', async (req, res) => {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'Invalid file list provided.' });
    }

    try {
        for (const file of files) {
            const destDir = path.join(UPLOADS_DIR, file.category);
            await fs.mkdir(destDir, { recursive: true });
            const destPath = path.join(destDir, file.name);

            const response = await fetch(file.url);
            if (!response.ok || !response.body) {
                throw new Error(`Failed to download ${file.name}`);
            }
            const fileStream = fs.createWriteStream(destPath);
            await pipeline(response.body, fileStream);
        }
        res.status(200).json({ message: `${files.length} files imported successfully.` });
    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ error: `Import failed: ${error.message}` });
    }
});

module.exports = router;
