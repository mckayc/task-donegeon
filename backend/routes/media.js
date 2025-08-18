
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const UPLOADS_DIR = '/app/data/assets';

module.exports = (upload) => {
    const router = express.Router();

    router.post('/upload', upload.single('file'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const relativePath = path.relative(UPLOADS_DIR, req.file.path);
        const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        res.status(201).json({ url });
    });

    const readGallery = async (dir) => {
        let results = [];
        const list = await fs.readdir(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.stat(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(await readGallery(filePath));
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
        return results;
    }

    router.get('/local-gallery', async (req, res) => {
        try {
            const gallery = await readGallery(UPLOADS_DIR);
            res.json(gallery);
        } catch (error) {
            res.status(500).json({ error: 'Failed to read image gallery.' });
        }
    });

    return router;
};
