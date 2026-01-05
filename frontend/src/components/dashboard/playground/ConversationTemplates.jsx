import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Headphones, Code, GraduationCap, Briefcase, Lightbulb, Heart,
  MagnifyingGlass, Star, X, ArrowRight, Users
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

// This is the complete list of templates
const templates = [
  {
    id: 'customer-support',
    name: 'Customer Support Bot',
    description: 'Helpful assistant for handling customer inquiries and support tickets',
    category: 'Business',
    icon: <Headphones size={20} />,
    systemPrompt: `You are a friendly and professional customer support assistant. Your goal is to help customers resolve their issues quickly and efficiently. Always:\n\n1. Greet customers warmly and acknowledge their concern.\n2. Ask clarifying questions to understand the issue.\n3. Provide step-by-step solutions.\n4. Be patient and empathetic.\n5. If you cannot solve an issue, explain the next steps clearly.`,
    tags: ['support', 'customer-service', 'help-desk'],
    sampleConversations: [{ user: "My order hasn't arrived yet.", assistant: "I apologize for the delay. Could you please provide your order number so I can check its status?" }],
    complexity: 'Simple'
  },
  {
    id: 'coding-assistant',
    name: 'Code Review Assistant',
    description: 'Expert assistant for code review, debugging, and best practices',
    category: 'Technical',
    icon: <Code size={20} />,
    systemPrompt: `You are an expert programming assistant specializing in code review and debugging. Analyze code for bugs, performance issues, and security vulnerabilities. Suggest improvements for readability and maintainability. Provide refactored code examples when helpful.`,
    tags: ['programming', 'code-review', 'debugging'],
    sampleConversations: [{ user: "Can you review this Python function?", assistant: "Of course. Please paste the function, and I'll provide a detailed review focusing on best practices." }],
    complexity: 'Advanced'
  },
  {
    id: 'personal-tutor',
    name: 'Personal Tutor',
    description: 'Adaptive learning assistant that explains complex topics in simple terms',
    category: 'Education',
    icon: <GraduationCap size={20} />,
    systemPrompt: `You are a patient and knowledgeable personal tutor. Your goal is to help students understand complex topics by breaking them down into digestible concepts. Use analogies and real-world examples to explain things. Always check for understanding before moving on.`,
    tags: ['education', 'learning', 'tutoring'],
    sampleConversations: [{ user: "I don't understand how photosynthesis works.", assistant: "Great question! Think of it like a plant's recipe for making its own food. It needs three ingredients: sunlight, water, and carbon dioxide. Want to go through the steps?" }],
    complexity: 'Intermediate'
  },
  {
    id: 'business-analyst',
    name: 'Business Strategy Advisor',
    description: 'Strategic business consultant for planning, analysis, and decision-making',
    category: 'Business',
    icon: <Briefcase size={20} />,
    systemPrompt: `You are a strategic business advisor with expertise in business analysis, market research, and financial planning. Help users make informed decisions by providing data-driven insights and considering multiple perspectives. Be practical and actionable in your recommendations.`,
    tags: ['business', 'strategy', 'analysis', 'planning'],
    sampleConversations: [{ user: "I'm thinking about expanding my bakery to offer online delivery. What should I consider?", assistant: "That's an exciting step! Let's break it down. We should analyze your local market demand, competitors, operational logistics like packaging and delivery zones, and the financial impact on your profit margins." }],
    complexity: 'Advanced'
  },
  {
    id: 'creative-writer',
    name: 'Creative Writing Assistant',
    description: 'Imaginative companion for stories, poems, and creative content',
    category: 'Creative',
    icon: <Lightbulb size={20} />,
    systemPrompt: `You are a creative writing assistant and storytelling expert. Your passion is helping writers develop compelling narratives. Help brainstorm ideas, develop characters, and craft engaging dialogue. Be inspiring, encouraging, and imaginative.`,
    tags: ['writing', 'storytelling', 'creative'],
    sampleConversations: [{ user: "I'm stuck. My main character feels flat.", assistant: "Let's bring them to life! A great character often has a core contradiction. For instance, are they a brave firefighter who's secretly afraid of heights? What's a surprising conflict within them?" }],
    complexity: 'Intermediate'
  },
  {
    id: 'health-coach',
    name: 'Health & Wellness Coach',
    description: 'Supportive wellness assistant for healthy lifestyle guidance',
    category: 'Lifestyle',
    icon: <Heart size={20} />,
    systemPrompt: `You are a supportive health and wellness coach. Provide evidence-based health information and encourage gradual, sustainable lifestyle changes. Be non-judgmental and supportive. IMPORTANT: Always remind users to consult healthcare professionals for medical concerns. You provide general wellness guidance, not medical advice.`,
    tags: ['health', 'wellness', 'fitness', 'nutrition'],
    sampleConversations: [{ user: "I'm always too busy to cook healthy meals. Any tips?", assistant: "I understand how challenging that can be! Let's focus on quick-prep meals. Have you considered batch cooking on weekends or trying mason jar salads? We can find a strategy that fits your schedule." }],
    complexity: 'Simple'
  }
];

