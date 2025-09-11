

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

        console.log(`[EPUB PROXY] Fetching: ${externalUrl.toString()}`);
        const response = await fetch(externalUrl.toString(), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[EPUB PROXY] Failed to fetch from external URL. Status: ${response.status}. Body: ${errorText}`);
            return res.status(response.status).json({ error: `Failed to fetch from external URL: ${response.statusText}` });
        }

        // Buffer the entire response. This is less memory-efficient but more compatible
        // with libraries that use range requests, as we send the whole file at once.
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/epub+zip');
        res.setHeader('Content-Length', buffer.length);
        
        console.log(`[EPUB PROXY] Successfully fetched and buffered ${buffer.length} bytes. Sending to client.`);
        res.send(buffer);

    } catch (error) {
        console.error('[EPUB PROXY ERROR]', error.name, error.message, error.stack);
        res.status(500).json({ error: 'An internal error occurred while trying to proxy the eBook.' });
    }
};

module.exports = { fetchEpub };