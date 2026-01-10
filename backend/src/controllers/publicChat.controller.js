import { performQuery } from '../logic/query.js';
import { ApiCallLog } from '../models/ApiCallLog.model.js';

export const handlePublicChat = async (req, res) => {
  const { project, user } = req;
  const { question, history, modelProvider } = req.body;
  const startTime = Date.now(); // Start timer

  if (!question) {
    return res.status(400).json({ error: 'A "question" is required.' });
  }

  let successful = true;
  let answer = '';
  let modelUsed = modelProvider || 'gpt-5-nano';

  try {
    const result = await performQuery({
      userId: user._id.toString(),
      question,
      documentIds: project.documents,
      systemPrompt: project.systemPrompt,
      history: history || [],
      modelProvider: modelProvider || project.model || 'gpt-5-nano',
    });

    answer = result.answer;
    modelUsed = result.modelUsed;

    res.status(200).json({
      answer: answer,
      projectId: project._id,
      projectName: project.name,
      model: modelUsed,
    });
  } catch (error) {
    successful = false;
    console.error("Public chat handling error:", error);
    res.status(500).json({ error: 'An internal error occurred.' });
  } finally {
    // This block runs whether the request succeeded or failed.
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Simulate token usage based on question and answer length
    // In a real app, you would get this from your AI provider's API response.
    const tokensUsed = Math.floor((question.length + (answer || '').length) / 4);

    // Log the API call asynchronously (don't make the user wait for this)
    ApiCallLog.create({
      userId: user._id,
      projectId: project._id,
      successful,
      responseTimeMs,
      tokensUsed,
      model: modelUsed, // Log which model was used
    }).catch(err => console.error("Failed to log API call:", err));
  }
};