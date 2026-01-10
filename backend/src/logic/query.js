import { Document } from "@langchain/core/documents";
import { MongoClient } from "mongodb";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { formatDocumentsAsString } from "langchain/util/document";
import { GitHubAzureAIEmbeddings } from "../custom-embeddings.js";
import { createChatModel } from "../custom-chat-model.js";

const USER_TEMPLATE_WITH_CONTEXT = `Use the following context to answer the question at the end.
CONTEXT:
{context}
QUESTION:
{question}`;

const DEFAULT_SYSTEM_TEMPLATE = `You are a helpful AI assistant. Answer the user's questions based on the provided context. If the context does not contain the answer, state that you cannot answer from the given information.`;

// Helper to retrieve documents and prepare context
async function prepareContext({ userId, question, documentIds }) {
  const embeddings = new GitHubAzureAIEmbeddings();
  const client = new MongoClient(process.env.RAG_MONGO_URI);

  try {
    await client.connect();
    const dbName = new URL(process.env.RAG_MONGO_URI).pathname.substring(1) || "rag_db";
    const collection = client.db(dbName).collection("document_chunks");
    const queryEmbedding = await embeddings.embedQuery(question);

    if (!queryEmbedding) throw new Error("Failed to generate an embedding for the query.");

    const filter = { userId: userId.toString() };
    if (documentIds && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const pipeline = [{
      $vectorSearch: {
        index: "vector_index", path: "embedding", queryVector: queryEmbedding,
        numCandidates: 150, limit: 10, filter: filter,
      },
    }, { $limit: 4 }];

    const retrievedDocs = await collection.aggregate(pipeline).toArray();
    const formattedDocs = retrievedDocs.map(
      doc => new Document({ pageContent: doc.content, metadata: doc.metadata })
    );
    return formatDocumentsAsString(formattedDocs);
  } finally {
    await client.close();
  }
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

// Non-streaming query (original)
export async function performQuery({ userId, question, documentIds, systemPrompt, history, modelProvider }) {
  const context = await prepareContext({ userId, question, documentIds });
  const messages = buildMessages({ context, question, systemPrompt, history });

  const chatModel = createChatModel(modelProvider);
  const modelUsed = chatModel.getProvider();

  console.log(`🧠 Generating answer using ${modelUsed} model...`);
  const answer = await chatModel._call(messages);

  return { answer, modelUsed };
}

// Streaming query - returns async generator for SSE
export async function* performStreamingQuery({ userId, question, documentIds, systemPrompt, history, modelProvider }) {
  const context = await prepareContext({ userId, question, documentIds });
  const messages = buildMessages({ context, question, systemPrompt, history });

  const chatModel = createChatModel(modelProvider);
  const modelUsed = chatModel.getProvider();

  console.log(`🌊 Streaming answer using ${modelUsed} model...`);

  // Yield model info first
  yield { type: 'meta', model: modelUsed };

  // Stream the response
  for await (const chunk of chatModel.streamCall(messages)) {
    yield { type: 'content', content: chunk };
  }

  yield { type: 'done' };
}