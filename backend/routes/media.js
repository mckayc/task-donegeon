
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const category = req.body.category || 'Miscellaneous';
        const categoryPath = path.join(UPLOAD_DIR, category);
        await fs.mkdir(categoryPath, { recursive: true });
        cb(null, categoryPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
    }
});
const upload = multer({ storage });

router.post('/media/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const category = req.body.category || 'Miscellaneous';
    res.json({ url: `/uploads/${encodeURIComponent(category)}/${encodeURIComponent(req.file.filename)}` });
});

router.get('/media/local-gallery', async (req, res) => {
    try {
        const allImages = [];
        const items = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });

        for (const item of items) {
            if (item.isDirectory()) {
                const category = item.name;
                const files = await fs.readdir(path.join(UPLOAD_DIR, category));
                files.forEach(file => allImages.push({ url: `/uploads/${category}/${file}`, category, name: file }));
            } else {
                 allImages.push({ url: `/uploads/${item.name}`, category: 'Miscellaneous', name: item.name });
            }
        }
        res.json(allImages);
    } catch (e) {
        if (e.code === 'ENOENT') { // Directory doesn't exist yet
            res.json([]);
        } else {
            console.error("Error reading gallery:", e);
            res.status(500).json({error: 'Could not read gallery.'});
        }
    }
});


module.exports = router;
