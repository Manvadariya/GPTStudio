import { Project } from '../models/Project.model.js';

// @desc    Get all projects for the logged-in user, now with document details
// @route   GET /api/projects
export const getUserProjects = async (req, res) => {
  try {
    // We use .populate() to replace the document ObjectId's with the actual document data
    const projects = await Project.find({ userId: req.user.id })
      .populate('documents', 'id fileName') // Select only the 'id' and 'fileName' fields from the document
      .sort({ updatedAt: -1 });
      
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch projects.' });
  }
};

// @desc    Create a new project with full configuration
// @route   POST /api/projects
export const createProject = async (req, res) => {
  const { name, description, model, documents, temperature, systemPrompt } = req.body;

  if (!name || !model) {
    return res.status(400).json({ message: 'Project name and model are required.' });
  }

  try {
    const project = new Project({
      name,
      description,
      model,
      documents, // This will be an array of Document ObjectIDs
      temperature,
      systemPrompt,
      userId: req.user.id,
    });

    const createdProject = await project.save();
    // Populate the documents in the response so the frontend has the data immediately
    const populatedProject = await Project.findById(createdProject._id).populate('documents', 'id fileName');
    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("Create Project Error:", error);
    res.status(500).json({ message: 'Server Error: Could not create project.' });
  }
};

// @desc    Update a project's full configuration
// @route   PUT /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    if (project.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized.' });
    }

    const { name, description, model, status, documents, temperature, systemPrompt } = req.body;
    
    // Update all fields from the request
    project.name = name ?? project.name;
    project.description = description ?? project.description;
    project.model = model ?? project.model;
    project.status = status ?? project.status;
    project.documents = documents ?? project.documents;
    project.temperature = temperature ?? project.temperature;
    project.systemPrompt = systemPrompt ?? project.systemPrompt;

    const updatedProject = await project.save();
    const populatedProject = await Project.findById(updatedProject._id).populate('documents', 'id fileName');
    res.status(200).json(populatedProject);
  } catch (error) {
    console.error("Update Project Error:", error);
    res.status(500).json({ message: 'Server Error: Could not update project.' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    if (project.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized.' });
    }

    await Project.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Project removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not delete project.' });
  }
};