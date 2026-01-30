import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, TerminalWindow } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// A standalone code block component for direct use (not via ReactMarkdown)
export const DocCodeBlock = ({ language = 'text', children, className = '' }) => {
    const [isCopied, setIsCopied] = useState(false);
    const code = typeof children === 'string' ? children : String(children);

    const handleCopy = () => {
        navigator.clipboard.writeText(code.replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
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
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        borderRadius: 0,
                    }}
                >
                    {code.replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};
