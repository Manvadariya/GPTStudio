import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { User, Shield, Key, Copy, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { apiService } from '../../lib/apiService';
import { useSearchParams } from 'react-router-dom';

export function SettingsView() {
  const { user, setUser, projects, isInitializing } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [profile, setProfile] = useState({ name: '', email: '', company: '' });
  const [securitySettings, setSecuritySettings] = useState({ sessionTimeout: '8h' });
  const [apiKeys, setApiKeys] = useState([]);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: '', projectId: '' });

  const deployedProjects = useMemo(() => projects.filter(p => p.status === 'deployed'), [projects]);

  useEffect(() => {
    if (isInitializing) return;
    if (user) {
      setProfile({ name: user.name, email: user.email, company: user.company });
      setSecuritySettings({ 
        sessionTimeout: user.sessionTimeout || '8h'
      });
    }
  }, [isInitializing, user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'api' && !isInitializing) {
      fetchApiKeys();
    }
  }, [activeTab, isInitializing]);

  const fetchApiKeys = async () => {
    try {
      const keys = await apiService.getApiKeys();
      setApiKeys(keys.map(k => ({ ...k, id: k._id })));
    } catch (error) {
      toast.error('Failed to fetch API keys.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await apiService.updateUserProfile(profile);
      setUser(prev => ({...prev, ...updatedUser}));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(`Failed to update profile: ${error.message}`);
    }
  };

  const handleUpdateSecuritySetting = async (setting, value) => {
    try {
      const updatedUser = await apiService.updateUserProfile({ [setting]: value });
      setUser(prev => ({...prev, ...updatedUser}));
      setSecuritySettings(prev => ({ ...prev, [setting]: value }));
      toast.success('Security setting updated');
    } catch (error) {
      toast.error(`Failed to update setting: ${error.message}`);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyData.name || !newKeyData.projectId) {
      return toast.error("Please provide a key name and select a project.");
    }
    try {
      const response = await apiService.generateApiKey(newKeyData);
      fetchApiKeys();
      setIsKeyModalOpen(false);
      setNewKeyData({ name: '', projectId: '' });

      toast.success('API Key generated successfully!', {
        description: `Key for "${response.apiKey.projectId.name}". Copy it now, you won't see it again.`,
        action: {
          label: 'Copy Key',
          onClick: () => {
            navigator.clipboard.writeText(response.apiKey.key);
            toast.success("Key copied to clipboard!");
          },
        },
        duration: 20000,
      });
    } catch (error) {
       toast.error(`Failed to generate API key: ${error.message}`);
    }
  };
  
  const handleDeleteApiKey = async (keyId) => {
    try {
        await apiService.deleteApiKey(keyId);
        setApiKeys(current => current.filter(key => key.id !== keyId));
        toast.success("API Key deleted.");
    } catch(error) {
        toast.error(`Failed to delete API key: ${error.message}`);
    }
  };
  
  if (isInitializing || !user) {
    return (
        <div className="space-y-6">
            <div><h2 className="text-3xl font-bold tracking-tight">Settings</h2><p className="text-muted-foreground">Loading your settings...</p></div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-3xl font-bold tracking-tight">Settings</h2><p className="text-muted-foreground">Manage your account preferences and security settings</p></div>
      <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setSearchParams({ tab }); }} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2"><User size={16} />Profile</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield size={16} />Security</TabsTrigger>
          <TabsTrigger value="api" className="gap-2"><Key size={16} />API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Update your account profile and preferences</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={profile.name} onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={profile.email} onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="company">Company</Label><Input id="company" value={profile.company} onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))} /></div>
              </div>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle><CardDescription>Manage your account security and access</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select value={securitySettings.sessionTimeout} onValueChange={(value) => handleUpdateSecuritySetting('sessionTimeout', value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1h">1 hour</SelectItem><SelectItem value="8h">8 hours</SelectItem><SelectItem value="24h">24 hours</SelectItem><SelectItem value="7d">7 days</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>API Keys</CardTitle><CardDescription>Manage keys for programmatic access to your deployed projects.</CardDescription></div>
              <Button className="gap-2" onClick={() => setIsKeyModalOpen(true)}><Key size={16} />Generate New API Key</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No API keys created yet.</p>
              ) : (
                apiKeys.map((apiKey) => (
                  <motion.div key={apiKey.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{apiKey.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Project: <Badge variant="secondary">{apiKey.projectId?.name || 'Deleted'}</Badge></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteApiKey(apiKey.id)} className="text-destructive hover:text-destructive"><Trash size={16}/></Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{`${apiKey.keyPrefix}........................${apiKey.lastFour}`}</code>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Generate New API Key</DialogTitle>
                <DialogDescription>Keys grant access to a specific deployed project's API.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input id="key-name" placeholder="e.g., My Web App Key" value={newKeyData.name} onChange={(e) => setNewKeyData(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="key-project">Project</Label>
                    <Select value={newKeyData.projectId} onValueChange={(value) => setNewKeyData(p => ({...p, projectId: value}))}>
                        <SelectTrigger><SelectValue placeholder="Select a deployed project..." /></SelectTrigger>
                        <SelectContent>
                            {deployedProjects.length > 0 ? (
                                deployedProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                            ) : (
                                <SelectItem value="none" disabled>No deployed projects found</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsKeyModalOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerateApiKey}>Generate Key</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}