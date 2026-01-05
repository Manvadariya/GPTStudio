// custom-chat-model.js
import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import OpenAI from "openai";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class GitHubAzureAIChatModel extends SimpleChatModel {
  constructor() {
    super({});
    const { AZURE_AI_ENDPOINT, AZURE_AI_API_KEY, CHAT_MODEL_NAME } = process.env;
    if (!AZURE_AI_ENDPOINT || !AZURE_AI_API_KEY || !CHAT_MODEL_NAME) { throw new Error("Missing Azure AI environment variables for chat model."); }
    this.modelName = CHAT_MODEL_NAME;
    this.client = new OpenAI({
      baseURL: AZURE_AI_ENDPOINT,
      apiKey: AZURE_AI_API_KEY,
      // **CRITICAL FIX: Add a timeout to prevent infinite hangs**
      timeout: 30 * 1000, // 30 seconds
    });
  }
  _llmType() { return "custom_openai_compatible_chat_model"; }
  async _call(messages) {
    const formattedMessages = messages.map(msg => {
      const messageType = msg._getType(); let role;
      switch (messageType) {
        case "system": role = "system"; break;
        case "human": role = "user"; break;
        case "ai": role = "assistant"; break;
        default: throw new Error(`Unknown message type: ${messageType}`);
      }
      return { role, content: msg.content };
    });
    const maxRetries = 3; let attempt = 0; let currentDelay = 1000;
    while (attempt < maxRetries) {
      try {
        console.log(`Attempting to call chat model: ${this.modelName}`);
        const response = await this.client.chat.completions.create({
          messages: formattedMessages,
          model: this.modelName,
          temperature: 0.7,
          max_tokens: 1500,
        });
        console.log("Chat model call successful.");
        return response.choices[0]?.message?.content || "";
      } catch (error) {
        attempt++;
        // Check for common network error properties like timeout
        if (error.code === 'ETIMEDOUT' || error.name === 'AbortError' || error.status >= 500) {
          console.warn(`Attempt ${attempt} failed with network/timeout error: ${error.message}. Retrying in ${currentDelay / 1000}s...`);
          if (attempt >= maxRetries) {
            console.error("All retry attempts failed. Throwing final error.");
            throw error;
          }
          await delay(currentDelay);
          currentDelay *= 2;
        } else {
          // If it's another kind of error (e.g., validation), throw immediately
          console.error("A non-retriable error occurred:", error);
          throw error;
        }
      }
    }
  }
}