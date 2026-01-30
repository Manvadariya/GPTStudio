import { performQuery, performStreamingQuery } from '../logic/query.js';
import { ApiCallLog } from '../models/ApiCallLog.model.js';

// Non-streaming chat handler
export const handleChat = async (req, res) => {
    const { question, documentIds, systemPrompt, history, modelProvider } = req.body;
    const userId = req.user.id || (req.user && req.user._id);
    const startTime = Date.now();

    if (!question) {
        return res.status(400).json({ message: 'A "question" is required.' });
    }

    // Determine document IDs: either from body or from project (API Key auth)
    let effectiveDocumentIds = documentIds;
    if (!effectiveDocumentIds || !Array.isArray(effectiveDocumentIds)) {
        if (req.project && req.project.documents) {
            effectiveDocumentIds = req.project.documents.map(doc => doc.toString());
        } else {
            return res.status(400).json({ message: 'An array of "documentIds" is required.' });
        }
    }

    let successful = true;
    let answer = '';
    let modelUsed = modelProvider || (req.project && req.project.model) || 'fast-model';

    try {
        const result = await performQuery({
            userId: userId.toString(),
            question,
            documentIds: effectiveDocumentIds,
            systemPrompt: systemPrompt || (req.project && req.project.systemPrompt),
            history: history || [],
            modelProvider: modelUsed
        });

        answer = result.answer;
        modelUsed = result.modelUsed;

        res.status(200).json({
            answer: answer,
            model: modelUsed,
        });

    } catch (error) {
        successful = false;
        console.error("Chat handling error:", error);
        res.status(500).json({ message: 'An error occurred while getting a response from the AI.' });
    } finally {
        if (req.project) {
            const durationMs = Date.now() - startTime;
            const tokensUsed = Math.floor((question.length + (answer || '').length) / 4);
            ApiCallLog.create({
                userId: req.user._id || req.user.id,
                projectId: req.project._id,
                successful,
                responseTimeMs: durationMs,
                tokensUsed,
                model: modelUsed
            }).catch(err => console.error("Failed to log API call:", err));
        }
    }
};

// Streaming chat handler (SSE)
// Streaming chat handler (SSE)
export const handleStreamingChat = async (req, res) => {
    const { question, documentIds, systemPrompt, history, modelProvider } = req.body;
    const userId = req.user.id || (req.user && req.user._id);
    const startTime = Date.now();

    if (!question) {
        return res.status(400).json({ message: 'A "question" is required.' });
    }

    // Determine document IDs: either from body or from project (API Key auth)
    let effectiveDocumentIds = documentIds;
    if (!effectiveDocumentIds || !Array.isArray(effectiveDocumentIds)) {
        if (req.project && req.project.documents) {
            effectiveDocumentIds = req.project.documents.map(doc => doc.toString());
        } else {
            return res.status(400).json({ message: 'An array of "documentIds" is required.' });
        }
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    let successful = true;
    let answer = '';
    // Use FAST_MODEL_NAME from env as default if available
    let modelUsed = modelProvider || (req.project && req.project.model) || process.env.FAST_MODEL_NAME || 'fast-model';

    try {
        const stream = performStreamingQuery({
            userId: userId.toString(),
            question,
            documentIds: effectiveDocumentIds,
            systemPrompt: systemPrompt || (req.project && req.project.systemPrompt),
            history: history || [],
            modelProvider: modelUsed
        });

        for await (const chunk of stream) {
            if (chunk.type === 'content') {
                answer += chunk.content;
            }
            if (chunk.type === 'meta') {
                modelUsed = chunk.model;
            }
            // Send SSE event and flush for proxy compatibility
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            if (res.flush) res.flush(); // Ensure immediate delivery through proxies
        }

        console.log(JSON.stringify({ event: 'stream_complete', durationMs: Date.now() - startTime }));
        res.end();

    } catch (error) {
        successful = false;
        console.error(JSON.stringify({ event: 'stream_error', error: error.message, durationMs: Date.now() - startTime }));
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        if (res.flush) res.flush();
        res.end();
    } finally {
        if (req.project) {
            const durationMs = Date.now() - startTime;
            const tokensUsed = Math.floor((question.length + (answer || '').length) / 4);
            ApiCallLog.create({
                userId: req.user._id || req.user.id,
                projectId: req.project._id,
                successful,
                responseTimeMs: durationMs,
                tokensUsed,
                model: modelUsed
            }).catch(err => console.error("Failed to log API call:", err));
        }
    }
};
