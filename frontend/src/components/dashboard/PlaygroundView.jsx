import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import { MessageLoading } from "./playground/MessageLoading";
import { CodeBlock } from "./playground/CodeBlock";
import { CustomTable, CustomThead, CustomTbody, CustomTr, CustomTh, CustomTd } from "./playground/MarkdownComponents";

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
    model: "qwen-fast",
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
      const chatData = { question, documentIds: selectedRagDocumentIds, systemPrompt: modelConfig.systemPrompt, history: formattedHistory, modelProvider: modelConfig.model };

      // Use streaming for qwen-fast and gpt-oss models
      if (modelConfig.model === 'qwen-fast' || modelConfig.model === 'gpt-oss') {
        const assistantMessageId = `msg_${Date.now() + 1}`;
        let accumulatedContent = '';
        let messageAdded = false;

        await apiService.streamMessageToRAG(chatData, (chunk) => {
          if (chunk.type === 'content') {
            accumulatedContent += chunk.content;

            if (!messageAdded) {
              // Add message on first content chunk (no more empty bubble)
              setPlaygroundMessages((prev) => [...prev, {
                id: assistantMessageId,
                type: "assistant",
                content: accumulatedContent,
                timestamp: new Date().toISOString()
              }]);
              messageAdded = true;
              setIsTyping(false); // Hide typing indicator once streaming starts
            } else {
              // Update the message content in real-time
              setPlaygroundMessages((prev) =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              );
            }
          }
        });
      } else {
        // Non-streaming for Azure model
        const response = await apiService.sendMessageToRAG(chatData);
        const assistantMessage = { id: `msg_${Date.now() + 1}`, type: "assistant", content: response.answer, timestamp: new Date().toISOString() };
        setPlaygroundMessages((prev) => [...prev, assistantMessage]);
      }
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
        <Card className="lg:col-span-1 h-fit shadow-md border-muted/20">
          <CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2 font-semibold"><Gear size={20} className="text-primary" />Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="dataSource" className="text-sm font-medium">Knowledge Base</Label><MultiSelect options={multiSelectOptions} selected={selectedRagDocumentIds} onChange={setSelectedRagDocumentIds} className="w-full" /></div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="py-2 text-sm hover:no-underline font-medium">Advanced Settings</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4 border-t border-muted/10">
                  <div className="space-y-2"><Label htmlFor="systemPrompt" className="text-xs">System Prompt</Label><Textarea id="systemPrompt" placeholder="e.g., You are a helpful pirate assistant..." value={modelConfig.systemPrompt} onChange={(e) => setModelConfig(prev => ({ ...prev, systemPrompt: e.target.value }))} className="min-h-[120px] resize-y text-sm" /></div>
                  <div className="space-y-2"><Label htmlFor="model" className="text-xs">Model</Label><Select value={modelConfig.model} onValueChange={(value) => setModelConfig(prev => ({ ...prev, model: value }))}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="qwen-fast">Step Flash (Recommended)</SelectItem><SelectItem value="gpt-oss">GPT-OSS (OpenRouter)</SelectItem><SelectItem value="gpt-5-nano">GPT-5 Nano (Azure)</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="temperature" className="text-xs">Temperature: {modelConfig.temperature}</Label><Slider value={[modelConfig.temperature]} onValueChange={([value]) => setModelConfig(prev => ({ ...prev, temperature: value }))} max={2} min={0} step={0.1} /></div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 flex flex-col overflow-hidden shadow-xl border-muted/20 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex-shrink-0 border-b border-muted/10 py-4">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold text-primary">
              <ChatCircle size={22} weight="fill" />Conversation
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6 max-w-4xl mx-auto pb-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-80">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 max-w-md">
                    <div className="mx-auto w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center border border-primary/10 shadow-inner">
                      <Robot size={36} className="text-primary animate-pulse" weight="duotone" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground/90">AI Knowledge Assistant</p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Select a Knowledge Base from the sidebar and start chatting to get grounded insights from your data.</p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`flex gap-4 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.type === "assistant" && (
                        <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl flex-shrink-0 mt-1 shadow-lg shadow-primary/20 ring-2 ring-background">
                          <Robot size={18} className="text-primary-foreground" weight="bold" />
                        </div>
                      )}

                      <div className={`flex flex-col gap-1.5 ${message.type === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                        <div className={`rounded-2xl px-5 py-3.5 shadow-sm border ${message.type === "user"
                          ? "bg-primary text-white border-primary/20 rounded-tr-none shadow-primary/10"
                          : "bg-slate-50 text-slate-900 border-slate-200 rounded-tl-none shadow-slate-100"
                          }`}>
                          {message.type === "assistant" ? (
                            <div className="prose prose-sm max-w-none text-slate-900 leading-relaxed
                              prose-headings:text-slate-900 prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0
                              prose-p:mb-4 prose-p:last:mb-0 prose-p:leading-relaxed
                              prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
                              prose-strong:text-slate-900 prose-strong:font-bold
                              prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                              prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:border-none prose-pre:shadow-none prose-pre:text-inherit
                              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5
                              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5
                              prose-li:my-1.5 prose-li:pl-1
                            ">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code: CodeBlock,
                                  table: CustomTable,
                                  thead: CustomThead,
                                  tbody: CustomTbody,
                                  tr: CustomTr,
                                  th: CustomTh,
                                  td: CustomTd
                                }}
                              >
                                {message.content.replace(/<br>/g, '\n')}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 px-1 font-medium mt-0.5">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {message.type === "user" && (
                        <div className="w-9 h-9 bg-slate-800 flex items-center justify-center rounded-xl flex-shrink-0 mt-1 shadow-lg shadow-slate-900/10 ring-2 ring-background">
                          <User size={18} className="text-white" weight="bold" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <AnimatePresence>
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-4">
                    <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-xl flex-shrink-0 mt-1 border border-primary/20">
                      <Robot size={18} className="text-primary" weight="bold" />
                    </div>
                    <div className="bg-slate-50 rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm rounded-tl-none">
                      <MessageLoading />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-muted/10 p-4 bg-background/80 backdrop-blur-md">
            <div className="flex gap-3 max-w-4xl mx-auto relative group">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  placeholder="Ask a question about your selected document(s)..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="min-h-[60px] max-h-32 resize-none pr-12 py-3 rounded-2xl border-muted/20 bg-background shadow-sm focus-visible:ring-primary/20 transition-all"
                  disabled={isTyping}
                />
                <div className="absolute right-3 bottom-3">
                  <Button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    size="icon"
                    className={`rounded-xl transition-all h-9 w-9 ${isTyping ? "bg-secondary" : "bg-primary shadow-lg shadow-primary/20"}`}
                    variant={isTyping ? "secondary" : "default"}
                  >
                    {isTyping ? <Stop size={18} /> : <PaperPlaneTilt size={18} weight="bold" />}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground/50 mt-2">
              AI generated content may be inaccurate. Verify important information.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}