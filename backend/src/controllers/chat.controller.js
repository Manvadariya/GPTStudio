import { performQuery, performStreamingQuery } from '../logic/query.js';

// Non-streaming chat handler
export const handleChat = async (req, res) => {
    const { question, documentIds, systemPrompt, history, modelProvider } = req.body;
    const userId = req.user.id;

    if (!question) {
        return res.status(400).json({ message: 'A "question" is required.' });
    }
    if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ message: 'An array of "documentIds" is required.' });
    }

    try {
        const result = await performQuery({
            userId,
            question,
            documentIds,
            systemPrompt,
            history: history || [],
            modelProvider: modelProvider || 'gpt-5-nano'
        });

        res.status(200).json({
            answer: result.answer,
            model: result.modelUsed,
        });

    } catch (error) {
        console.error("Chat handling error:", error);
        res.status(500).json({ message: 'An error occurred while getting a response from the AI.' });
    }
};

// Streaming chat handler (SSE)
export const handleStreamingChat = async (req, res) => {
    const { question, documentIds, systemPrompt, history, modelProvider } = req.body;
    const userId = req.user.id;

    if (!question) {
        return res.status(400).json({ message: 'A "question" is required.' });
    }
    if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ message: 'An array of "documentIds" is required.' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    try {
        const stream = performStreamingQuery({
            userId,
            question,
            documentIds,
            systemPrompt,
            history: history || [],
            modelProvider: modelProvider || 'gpt-oss' // Default to streaming model
        });

        for await (const chunk of stream) {
            // Send SSE event
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        res.end();

    } catch (error) {
        console.error("Streaming chat error:", error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
};