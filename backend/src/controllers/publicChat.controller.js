import { performQuery, performStreamingQuery } from '../logic/query.js';
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
  let modelUsed = modelProvider || project.model || 'gpt-5-nano';

  try {
    const result = await performQuery({
      userId: user._id.toString(),
      question,
      documentIds: project.documents.map(doc => doc.toString()),
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
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    const tokensUsed = Math.floor((question.length + (answer || '').length) / 4);

    ApiCallLog.create({
      userId: user._id,
      projectId: project._id,
      successful,
      responseTimeMs,
      tokensUsed,
      model: modelUsed,
    }).catch(err => console.error("Failed to log API call:", err));
  }
};

export const handlePublicStreamingChat = async (req, res) => {
  const { project, user } = req;
  const { question, history, modelProvider } = req.body;
  const startTime = Date.now();

  if (!question) {
    return res.status(400).json({ error: 'A "question" is required.' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let successful = true;
  let answer = '';
  let modelUsed = modelProvider || project.model || 'fast-model';

  try {
    const stream = performStreamingQuery({
      userId: user._id.toString(),
      question,
      documentIds: project.documents.map(doc => doc.toString()),
      systemPrompt: project.systemPrompt,
      history: history || [],
      modelProvider: modelUsed,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content') {
        answer += chunk.content;
      }
      if (chunk.type === 'meta') {
        modelUsed = chunk.model;
      }
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (res.flush) res.flush();
    }
    res.end();

  } catch (error) {
    successful = false;
    console.error("Public streaming chat error:", error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'An internal error occurred.' })}\n\n`);
    res.end();
  } finally {
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;
    const tokensUsed = Math.floor((question.length + (answer || '').length) / 4);

    ApiCallLog.create({
      userId: user._id,
      projectId: project._id,
      successful,
      responseTimeMs,
      tokensUsed,
      model: modelUsed,
    }).catch(err => console.error("Failed to log API call:", err));
  }
};