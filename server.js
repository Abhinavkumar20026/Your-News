// server.js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ---- Your API Keys ----
const NEWS_API_KEY = 'eb6dcc6f13384539835c4a12294bfe22';
const COHERE_API_KEY = 'CU4oozb40BCwMiHNPWPSL0rF8J8JWn8H9eBEtpxA';

// ------------------------
// API endpoint to fetch news and generate summaries
// ------------------------
app.get('/api/news', async(req, res) => {
    try {
        const response = await fetch(`https://newsapi.org/v2/top-headlines?category=general&country=us&apiKey=${NEWS_API_KEY}`);
        const data = await response.json();

        if (!data.articles || data.articles.length === 0) {
            return res.status(500).json({ message: 'No news found' });
        }

        // Generate summaries for each article
        const articlesWithSummary = await Promise.all(
            data.articles.map(async(article) => {
                let summary = 'No summary available.';
                if (article.description) {
                    try {
                        const summaryResp = await fetch('https://api.cohere.ai/v1/summarize', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${COHERE_API_KEY}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                model: 'summarize-xlarge',
                                text: article.description,
                            }),
                        });

                        const summaryData = await summaryResp.json();
                        summary = summaryData.summary || summary;
                    } catch (error) {
                        console.error('Cohere API error:', error);
                        summary = 'Failed to generate summary.';
                    }
                }
                return {...article, summary };
            })
        );

        res.json(articlesWithSummary);
    } catch (err) {
        console.error('News API error:', err);
        res.status(500).json({ message: 'Error fetching news' });
    }
});

// ------------------------
// Catch-all route for SPA or frontend pages
// ------------------------
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// ------------------------
// Start server
// ------------------------
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});