
import { CloudClient } from 'chromadb';

let clientInstance = null;

export const getChromaClient = () => {
    if (!clientInstance) {
        clientInstance = new CloudClient({
            apiKey: process.env.CHROMA_API_KEY,
            tenant: process.env.CHROMA_TENANT,
            database: process.env.CHROMA_DATABASE
        });
    }
    return clientInstance;
};

// Dummy embedding function to prevent Chroma from trying to load the default one
// We generate embeddings manually using GitHubAzureAIEmbeddings before calling Chroma.
const dummyEmbeddingFunction = {
    generate: async (texts) => {
        return texts.map(() => []); // Return empty arrays, we won't use this
    }
};

let collectionInstance = null;

export const getCollection = async () => {
    if (collectionInstance) {
        return collectionInstance;
    }
    const client = getChromaClient();
    // Get or create collection to ensure it exists
    collectionInstance = await client.getOrCreateCollection({
        name: "document_chunks",
        metadata: { "description": "Stores document chunks for RAG" },
        embeddingFunction: dummyEmbeddingFunction
    });
    return collectionInstance;
};
