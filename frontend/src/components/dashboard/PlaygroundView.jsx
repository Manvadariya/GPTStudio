import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MultiSelect } from "@/components/ui/multi-select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  PaperPlaneTilt,
  Stop,
  Robot,
  User,
  Trash,
  Gear,
  Sparkle,
  ChatCircle,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAppContext } from "../../context/AppContext";
import { apiService } from "../../lib/apiService";
import { ConversationTemplates } from "./playground/ConversationTemplates";

export function PlaygroundView() {
  const { playgroundMessages, setPlaygroundMessages, dataSources } =
    useAppContext();

  const messages = Array.isArray(playgroundMessages)
    ? playgroundMessages
    : [];

  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedRagDocumentIds, setSelectedRagDocumentIds] = useState([]);
  const [modelConfig, setModelConfig] = useState({
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: "You are a helpful AI assistant.",
  });

  const [showTemplates, setShowTemplates] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const readyDataSources = useMemo(
    () => dataSources.filter((ds) => ds.status === "ready"),
    [dataSources]
  );

  const multiSelectOptions = useMemo(
    () =>
      readyDataSources.map((ds) => ({
        value: ds.ragDocumentId,
        label: ds.name,
      })),
    [readyDataSources]
  );

  useEffect(() => {
    const availableIds = new Set(
      readyDataSources.map((ds) => ds.ragDocumentId)
    );
    const newSelectedIds = selectedRagDocumentIds.filter((id) =>
      availableIds.has(id)
    );
    if (newSelectedIds.length < selectedRagDocumentIds.length) {
      setSelectedRagDocumentIds(newSelectedIds);
    }
  }, [readyDataSources, selectedRagDocumentIds]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;
    if (selectedRagDocumentIds.length === 0) {
      toast.error(
        "Please select at least one Knowledge Base source to chat with."
      );
      return;
    }
    const userMessage = { id: `msg_${Date.now()}`, type: "user", content: currentMessage.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMessage];
    setPlaygroundMessages(newMessages);
    const question = currentMessage.trim();
    setCurrentMessage("");
    setIsTyping(true);
    try {
      const historyToInclude = newMessages.slice(0, -1).slice(-6);
      const formattedHistory = historyToInclude.map((msg) => ({
        type: msg.type,
        content: msg.content,
      }));
      const chatData = { question, documentIds: selectedRagDocumentIds, systemPrompt: modelConfig.systemPrompt, history: formattedHistory };
      const response = await apiService.sendMessageToRAG(chatData);
      const assistantMessage = { id: `msg_${Date.now() + 1}`, type: "assistant", content: response.answer, timestamp: new Date().toISOString() };
      setPlaygroundMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error(`Error from AI: ${error.message}`);
      const errorMessage = { id: `err_${Date.now()}`, type: "assistant", content: "Sorry, I ran into an error. Please try again.", timestamp: new Date().toISOString() };
      setPlaygroundMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearConversation = () => {
    setPlaygroundMessages([]);
    toast.success("Conversation cleared");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTemplateSelect = (template) => {
    setModelConfig((prev) => ({ ...prev, systemPrompt: template.systemPrompt }));
    setShowTemplates(false);
    clearConversation();
    toast.success(`Applied "${template.name}" template`);
  };

  if (showTemplates) {
    return (
      <div className="flex-1 max-w-7xl mx-auto p-6">
        <ConversationTemplates onSelectTemplate={handleTemplateSelect} onClose={() => setShowTemplates(false)} />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold tracking-tight">AI Playground</h1><p className="text-muted-foreground mt-1">Test your AI against your Knowledge Base</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-2"><Sparkle size={16} /> Templates</Button>
          <Button variant="outline" size="sm" onClick={clearConversation}><Trash size={16} className="mr-2" />Clear</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Gear size={20} />Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="dataSource">Knowledge Base</Label><MultiSelect options={multiSelectOptions} selected={selectedRagDocumentIds} onChange={setSelectedRagDocumentIds} className="w-full" /></div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Advanced Settings</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  <div className="space-y-2"><Label htmlFor="systemPrompt">System Prompt</Label><Textarea id="systemPrompt" placeholder="e.g., You are a helpful pirate assistant..." value={modelConfig.systemPrompt} onChange={(e) => setModelConfig(prev => ({ ...prev, systemPrompt: e.target.value }))} className="min-h-[120px] resize-y" /></div>
                  <div className="space-y-2"><Label htmlFor="model">Model</Label><Select value={modelConfig.model} onValueChange={(value) => setModelConfig(prev => ({ ...prev, model: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gpt-4o">GPT-4o</SelectItem><SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="temperature">Temperature: {modelConfig.temperature}</Label><Slider value={[modelConfig.temperature]} onValueChange={([value]) => setModelConfig(prev => ({ ...prev, temperature: value }))} max={2} min={0} step={0.1} /></div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* --- START: THE FIX --- */}
        {/* We restructure the chat panel for robust layout control.
            1. The Card itself becomes the main flex container with `overflow-hidden`.
            2. The Header, ScrollArea, and Input Box are now direct children, allowing precise control.
            3. The ScrollArea is the ONLY element with `flex-1`, forcing it to fill the remaining space. */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <ChatCircle size={20} />Conversation
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div className="space-y-6 max-w-md"><div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"><Robot size={24} className="text-primary" /></div>
                    <div><p className="text-lg font-medium">Start a conversation</p><p className="text-sm text-muted-foreground mb-4">Select one or more documents and ask a question to begin.</p></div>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div key={message.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      {message.type === "assistant" && (<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><Robot size={16} className="text-primary"/></div>)}
                      <div className="max-w-[70%]"><div className={`rounded-2xl px-4 py-3 ${message.type === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}><p className="whitespace-pre-wrap">{message.content}</p></div></div>
                      {message.type === "user" && (<div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1"><User size={16} className="text-secondary-foreground"/></div>)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0"><Robot size={16} className="text-primary"/></div>
                    <div className="bg-muted rounded-2xl px-4 py-3"><div className="flex space-x-1"><div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" /><div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" /><div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" /></div></div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 flex-shrink-0">
            <div className="flex gap-3">
              <div className="flex-1">
                <Textarea ref={inputRef} placeholder="Ask a question about your selected document(s)..." value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={handleKeyPress} className="min-h-[60px] max-h-32 resize-none" disabled={isTyping} />
              </div>
              <Button onClick={sendMessage} disabled={!currentMessage.trim() || isTyping} size="lg" className="self-end" variant={isTyping ? "secondary" : "default"}>
                {isTyping ? <Stop size={18} /> : <PaperPlaneTilt size={18} />}
              </Button>
            </div>
          </div>
        </Card>
        {/* --- END: THE FIX --- */}
      </div>
    </div>
  );
}