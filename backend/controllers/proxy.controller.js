

const fetchEpub = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let fetchUrl;

    try {
        // Check if it's a full URL. If it fails to parse, it's a relative path.
        new URL(url);
        fetchUrl = url;
    } catch (error) {
        // It's a relative path, construct the full URL to fetch from our own server
        const protocol = req.protocol;
        const host = req.get('host');
        fetchUrl = `${protocol}://${host}${url}`;
    }

    try {
        console.log(`[EPUB PROXY] Universal fetch for: ${url} -> ${fetchUrl}`);
        const response = await fetch(fetchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[EPUB PROXY] Failed to fetch. Status: ${response.status}. Body: ${errorText}`);
            return res.status(response.status).json({ error: `Failed to fetch from external URL: ${response.statusText}` });
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/epub+zip');
        res.setHeader('Content-Length', buffer.length);
        
        console.log(`[EPUB PROXY] Successfully buffered ${buffer.length} bytes. Sending to client.`);
        res.send(buffer);

    } catch (error) {
        console.error('[EPUB PROXY ERROR]', error.name, error.message);
        res.status(500).json({ error: 'An internal error occurred while proxying the eBook.' });
    }
};

module.exports = { fetchEpub };