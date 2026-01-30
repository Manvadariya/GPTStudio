import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BookOpen,
    Code,
    Copy,
    Check,
    TerminalWindow,
    Robot,
    Key,
    Globe
} from '@phosphor-icons/react';
import { DocCodeBlock } from './playground/DocCodeBlock';
import { toast } from 'sonner';

export function DocumentationView() {
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const curlCommand = `curl http://localhost:3001/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "question": "List all the employees who are working in the IT department",
    "history": []
  }'`;

    const jsExample = `const response = await fetch('http://localhost:3001/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    question: 'List all the employees who are working in the IT department',
    history: []
  })
});

const data = await response.json();
console.log(data);`;

    return (
        <div className="flex-1 overflow-auto bg-white min-h-full">
            <div className="max-w-5xl mx-auto p-8 space-y-12">

                {/* Header Section */}
                <div className="space-y-4 border-b border-slate-100 pb-8">
                    <div className="flex items-center gap-3 text-primary mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen size={24} weight="duotone" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">API Documentation</h1>
                    </div>
                    <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
                        Integrate GPTStudio's powerful AI models directly into your applications.
                        Our API is optimized for speed and easy integration with modern backend systems.
                    </p>
                    <div className="flex gap-4 pt-2">
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Key size={18} /> Get API Key
                        </Button>
                    </div>
                </div>

                {/* Quick Start Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Quick Start</h2>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">v1.0.0</Badge>
                    </div>

                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TerminalWindow size={20} className="text-slate-500" />
                                    <span className="font-mono text-sm font-medium text-slate-700">Chat & Reasoning API</span>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase">Streaming Supported</Badge>
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none font-mono">POST</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <div className="p-0">
                            <Tabs defaultValue="curl" className="w-full">
                                <div className="border-b border-slate-100 px-4 bg-white">
                                    <TabsList className="bg-transparent h-12 p-0 space-x-6">
                                        <TabsTrigger value="curl" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all">cURL</TabsTrigger>
                                        <TabsTrigger value="stream" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all">Streaming (SSE)</TabsTrigger>
                                        <TabsTrigger value="python" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-all">Python</TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="curl" className="mt-0">
                                    <div className="relative group">
                                        <DocCodeBlock language="bash" className="my-0 rounded-none border-0">
                                            {curlCommand}
                                        </DocCodeBlock>
                                    </div>
                                </TabsContent>
                                <TabsContent value="stream" className="mt-0">
                                    <DocCodeBlock language="bash" className="my-0 rounded-none border-0">
                                        {`curl http://localhost:3001/api/chat/stream \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "question": "List all the employees who are working in the IT department",
    "history": [],
    "stream": true
  }'`}
                                    </DocCodeBlock>
                                </TabsContent>
                                <TabsContent value="python" className="mt-0">
                                    <DocCodeBlock language="python" className="my-0 rounded-none border-0">
                                        {`import requests
import json

url = "http://localhost:3001/api/v1/chat"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "question": "List all the employees who are working in the IT department",
    "history": []
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`}
                                    </DocCodeBlock>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </Card>
                </section>

                {/* Model Providers Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                        <h2 className="text-2xl font-bold text-slate-900">Available Models</h2>
                        <div className="h-px bg-slate-100 flex-1 ml-4"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Robot size={20} />
                                    </span>
                                    GPT-OSS (Fast Model)
                                </CardTitle>
                                <CardDescription>
                                    Optimized for speed. Best for generic chat, code generation, and low-latency tasks.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-500">Model ID</span>
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">gpt-oss</code>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-500">Provider</span>
                                    <span className="text-sm font-medium text-slate-900">OpenRouter</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-500">Context Window</span>
                                    <span className="text-sm font-medium text-slate-900">128k Tokens</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-slate-500">Pricing</span>
                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Free Tier Available</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Robot size={20} weight="duotone" />
                                    </span>
                                    GPT-5 Nano (Fast Model)
                                </CardTitle>
                                <CardDescription>
                                    High-performance reasoning. Optimized for complex enterprise tasks.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-500">Model ID</span>
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">gpt-5-nano</code>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-500">Provider</span>
                                    <span className="text-sm font-medium text-slate-900">Azure OpenAI</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm text-slate-500">Context Window</span>
                                    <span className="text-sm font-medium text-slate-900">32k Tokens</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-slate-500">Pricing</span>
                                    <span className="text-sm font-medium text-slate-900">Usage Based</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

            </div>
        </div>
    );
}
