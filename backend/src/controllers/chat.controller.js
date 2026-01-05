import { performQuery } from '../logic/query.js';

export const handleChat = async (req, res) => {
    // Destructure all expected properties, including the new 'history' array
    const { question, documentIds, systemPrompt, history } = req.body;
    const userId = req.user.id; // Safely get from the auth middleware

    if (!question) {
        return res.status(400).json({ message: 'A "question" is required.' });
    }
    if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ message: 'An array of "documentIds" is required.' });
    }

    try {
        const answer = await performQuery({ 
            userId, 
            question, 
            documentIds, 
            systemPrompt,
            history: history || [] // Pass the history array, or an empty array if not provided
        });
        
        // The response structure remains the same
        res.status(200).json({
            answer: answer,
        });

    } catch (error) {
        console.error("Chat handling error:", error);
        res.status(500).json({ message: 'An error occurred while getting a response from the AI.' });
    }
};