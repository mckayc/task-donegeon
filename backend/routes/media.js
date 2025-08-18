
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const UPLOADS_DIR = '/app/data/assets';

const readGalleryRecursive = async (dir) => {
    let results = [];
    try {
        const list = await fs.readdir(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(await readGalleryRecursive(filePath));
            } else {
                 const relativePath = path.relative(UPLOADS_DIR, filePath);
                 const category = path.dirname(relativePath);
                 results.push({
                     url: `/uploads/${relativePath.replace(/\\/g, '/')}`,
                     name: path.basename(file),
                     category: category === '.' ? 'Miscellaneous' : category
                 });
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore if directory doesn't exist yet
            console.error("Error reading gallery directory:", error);
            throw error;
        }
    }
    return results;
}

module.exports = (upload) => {
    const router = express.Router();

    router.post('/upload', upload.single('file'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file was uploaded.' });
        }
        // The path needs to be relative to the UPLOADS_DIR to construct the correct URL
        const relativePath = path.relative(UPLOADS_DIR, req.file.path);
        // Ensure consistent forward slashes for URLs
        const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        res.status(201).json({ url: url });
    });

    router.get('/local-gallery', async (req, res) => {
        try {
            const gallery = await readGalleryRecursive(UPLOADS_DIR);
            res.json(gallery);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read image gallery.' });
        }
    });

    return router;
};
