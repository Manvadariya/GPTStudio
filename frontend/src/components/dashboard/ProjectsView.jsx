import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MultiSelect } from '@/components/ui/multi-select';
import { Plus, Rocket, Clock, CheckCircle, Code, Brain, Trash, PencilSimple, Folder, Eye, Link as LinkIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../lib/apiService';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PROJECT_FORM = {
  name: '',
  description: '',
  model: 'gpt-5-nano',
  documents: [],
  temperature: 0.7,
  systemPrompt: 'You are a helpful AI assistant that answers questions based on the provided context.'
};

export function ProjectsView({ triggerNewProject, onNewProjectTriggered }) {
  const { projects, setProjects, dataSources } = useAppContext();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState(DEFAULT_PROJECT_FORM);
  const [isLoading, setIsLoading] = useState(false);

  const readyDataSources = useMemo(() => dataSources.filter(ds => ds.status === 'ready'), [dataSources]);

  const dataSourceOptions = useMemo(() =>
    readyDataSources.map(ds => ({
      value: ds.id,
      label: ds.name,
    })),
    [readyDataSources]
  );

  useEffect(() => {
    if (triggerNewProject) {
      handleOpenCreateDialog();
      onNewProjectTriggered?.();
    }
  }, [triggerNewProject, onNewProjectTriggered]);

  const handleOpenCreateDialog = () => {
    setModalMode('create');
    setProjectForm(DEFAULT_PROJECT_FORM);
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditDialog = (project) => {
    setModalMode('edit');
    setSelectedProject(project);
    setProjectForm({
      name: project.name,
      description: project.description,
      model: project.model,
      documents: project.documents.map(doc => doc._id || doc.id),
      temperature: project.temperature,
      systemPrompt: project.systemPrompt,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!projectForm.name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    setIsLoading(true);
    const apiCall = modalMode === 'create'
      ? apiService.createProject(projectForm)
      : apiService.updateProject(selectedProject.id, projectForm);

    try {
      const result = await apiCall;
      const formattedProject = { ...result, id: result._id };
      if (modalMode === 'create') {
        setProjects(current => [formattedProject, ...current]);
      } else {
        setProjects(current => current.map(p => p.id === formattedProject.id ? formattedProject : p));
      }
      toast.success(`Project ${modalMode === 'create' ? 'created' : 'updated'} successfully!`);
      setIsModalOpen(false);
    } catch (error) {
      toast.error(`Failed to ${modalMode} project: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    const originalProjects = [...projects];
    setProjects(current => current.filter(p => p.id !== projectId));
    try {
      await apiService.deleteProject(projectId);
      toast.success('Project deleted');
    } catch (error) {
      setProjects(originalProjects);
      toast.error(`Failed to delete project: ${error.message}`);
    }
  };

  const handleOpenDeployDialog = (project) => {
    setSelectedProject(project);
    setIsDeployDialogOpen(true);
  };

  const handleConfirmDeploy = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      const updatedData = await apiService.updateProject(selectedProject.id, { status: 'deployed' });
      const formattedProject = { ...updatedData, id: updatedData._id };
      setProjects(current => current.map(p => p.id === formattedProject.id ? formattedProject : p));
      toast.success('Project deployed successfully!');
    } catch (error) {
      toast.error(`Failed to deploy project: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsDeployDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const handleViewAPI = (project) => {
    navigate(`/app/settings?tab=api`);
    toast.info(`Showing API keys for your projects.`);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'development': return { label: 'In Development', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Code };
      case 'testing': return { label: 'Testing', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
      case 'deployed': return { label: 'Deployed', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Code };
    }
  };

  const totalProjects = projects.length;
  const deployedProjects = projects.filter(p => p.status === 'deployed').length;
  const devProjects = projects.filter(p => p.status === 'development').length;
  const totalApiCalls = projects.reduce((acc, p) => acc + p.apiCalls, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Projects</h2><p className="text-muted-foreground">Manage your AI models and deployments</p></div>
        <Button className="gap-2" onClick={handleOpenCreateDialog}><Plus size={16} />New Project</Button>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalMode === 'create' ? 'Create New Project' : 'Edit Project'}</DialogTitle>
            <DialogDescription>{modalMode === 'create' ? 'Configure and save your custom AI assistant.' : 'Update your project configuration.'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input id="project-name" placeholder="Customer Support Bot" value={projectForm.name} onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-model">Base Model</Label>
                <Select value={projectForm.model} onValueChange={(value) => setProjectForm(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="gpt-5-nano">GPT-5 Nano (Azure)</SelectItem><SelectItem value="gpt-oss">GPT-OSS (OpenRouter)</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea id="project-description" placeholder="A brief description of what this assistant does." value={projectForm.description} onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge-base">Knowledge Base</Label>
              <MultiSelect options={dataSourceOptions} selected={projectForm.documents} onChange={(selected) => setProjectForm(prev => ({ ...prev, documents: selected }))} />
              <p className="text-xs text-muted-foreground">Select documents to ground the AI's responses.</p>
            </div>
            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea placeholder="Define the AI's personality and instructions..." value={projectForm.systemPrompt} onChange={(e) => setProjectForm(prev => ({ ...prev, systemPrompt: e.target.value }))} className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label>Temperature: {projectForm.temperature}</Label>
              <Slider value={[projectForm.temperature]} onValueChange={([value]) => setProjectForm(prev => ({ ...prev, temperature: value }))} max={2} min={0} step={0.1} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Project'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deploy Project</DialogTitle>
            <DialogDescription>Deploy "{selectedProject?.name}" to production? This will make it accessible via an API endpoint.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeployDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDeploy} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              <Rocket size={16} className="mr-2" />
              {isLoading ? 'Deploying...' : 'Confirm Deploy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Projects</p><p className="text-2xl font-bold">{totalProjects}</p></div><Brain size={24} className="text-primary" weight="duotone" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Deployed</p><p className="text-2xl font-bold text-green-600">{deployedProjects}</p></div><Rocket size={24} className="text-green-600" weight="duotone" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">In Development</p><p className="text-2xl font-bold text-yellow-600">{devProjects}</p></div><Code size={24} className="text-yellow-600" weight="duotone" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">API Calls Today</p><p className="text-2xl font-bold">{totalApiCalls.toLocaleString()}</p></div><CheckCircle size={24} className="text-primary" weight="duotone" /></div></CardContent></Card>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center"><Brain size={32} className="text-muted-foreground" /></div>
            <div><h3 className="font-semibold text-lg">No projects yet</h3><p className="text-muted-foreground">Create your first AI project to get started</p></div>
            <Button onClick={handleOpenCreateDialog} className="gap-2"><Plus size={16} />Create Project</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => {
            const statusConfig = getStatusConfig(project.status);
            const StatusIcon = statusConfig.icon;
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1"><CardTitle className="text-lg">{project.name}</CardTitle><CardDescription className="text-sm">{project.description || 'No description provided'}</CardDescription></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${statusConfig.color} border`}><StatusIcon size={12} className="mr-1" />{statusConfig.label}</Badge>
                      <Badge variant="secondary" className="text-xs">v{project.version}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Model: {project.model}</p>
                      <p>Temp: {project.temperature}</p>
                    </div>
                    {project.documents && project.documents.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs">Knowledge Base</Label>
                        <div className="flex flex-wrap gap-1">
                          {project.documents.map(doc => (
                            <Badge key={doc._id || doc.id} variant="outline" className="flex items-center gap-1">
                              <Folder size={12} />{doc.fileName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 mt-auto">
                      <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleOpenEditDialog(project)}>
                        <PencilSimple size={14} />Edit
                      </Button>

                      {project.status === 'deployed' ? (
                        <Button variant="secondary" size="sm" className="flex-1 gap-1" onClick={() => handleViewAPI(project)}>
                          <LinkIcon size={14} />View API Keys
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleOpenDeployDialog(project)}>
                          <Rocket size={14} />Deploy
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project.id)} className="text-destructive hover:text-destructive px-2">
                        <Trash size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}