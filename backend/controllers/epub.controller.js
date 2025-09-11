
const Epub = require("epub").Epub;
const path = require('path');
const fs = require('fs').promises;
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const MEDIA_DIR = process.env.CONTAINER_MEDIA_PATH || path.resolve(__dirname, '..', '..', 'media');

const validatePath = async (relativePath) => {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error('File path must be provided.');
    }
    // Normalize the path by removing the expected prefix, regardless of leading slashes.
    const pathPrefix = '/media/';
    let cleanRelativePath = relativePath;
    if (cleanRelativePath.startsWith(pathPrefix)) {
        cleanRelativePath = cleanRelativePath.substring(pathPrefix.length);
    } else if (cleanRelativePath.startsWith('media/')) {
        cleanRelativePath = cleanRelativePath.substring('media/'.length);
    }

    const resolvedMediaDir = path.resolve(MEDIA_DIR);
    const requestedFullPath = path.join(resolvedMediaDir, cleanRelativePath);
    const resolvedFullPath = path.resolve(requestedFullPath);

    if (!resolvedFullPath.startsWith(resolvedMediaDir)) {
        console.warn(`[EPUB Security] Attempted directory traversal: ${relativePath}`);
        throw new Error('Invalid file path.');
    }

    try {
        await fs.access(resolvedFullPath);
        return resolvedFullPath;
    } catch (error) {
        throw new Error(`EPUB file not found on the server at path: ${relativePath}`);
    }
};


const parseEpubMetadata = async (req, res) => {
    const { path: relativePath } = req.query;
    try {
        const fullPath = await validatePath(relativePath);
        const epub = new Epub(fullPath);
        
        epub.on("end", () => {
            if (!res.headersSent) {
                res.json({
                    title: epub.title,
                    author: epub.author,
                    toc: epub.toc,
                });
            }
        });

        epub.on("error", (err) => {
            console.error("EPUB parsing error:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: `Failed to parse EPUB file: ${err.message}` });
            }
        });

        epub.parse();

    } catch (error) {
        if (!res.headersSent) {
            res.status(400).json({ error: error.message });
        }
    }
};

const getEpubChapter = async (req, res) => {
    const { path: relativePath, chapterId } = req.query;
     if (!chapterId) {
        return res.status(400).json({ error: 'Chapter ID is required.' });
    }

    try {
        const fullPath = await validatePath(relativePath);
        const epub = new Epub(fullPath);
        
        epub.on("end", () => {
            epub.getChapter(chapterId, (err, html) => {
                if (err) {
                    console.error(`Error getting chapter ${chapterId}:`, err);
                    if (!res.headersSent) {
                       return res.status(404).json({ error: `Chapter not found: ${err.message}` });
                    }
                    return;
                }
                const sanitizedHtml = DOMPurify.sanitize(html);
                res.setHeader('Content-Type', 'text/html');
                res.send(sanitizedHtml);
            });
        });

         epub.on("error", (err) => {
            console.error("EPUB parsing error:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: `Failed to parse EPUB file: ${err.message}` });
            }
        });

        epub.parse();
        
    } catch (error) {
         if (!res.headersSent) {
            res.status(400).json({ error: error.message });
        }
    }
};


module.exports = {
    parseEpubMetadata,
    getEpubChapter,
};
