import React, { useState, useEffect } from 'react';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import helpContent from '../../content/HelpGuide.md?raw';

// A simple function to replace terminology placeholders like {appName}
const applyTerminology = (text: string, terminology: any): string => {
    return text.replace(/\{(\w+)\}/g, (placeholder, key) => {
        return terminology[key] || placeholder;
    });
};

// A simple inline markdown parser to convert markdown text to JSX
const parseMarkdown = (text: string) => {
  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 pl-4 my-4">{currentListItems}</ul>);
      currentListItems = [];
    }
  };

  const parseInline = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|\_.*?\_|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if ((part.startsWith('_') && part.endsWith('_')) || (part.startsWith('*') && part.endsWith('*'))) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="bg-stone-700/50 text-amber-300 px-1.5 py-0.5 rounded-md font-mono text-sm">{part.slice(1, -1)}</code>;
        }
        return part;
    });
  };

  text.split('\n').forEach((line, index) => {
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={index} className="text-3xl font-bold text-accent mt-6 mb-4">{parseInline(line.substring(2))}</h1>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="text-2xl font-bold text-stone-100 mt-5 mb-3 border-b-2 border-stone-700/60 pb-2">{parseInline(line.substring(3))}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="text-xl font-bold text-stone-200 mt-4 mb-2">{parseInline(line.substring(4))}</h3>);
    } else if (line.trim() === '---') {
        flushList();
        elements.push(<hr key={index} className="border-stone-700/60 my-6" />);
    } else if (line.startsWith('- ')) {
      currentListItems.push(<li key={index}>{parseInline(line.substring(2))}</li>);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={index}>{parseInline(line)}</p>);
    }
  });

  flushList(); // Add any remaining list items
  return elements;
};


const HelpPage: React.FC = () => {
    const { settings } = useSystemState();
    const [content, setContent] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const processedContent = applyTerminology(helpContent, settings.terminology);
        const parsedContent = parseMarkdown(processedContent);
        setContent(parsedContent);
    }, [helpContent, settings.terminology]);


    return (
        <div className="max-w-4xl mx-auto">
            <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4">
                    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
                        {content}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default HelpPage;
