
import { getChromaClient } from '../src/utils/chromaClient.js';

async function resetCollection() {
    console.log("🗑️ Resetting ChromaDB collection...");
    try {
        const client = getChromaClient();
        console.log("Attempting to delete 'document_chunks'...");
        await client.deleteCollection({ name: "document_chunks" });
        console.log("✅ Collection deleted.");
    } catch (error) {
        console.error("⚠️ Error deleting collection (it may not exist):", error.message);
    }
}

resetCollection();
