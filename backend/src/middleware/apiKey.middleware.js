import { ApiKey } from '../models/ApiKey.model.js';

export const authenticateApiKey = async (req, res, next) => {
  let key;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    key = authHeader.split(' ')[1];
  }

  if (!key) {
    return res.status(401).json({ error: { message: 'No API key provided. Please include an Authorization header with \'Bearer YOUR_API_KEY\'.' } });
  }

  try {
    const hashedKey = ApiKey.hashKey(key);
    // Find the key and populate the associated project and user data
    const apiKeyData = await ApiKey.findOne({ hashedKey }).select('+hashedKey').populate('projectId').populate('userId');

    if (!apiKeyData) {
      return res.status(401).json({ error: { message: 'Invalid API key.' } });
    }
    
    // Attach the populated data to the request object for the controller to use
    req.apiKeyData = apiKeyData;
    
    // Update the lastUsed timestamp (can be done without waiting for it to finish)
    apiKeyData.lastUsed = new Date();
    apiKeyData.usage += 1;
    apiKeyData.save();

    next();
  } catch (error) {
    console.error("API Key Auth Error:", error);
    res.status(500).json({ error: { message: 'Internal Server Error' } });
  }
};