import fs from 'fs';
import crypto from 'crypto';
import { Document } from '../models/Document.model.js';
import { DocumentChunkSchema } from '../models/DocumentChunk.model.js';
import { ingestDocument } from '../logic/ingestion.js';
import mongoose from 'mongoose';

// @desc    Get all data sources for a user
// @route   GET /api/data
export const getDataSources = async (req, res) => {
    try {
        // Find documents belonging to the logged-in user
        const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
        // Format the response to match the frontend's expectations
        res.status(200).json(documents.map(d => ({
            id: d._id,
            ragDocumentId: d.ragDocumentId, // Send this ID for querying
            name: d.fileName,
            format: d.fileType,
            size: d.fileSize,
            status: d.status,
            uploadedAt: d.createdAt,
        })));
    } catch (error) {
        console.error("Get Data Sources Error:", error);
        res.status(500).json({ message: "Server Error: Could not fetch data sources." });
    }
};

// @desc    Upload and process a new data source
// @route   POST /api/data/upload
export const uploadDataSource = async (req, res) => {
    const { file } = req;
    if (!file) {
        return res.status(400).json({ message: "No file was uploaded." });
    }

    try {
        const ragDocumentId = crypto.randomUUID();
        // Create the main document record in our application database
        const parentDocument = await Document.create({
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            userId: req.user.id, // Get user ID from the protect middleware
            ragDocumentId: ragDocumentId,
            status: 'processing',
        });

        // Immediately respond to the client so the UI doesn't hang
        res.status(202).json({
            message: 'File upload accepted and is now being processed.',
            document: {
                id: parentDocument._id,
                ragDocumentId: parentDocument.ragDocumentId,
                name: parentDocument.fileName,
                format: parentDocument.fileType,
                size: parentDocument.fileSize,
                status: parentDocument.status,
                uploadedAt: parentDocument.createdAt,
            }
        });

        // Perform the heavy lifting (ingestion) in the background
        ingestDocument(file.path, parentDocument).finally(() => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path); // Clean up the temp file
            }
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: "Server Error: Could not process upload." });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
};

export const deleteDataSource = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        if (document.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized.' });
        }

        // Also delete associated chunks from the RAG database
        const ragConnection = mongoose.createConnection(process.env.RAG_MONGO_URI);
        const DocumentChunk = ragConnection.model('DocumentChunk', DocumentChunkSchema);
        await DocumentChunk.deleteMany({ documentId: document.ragDocumentId });
        await ragConnection.close();
        
        await Document.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Data source and all related chunks deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not delete data source.' });
    }
};