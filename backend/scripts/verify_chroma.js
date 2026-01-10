import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getCollection } from '../src/utils/chromaClient.js';
import crypto from 'crypto';

async function testChroma() {
    console.log("🧪 Starting ChromaDB Verification...");
    try {
        const collection = await getCollection();
        console.log("✅ Connected to collection:", collection.name);

        const testId = crypto.randomUUID();
        const testDocId = "test-doc-" + crypto.randomUUID();

        console.log("📝 Adding test document...");
        // Create a 1536-dimensional dummy vector to match OpenAI/Azure embeddings
        const dummyEmbedding = Array(1536).fill(0.1);

        await collection.add({
            ids: [testId],
            embeddings: [dummyEmbedding],
            metadatas: [{ userId: "test-user", documentId: testDocId, source: "test.txt" }],
            documents: ["This is a test document."]
        });

        console.log("🔍 Querying test document...");
        const results = await collection.query({
            queryEmbeddings: [dummyEmbedding],
            nResults: 1,
            where: { documentId: testDocId }
        });

        if (results.ids[0].length > 0 && results.ids[0][0] === testId) {
            console.log("✅ Query successful. Found document.");
        } else {
            console.error("❌ Query failed. Document not found.");
            process.exit(1);
        }

        console.log("🗑️ Deleting test document...");
        await collection.delete({
            ids: [testId]
        });

        const check = await collection.get({ ids: [testId] });
        if (check.ids.length === 0) {
            console.log("✅ Deletion successful.");
        } else {
            console.error("❌ Deletion failed.");
            process.exit(1);
        }

        console.log("🎉 All verification steps passed!");
    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

testChroma();
