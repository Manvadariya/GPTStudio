import { ApiKey } from '../models/ApiKey.model.js';
import { Project } from '../models/Project.model.js';
import { User } from '../models/User.model.js';

export const apiKeyProtect = async (req, res, next) => {
  let apiKey;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      apiKey = req.headers.authorization.split(' ')[1];

      if (!apiKey.startsWith('sk-proj-')) {
        return res.status(401).json({ error: 'Invalid API key format.' });
      }
      
      const hashedKey = ApiKey.hashKey(apiKey);

      // Find the key in the database and populate the associated project and user details
      const keyData = await ApiKey.findOne({ hashedKey })
        .populate('projectId')
        .populate('userId', 'name email'); // Populate user but only select name and email

      if (!keyData || !keyData.projectId) {
        return res.status(401).json({ error: 'Invalid API key.' });
      }
      
      // Check if the associated project is deployed
      if (keyData.projectId.status !== 'deployed') {
        return res.status(403).json({ error: 'Project is not deployed. Please deploy the project in the dashboard to use this API key.' });
      }

      // Attach the found data to the request object for the controller to use
      req.project = keyData.projectId;
      req.user = keyData.userId; // The user associated with the key
      
      // Update key usage stats (don't await this to avoid blocking the response)
      ApiKey.updateOne({ _id: keyData._id }, { $set: { lastUsed: new Date() }, $inc: { usage: 1 } }).catch(err => console.error("Failed to update API key stats:", err));
      Project.updateOne({ _id: keyData.projectId._id }, { $inc: { apiCalls: 1 } }).catch(err => console.error("Failed to update project apiCalls:", err));


      next();
    } catch (error) {
      console.error("API Key Auth Error:", error);
      return res.status(401).json({ error: 'Not authorized, token failed.' });
    }
  }

  if (!apiKey) {
    return res.status(401).json({ error: 'Not authorized, no API key provided.' });
  }
};