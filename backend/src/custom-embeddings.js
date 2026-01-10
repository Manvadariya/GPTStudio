import { Embeddings } from "@langchain/core/embeddings";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export class GitHubAzureAIEmbeddings extends Embeddings {
  constructor() {
    super({ maxConcurrency: 5 });
    const { AZURE_AI_ENDPOINT, AZURE_AI_API_KEY, EMBEDDING_MODEL_NAME } = process.env;
    if (!AZURE_AI_ENDPOINT || !AZURE_AI_API_KEY || !EMBEDDING_MODEL_NAME) { throw new Error("Missing Azure AI environment variables for embeddings."); }
    this.modelName = EMBEDDING_MODEL_NAME;
    this.client = ModelClient(AZURE_AI_ENDPOINT, new AzureKeyCredential(AZURE_AI_API_KEY));
  }
  async _callEmbeddingAPI(texts) {
    const maxRetries = 3; let attempt = 0; let currentDelay = 1000;
    while (attempt < maxRetries) {
      try {
        const response = await this.client.path("/embeddings").post({ body: { input: texts, model: this.modelName } });
        if (isUnexpected(response)) { throw new Error(`Failed to get embeddings: ${response.body.error?.message}`); }
        return response.body.data.sort((a, b) => a.index - b.index).map(item => item.embedding);
      } catch (error) {
        attempt++;
        if (error.code === 'ETIMEDOUT' || error.name === 'RestError') {
          console.warn(`Attempt ${attempt} failed with network error: ${error.message}. Retrying in ${currentDelay / 1000}s...`);
          if (attempt >= maxRetries) { throw error; }
          await delay(currentDelay); currentDelay *= 2;
        } else { throw error; }
      }
    }
  }
  embedDocuments(texts) { return this._callEmbeddingAPI(texts.filter(text => text.length > 0)); }
  embedQuery(text) { return this._callEmbeddingAPI([text]).then(embeddings => embeddings[0]); }
}

// Singleton instance for reuse across queries
let embeddingsInstance = null;
export function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new GitHubAzureAIEmbeddings();
  }
  return embeddingsInstance;
}
