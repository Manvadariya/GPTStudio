import { ApiKey } from '../models/ApiKey.model.js';
import { Project } from '../models/Project.model.js';
import crypto from 'crypto';

export const getApiKeys = async (req, res) => {
  try {
    // Populate the project details when fetching keys
    const keys = await ApiKey.find({ userId: req.user.id })
      .populate('projectId', 'name') // Only get the project's name
      .sort({ createdAt: -1 });
    res.status(200).json(keys);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch API keys.' });
  }
};

export const generateApiKey = async (req, res) => {
  const { name, projectId } = req.body;
  if (!name || !projectId) {
    return res.status(400).json({ message: 'Key name and projectId are required.' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project || project.userId.toString() !== req.user.id) {
        return res.status(404).json({ message: "Project not found or you are not authorized." });
    }

    const keyPrefix = 'sk-proj-';
    const newKey = `${keyPrefix}${crypto.randomBytes(24).toString('hex')}`;
    
    const hashedKey = ApiKey.hashKey(newKey);
    const lastFour = newKey.slice(-4);

    const apiKeyDoc = await ApiKey.create({
      name,
      userId: req.user.id,
      projectId,
      keyPrefix,
      hashedKey,
      lastFour,
    });

    // Populate project info for the response
    const apiKey = await ApiKey.findById(apiKeyDoc._id).populate('projectId', 'name');
    
    res.status(201).json({
      message: 'API Key created successfully. Save this key securely, you will not be able to see it again.',
      apiKey: { ...apiKey.toObject(), key: newKey }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not create API key.' });
  }
};

export const deleteApiKey = async (req, res) => {
  // This controller remains the same as the previous step
  try {
    const key = await ApiKey.findById(req.params.id);
    if (!key || key.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'API Key not found or user not authorized.' });
    }
    await ApiKey.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'API Key deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not delete API key.' });
  }
};