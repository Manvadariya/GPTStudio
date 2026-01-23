import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { formatDocumentsAsString } from "langchain/util/document";
import { createChatModel } from "../custom-chat-model.js";
import { getEmbeddings } from '../custom-embeddings.js';
import { getCollection } from '../utils/chromaClient.js';

const USER_TEMPLATE_WITH_CONTEXT = `Use the following context to answer the question at the end.
CONTEXT:
{context}
QUESTION:
{question}`;

const DEFAULT_SYSTEM_TEMPLATE = `You are a helpful AI assistant. Answer the user's questions based on the provided context. If the context does not contain the answer, state that you cannot answer from the given information.`;

const SUMMARIZE_SYSTEM_TEMPLATE = `You are a helpful AI assistant. Your task is to provide a comprehensive summary of the provided context. Be thorough and cover all key points.`;

// Timeout utility for external API calls
const withTimeout = (promise, ms, errorMsg = 'Operation timed out') =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);

// Intent detection keywords
const SUMMARY_KEYWORDS = ['summarize', 'summary', 'overview', 'entire', 'all pages', 'full document', 'complete', 'whole document', 'everything'];

function detectIntent(question) {
  const lower = question.toLowerCase();
  return SUMMARY_KEYWORDS.some(kw => lower.includes(kw)) ? 'summarize' : 'qa';
}


// Helper to retrieve documents and prepare context
async function prepareContext({ userId, question, documentIds, intent }) {
  const embeddings = getEmbeddings();
  const startTime = Date.now();

  try {
    // Parallelize with timeout: generate query embedding AND fetch collection at the same time
    const [queryEmbedding, collection] = await withTimeout(
      Promise.all([
        embeddings.embedQuery(question),
        getCollection()
      ]),
      15000, // 15 second timeout for embedding + collection
      'Embedding or collection fetch timed out'
    );

    if (!queryEmbedding) throw new Error("Failed to generate an embedding for the query.");

    // Construct filter - ChromaDB uses $or for multiple values
    let whereClause = { userId: userId.toString() };

    if (documentIds && documentIds.length > 0) {
      if (documentIds.length === 1) {
        // Single document: simple AND
        whereClause = { $and: [{ userId: userId.toString() }, { documentId: documentIds[0] }] };
      } else {
        // Multiple documents: use $or for documentId matching
        const docConditions = documentIds.map(id => ({ documentId: id }));
        whereClause = {
          $and: [
            { userId: userId.toString() },
            { $or: docConditions }
          ]
        };
      }
    }

    // Scale chunk retrieval with document count
    // More docs = need more chunks to cover all of them
    const baseChunks = intent === 'summarize' ? 8 : 6;
    const docMultiplier = Math.min(documentIds?.length || 1, 3); // Cap at 3x
    const nResults = baseChunks * docMultiplier;

    console.log(`🔍 Querying ${nResults} chunks across ${documentIds?.length || 'all'} documents`);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults,
      where: whereClause
    });

    // Flatten results
    const retrievedDocs = [];
    if (results.ids.length > 0) {
      const ids = results.ids[0];
      const docs = results.documents[0];
      const metadatas = results.metadatas[0];

      for (let i = 0; i < ids.length; i++) {
        if (docs[i]) {
          retrievedDocs.push({
            pageContent: docs[i],
            metadata: metadatas[i]
          });
        }
      }
    }

    const formattedDocs = retrievedDocs.map(
      doc => new Document({ pageContent: doc.pageContent, metadata: doc.metadata })
    );

    const durationMs = Date.now() - startTime;
    console.log(JSON.stringify({ event: 'context_prepared', intent, docCount: retrievedDocs.length, durationMs }));

    return { context: formatDocumentsAsString(formattedDocs), docCount: retrievedDocs.length, intent };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(JSON.stringify({ event: 'context_error', error: error.message, durationMs }));
    throw error;
  }
}

// Hierarchical summarization for large context
async function hierarchicalSummarize(chunks, question, chatModel) {
  const CHUNK_BATCH_SIZE = 5;
  const summaries = [];

  // Stage 1: Summarize in batches
  for (let i = 0; i < chunks.length; i += CHUNK_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CHUNK_BATCH_SIZE).join('\n\n---\n\n');
    const messages = [
      new SystemMessage("Summarize the following text concisely, preserving key facts and information."),
      new HumanMessage(batch)
    ];
    const summary = await chatModel._call(messages);
    summaries.push(summary);
  }

  // Stage 2: Final summary from intermediate summaries
  if (summaries.length === 1) {
    return summaries[0];
  }

  const combinedSummaries = summaries.join('\n\n---\n\n');
  const finalMessages = [
    new SystemMessage(SUMMARIZE_SYSTEM_TEMPLATE),
    new HumanMessage(`Based on these section summaries, provide a comprehensive final summary:\n\n${combinedSummaries}\n\nOriginal question: ${question}`)
  ];
  return await chatModel._call(finalMessages);
}

// Build messages array for chat model
function buildMessages({ context, question, systemPrompt, history }) {
  const finalSystemPrompt = systemPrompt || DEFAULT_SYSTEM_TEMPLATE;
  const messages = [new SystemMessage(finalSystemPrompt)];

  // Add history
  if (history && Array.isArray(history)) {
    history.forEach(msg => {
      if (msg.type === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.type === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    });
  }

  // Add current question with context
  const userMessage = USER_TEMPLATE_WITH_CONTEXT
    .replace('{context}', context)
    .replace('{question}', question);
  messages.push(new HumanMessage(userMessage));

  return messages;
}

// Non-streaming query
export async function performQuery({ userId, question, documentIds, systemPrompt, history, modelProvider }) {
  const intent = detectIntent(question);
  console.log(`🎯 Detected intent: ${intent}`);

  const { context, docCount } = await prepareContext({ userId, question, documentIds, intent });
  const chatModel = createChatModel(modelProvider);
  const modelUsed = chatModel.getProvider();

  console.log(`📚 Retrieved ${docCount} chunks for ${intent} query`);
  console.log(`🧠 Generating answer using ${modelUsed} model...`);

  const messages = buildMessages({ context, question, systemPrompt, history });
  const answer = await chatModel._call(messages);

  return { answer, modelUsed };
}

// Streaming query - returns async generator for SSE
export async function* performStreamingQuery({ userId, question, documentIds, systemPrompt, history, modelProvider }) {
  const intent = detectIntent(question);
  console.log(`🎯 Detected intent: ${intent}`);

  const { context, docCount } = await prepareContext({ userId, question, documentIds, intent });
  const chatModel = createChatModel(modelProvider);
  const modelUsed = chatModel.getProvider();

  console.log(`📚 Retrieved ${docCount} chunks for ${intent} query`);
  console.log(`🌊 Streaming answer using ${modelUsed} model...`);

  // Yield model info first
  yield { type: 'meta', model: modelUsed, intent, docCount };

  const messages = buildMessages({ context, question, systemPrompt, history });

  // Stream the response
  for await (const chunk of chatModel.streamCall(messages)) {
    yield { type: 'content', content: chunk };
  }

  yield { type: 'done' };
}
