import { Document } from "@langchain/core/documents";
import { MongoClient } from "mongodb";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { GitHubAzureAIEmbeddings } from "../custom-embeddings.js";
import { GitHubAzureAIChatModel } from "../custom-chat-model.js";

const USER_TEMPLATE_WITH_CONTEXT = `Use the following context to answer the question at the end.
CONTEXT:
{context}
QUESTION:
{question}`;

const DEFAULT_SYSTEM_TEMPLATE = `You are a helpful AI assistant. Answer the user's questions based on the provided context. If the context does not contain the answer, state that you cannot answer from the given information.`;

export async function performQuery({ userId, question, documentIds, systemPrompt, history }) {
  const embeddings = new GitHubAzureAIEmbeddings();
  const client = new MongoClient(process.env.RAG_MONGO_URI);
  let answer;

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
    const context = formatDocumentsAsString(formattedDocs);

    // --- START: DYNAMIC PROMPT CONSTRUCTION WITH HISTORY ---

    // 1. Determine the system prompt to use.
    const finalSystemPrompt = systemPrompt || DEFAULT_SYSTEM_TEMPLATE;

    // 2. Create the message history array for the prompt template.
    const promptMessages = [
      ["system", finalSystemPrompt]
    ];

    // 3. Add previous messages from the conversation history.
    // LangChain expects a specific format, so we map our simple frontend object.
    if (history && Array.isArray(history)) {
      history.forEach(message => {
        if (message.type === 'user') {
          promptMessages.push(["human", message.content]);
        } else if (message.type === 'assistant') {
          promptMessages.push(["ai", message.content]);
        }
      });
    }

    // 4. Add the final user message, which includes the RAG context.
    promptMessages.push(["human", USER_TEMPLATE_WITH_CONTEXT]);

    // 5. Create the prompt template from this complete message history.
    const ragPrompt = ChatPromptTemplate.fromMessages(promptMessages);

    // --- END: DYNAMIC PROMPT CONSTRUCTION ---

    const chatModel = new GitHubAzureAIChatModel();
    const ragChain = RunnableSequence.from([ragPrompt, chatModel, new StringOutputParser()]);

    console.log("🧠 Generating answer with conversational context...");
    answer = await ragChain.invoke({ context: context, question: question });

  } catch (error) {
    console.error("Error during performQuery:", error);
    throw error;
  } finally {
    await client.close();
  }

  return answer;
}