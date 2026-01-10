import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, TerminalWindow } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (inline) {
        return (
            <code className={`${className} bg-slate-100 text-pink-600 rounded px-1.5 py-0.5 text-sm font-mono border border-slate-200`} {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="relative my-4 rounded-xl overflow-hidden shadow-md border border-slate-700/50 group">
            <div className="flex items-center justify-between bg-slate-900 border-b border-white/10 px-4 py-2">
                <div className="flex items-center gap-2 text-slate-400">
                    <TerminalWindow size={16} />
                    <span className="text-xs font-mono lowercase">{language}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </Button>
            </div>
            <div className="relative bg-[#282c34]">
                <SyntaxHighlighter
                    style={oneDark}
                    language={language}
                    PreTag="div"
                    customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        background: 'transparent',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        borderRadius: 0,
                    }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};
