
const fetchEpub = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Basic URL validation
        const externalUrl = new URL(url);
        if (!['http:', 'https:', 'ftp:'].includes(externalUrl.protocol)) {
            return res.status(400).json({ error: 'Invalid URL protocol.' });
        }

        const response = await fetch(externalUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch from external URL: ${response.statusText}` });
        }

        // Pipe the response body to the client response.
        // This is efficient as it streams the data without buffering the whole file in memory.
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/epub+zip');
        const contentLength = response.headers.get('Content-Length');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        
        response.body.pipe(res);

    } catch (error) {
        console.error('[EPUB PROXY ERROR]', error);
        res.status(500).json({ error: 'An internal error occurred while trying to proxy the eBook.' });
    }
};

module.exports = { fetchEpub };
