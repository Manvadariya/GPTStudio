// custom-chat-model.js
// Unified chat model that supports multiple providers with streaming

import { SimpleChatModel } from "@langchain/core/language_models/chat_models";
import OpenAI from "openai";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cache model instances to avoid re-initialization on every request
const modelCache = {};

// Factory function to create the appropriate chat model based on provider
// Default to fast model for RAG queries
export function createChatModel(provider = 'fast-model') {
  if (!modelCache[provider]) {
    modelCache[provider] = new UnifiedChatModel(provider);
  }
  return modelCache[provider];
}

export class UnifiedChatModel extends SimpleChatModel {
  constructor(provider = 'fast-model') {
    super({});
    this.provider = provider;

    const { OPENROUTER_AI_ENDPOINT, OPENROUTER_API_KEY, OPENROUTER_CHAT_MODEL_NAME } = process.env;
    const { AZURE_AI_ENDPOINT, AZURE_AI_API_KEY, CHAT_MODEL_NAME } = process.env;

    if (provider === 'fast-model' || provider === 'qwen-fast') {
      // Fast model via OpenRouter (default for RAG)
      if (!OPENROUTER_AI_ENDPOINT || !OPENROUTER_API_KEY) {
        throw new Error("Missing OpenRouter environment variables.");
      }
      this.modelName = process.env.FAST_MODEL_NAME || 'stepfun/step-3.5-flash:free';
      this.client = new OpenAI({
        baseURL: OPENROUTER_AI_ENDPOINT,
        apiKey: OPENROUTER_API_KEY,
        timeout: 15 * 1000, // 15 seconds for fast model
      });
      console.log(`Initialized Fast model: ${this.modelName}`);
    } else if (provider === 'gpt-oss') {
      // OpenRouter with configured model (fallback for complex reasoning)
      if (!OPENROUTER_AI_ENDPOINT || !OPENROUTER_API_KEY || !OPENROUTER_CHAT_MODEL_NAME) {
        throw new Error("Missing OpenRouter environment variables.");
      }
      this.modelName = OPENROUTER_CHAT_MODEL_NAME;
      this.client = new OpenAI({
        baseURL: OPENROUTER_AI_ENDPOINT,
        apiKey: OPENROUTER_API_KEY,
        timeout: 60 * 1000, // 60 seconds for larger model
      });
      console.log(`Initialized OpenRouter model: ${this.modelName}`);
    } else {
      // Azure/GitHub AI configuration (gpt-5-nano)
      if (!AZURE_AI_ENDPOINT || !AZURE_AI_API_KEY || !CHAT_MODEL_NAME) {
        throw new Error("Missing Azure AI environment variables.");
      }
      this.modelName = CHAT_MODEL_NAME;
      this.client = new OpenAI({
        baseURL: AZURE_AI_ENDPOINT,
        apiKey: AZURE_AI_API_KEY,
        timeout: 30 * 1000,
      });
      console.log(`Initialized Azure model: ${this.modelName}`);
    }
  }

  _llmType() {
    return `unified_chat_model_${this.provider}`;
  }

  invocationParams(_options) {
    return {};
  }

  getModelName() {
    return this.modelName;
  }

  getProvider() {
    return this.provider;
  }

  // Format messages for OpenAI API
  formatMessages(messages) {
    return messages.map(msg => {
      const messageType = msg._getType();
      let role;
      switch (messageType) {
        case "system": role = "system"; break;
        case "human": role = "user"; break;
        case "ai": role = "assistant"; break;
        default: throw new Error(`Unknown message type: ${messageType}`);
      }
      return { role, content: msg.content };
    });
  }

  // Streaming call - returns an async generator
  async *streamCall(messages) {
    const formattedMessages = this.formatMessages(messages);

    console.log(`Starting streaming call to ${this.provider} model: ${this.modelName}`);

    const stream = await this.client.chat.completions.create({
      messages: formattedMessages,
      model: this.modelName,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  // Non-streaming call (for LangChain compatibility)
  async _call(messages, _options) {
    const formattedMessages = this.formatMessages(messages);

    const maxRetries = 3;
    let attempt = 0;
    let currentDelay = 1000;

    while (attempt < maxRetries) {
      try {
        console.log(`Attempting to call ${this.provider} model: ${this.modelName}`);

        const response = await this.client.chat.completions.create({
          messages: formattedMessages,
          model: this.modelName,
        });

        console.log(`${this.provider} model call successful.`);
        return response.choices[0]?.message?.content || "";

      } catch (error) {
        attempt++;
        if (error.code === 'ETIMEDOUT' || error.name === 'AbortError' || error.status >= 500) {
          console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying...`);
          if (attempt >= maxRetries) {
            throw error;
          }
          await delay(currentDelay);
          currentDelay *= 2;
        } else {
          console.error(`${this.provider} error:`, error);
          throw error;
        }
      }
    }
  }
}

// Backwards compatibility
export class GitHubAzureAIChatModel extends UnifiedChatModel {
  constructor() {
    super('gpt-5-nano');
  }
}