const categories = Array.from(new Set(templates.map(t => t.category)));

export function ConversationTemplates({ onSelectTemplate, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  })

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedTemplate(null)}><ArrowRight size={16} className="rotate-180 mr-2" />Back to Templates</Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">{selectedTemplate.icon}</div>
            <div><h2 className="text-2xl font-bold">{selectedTemplate.name}</h2><p className="text-muted-foreground">{selectedTemplate.description}</p></div>
          </div>
          <div className="ml-auto"><Button onClick={() => onSelectTemplate(selectedTemplate)} size="lg">Use This Template</Button></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Template Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div><h4 className="font-semibold mb-2">System Prompt</h4><div className="bg-muted rounded-lg p-4 text-sm"><pre className="whitespace-pre-wrap font-mono">{selectedTemplate.systemPrompt}</pre></div></div>
              <div><h4 className="font-semibold mb-2">Sample Conversations</h4>
                <div className="space-y-4">
                  {selectedTemplate.sampleConversations.map((conv, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="flex gap-3"><div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0"><Users size={12} /></div><div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[80%]">{conv.user}</div></div>
                      <div className="flex gap-3"><div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 text-primary">{selectedTemplate.icon}</div><div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">{conv.assistant}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card><CardHeader><CardTitle className="text-lg">Template Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><h5 className="font-medium text-sm mb-2">Category</h5><Badge variant="outline">{selectedTemplate.category}</Badge></div>
                <div><h5 className="font-medium text-sm mb-2">Complexity</h5><Badge variant={selectedTemplate.complexity === 'Simple' ? 'secondary' : 'default'}>{selectedTemplate.complexity}</Badge></div>
                <div><h5 className="font-medium text-sm mb-2">Tags</h5><div className="flex flex-wrap gap-1">{selectedTemplate.tags.map(tag => (<Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>))}</div></div>
              </CardContent>
            </Card>
            <Button onClick={() => onSelectTemplate(selectedTemplate)} className="w-full" size="lg">Start Using Template</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">AI Assistant Templates</h1><p className="text-muted-foreground">Choose from pre-built AI assistants for specific use cases</p></div>
        <Button variant="outline" onClick={onClose}><X size={16} className="mr-2" />Close</Button>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 relative"><MagnifyingGlass size={16} className="absolute left-3 top-3 text-muted-foreground" /><Input placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <div className="flex gap-2">
          <Button variant={selectedCategory === 'All' ? 'default' : 'outline'} onClick={() => setSelectedCategory('All')} size="sm">All</Button>
          {categories.map(category => (<Button key={category} variant={selectedCategory === category ? 'default' : 'outline'} onClick={() => setSelectedCategory(category)} size="sm">{category}</Button>))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <motion.div key={template.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedTemplate(template)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">{template.icon}</div>
                      <div><CardTitle className="text-lg">{template.name}</CardTitle><Badge variant="outline" className="text-xs">{template.category}</Badge></div>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">{template.tags.slice(0, 3).map(tag => (<Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>))}</div>
                  <div className="flex justify-end mt-4"><Button size="sm" onClick={(e) => { e.stopPropagation(); onSelectTemplate(template); }}>Use Template</Button></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}