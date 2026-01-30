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
import { Plus, Rocket, Clock, CheckCircle, Code, Brain, Trash, PencilSimple, Folder, Eye, Link as LinkIcon, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../lib/apiService';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PROJECT_FORM = {
  name: '',
  description: '',
  model: 'gpt-oss',
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
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border-[#0b131e]/10 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-[#eff5fb]/50 border-b border-[#0b131e]/5">
            <DialogTitle className="text-2xl font-bold text-[#0b131e]">{modalMode === 'create' ? 'Create New Project' : 'Edit Project'}</DialogTitle>
            <DialogDescription className="text-[#0b131e]/60 font-medium">{modalMode === 'create' ? 'Configure and save your custom AI assistant.' : 'Update your project configuration.'}</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="project-name" className="text-[#0b131e]/70 font-semibold text-sm">Project Name</Label>
                <Input id="project-name" placeholder="Customer Support Bot" className="h-11 bg-[#eff5fb]/30 border-[#0b131e]/10 rounded-xl" value={projectForm.name} onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-model" className="text-[#0b131e]/70 font-semibold text-sm">Base Model</Label>
                <Select value={projectForm.model} onValueChange={(value) => setProjectForm(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger className="h-11 bg-[#eff5fb]/30 border-[#0b131e]/10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white border-[#0b131e]/10 rounded-xl shadow-xl">
                    <SelectItem value="gpt-oss">GPT-OSS (Fast Model)</SelectItem>
                    <SelectItem value="gpt-5-nano">GPT-5 Nano (Fast Model)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description" className="text-[#0b131e]/70 font-semibold text-sm">Description</Label>
              <Textarea id="project-description" placeholder="A brief description of what this assistant does." className="bg-[#eff5fb]/30 border-[#0b131e]/10 rounded-xl min-h-[80px]" value={projectForm.description} onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge-base" className="text-[#0b131e]/70 font-semibold text-sm">Knowledge Base</Label>
              <MultiSelect
                options={dataSourceOptions}
                selected={projectForm.documents}
                onChange={(selected) => setProjectForm(prev => ({ ...prev, documents: selected }))}
                className="bg-[#eff5fb]/30 border-[#0b131e]/10 rounded-xl"
              />
              <p className="text-xs text-[#0b131e]/50 font-medium">Select documents to ground the AI's responses.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[#0b131e]/70 font-semibold text-sm">System Prompt</Label>
              <Textarea placeholder="Define the AI's personality and instructions..." value={projectForm.systemPrompt} onChange={(e) => setProjectForm(prev => ({ ...prev, systemPrompt: e.target.value }))} className="bg-[#eff5fb]/30 border-[#0b131e]/10 rounded-xl min-h-[120px]" />
            </div>
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <Label className="text-[#0b131e]/70 font-semibold text-sm">Creativity (Temperature)</Label>
                <Badge variant="secondary" className="bg-[#2d74d7]/10 text-[#2d74d7] border-none font-bold">{projectForm.temperature}</Badge>
              </div>
              <Slider value={[projectForm.temperature]} onValueChange={([value]) => setProjectForm(prev => ({ ...prev, temperature: value }))} max={2} min={0} step={0.1} className="py-4" />
            </div>
          </div>
          <DialogFooter className="p-6 bg-[#eff5fb]/30 border-t border-[#0b131e]/5 sm:justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl border-[#0b131e]/10 hover:bg-white/50 font-semibold">Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isLoading} className="rounded-xl bg-[#2d74d7] hover:bg-[#2d74d7]/90 text-white font-bold h-11 px-8 shadow-lg shadow-blue-500/20">{isLoading ? 'Saving...' : 'Save Project'}</Button>
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
        {[
          { title: "Total Projects", value: totalProjects, icon: Brain, color: "text-primary" },
          { title: "Deployed", value: deployedProjects, icon: Rocket, color: "text-green-600" },
          { title: "In Development", value: devProjects, icon: Code, color: "text-yellow-600" },
          { title: "API Calls Today", value: totalApiCalls.toLocaleString(), icon: CheckCircle, color: "text-primary" }
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="hover:border-[#2d74d7]/20 transition-colors duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold font-mono text-[#0b131e]">{stat.value}</p>
                  </div>
                  <stat.icon size={28} className={stat.color} weight="duotone" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
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

              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8, scale: 1.005 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="group bg-white border-[#0b131e]/10 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer border-t-4 border-t-transparent hover:border-t-[#2d74d7]">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-[#0b131e] group-hover:text-[#2d74d7] transition-colors">{project.name}</CardTitle>
                        <CardDescription className="text-sm text-[#0b131e]/60 font-medium line-clamp-2">{project.description || 'No description provided'}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow flex flex-col p-6 pt-0">
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <Badge variant="outline" className={`${statusConfig.color} border py-1`}>
                        <StatusIcon size={12} className="mr-1" />{statusConfig.label}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-[#eff5fb] text-[#2d74d7]">v{project.version}</Badge>
                    </div>
                    {/* ... content ... */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1"><Sparkle size={14} className="text-[#2d74d7]" /> {project.model}</p>
                    </div>

                    {project.documents && project.documents.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#0b131e]/5">
                        <Label className="text-xs text-[#0b131e]/40 font-bold uppercase tracking-wider">Knowledge Base</Label>
                        <div className="flex flex-wrap gap-1">
                          {project.documents.map(doc => (
                            <Badge key={doc._id || doc.id} variant="outline" className="flex items-center gap-1 bg-white hover:bg-[#eff5fb] transition-colors">
                              <Folder size={12} className="text-[#2d74d7]" />{doc.fileName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 mt-auto transition-opacity duration-200">
                      <Button variant="outline" size="sm" className="flex-1 gap-1 border-[#0b131e]/10 hover:border-[#2d74d7] hover:text-[#2d74d7]" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(project); }}>
                        <PencilSimple size={14} />Edit
                      </Button>

                      {project.status === 'deployed' ? (
                        <Button variant="secondary" size="sm" className="flex-1 gap-1 text-[#2d74d7] bg-[#eff5fb] hover:bg-[#2d74d7]/10" onClick={(e) => { e.stopPropagation(); handleViewAPI(project); }}>
                          <LinkIcon size={14} />API Keys
                        </Button>
                      ) : (
                        <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20" onClick={(e) => { e.stopPropagation(); handleOpenDeployDialog(project); }}>
                          <Rocket size={14} />Deploy
                        </Button>
                      )}

                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="text-destructive hover:bg-destructive/10 px-2 rounded-lg">
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