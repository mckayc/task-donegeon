
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');

const UPLOADS_DIR = '/app/data/assets';
const REPO_URL = 'https://api.github.com/repos/google/codewithme-task-donegeon/contents/public/image-packs';

const router = express.Router();

// Fetch from GitHub API with proper headers
const fetchFromGitHub = (url) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'User-Agent': 'Task-Donegeon-App' }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', (err) => reject(err));
    });
};

router.get('/', async (req, res) => {
    // This is a simplified version; a real implementation would cache this.
    try {
        const contents = await fetchFromGitHub(REPO_URL);
        const packs = contents.filter(item => item.type === 'dir').map(dir => ({
            name: dir.name,
            sampleImageUrl: `https://raw.githubusercontent.com/google/codewithme-task-donegeon/main/public/image-packs/${dir.name}/_preview.png`
        }));
        res.json(packs);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch image packs from repository." });
    }
});

// ... More logic for fetching pack details and importing would go here ...

module.exports = router;
