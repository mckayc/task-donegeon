import React, { useState, useEffect } from 'react';
import Card from '../user-interface/Card';
import { useSystemState } from '../../context/SystemContext';
import helpContent from '../../content/HelpGuide.md?raw';
import CollapsibleSection from '../user-interface/CollapsibleSection';

// A simple function to replace terminology placeholders like {appName}
const applyTerminology = (text: string, terminology: any): string => {
    return text.replace(/\{(\w+)\}/g, (placeholder, key) => {
        return terminology[key] || placeholder;
    });
};

// A function to create a URL-friendly slug from a string.
const createSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');

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
      const title = line.substring(2);
      elements.push(<h1 key={index} id={createSlug(title)} className="text-3xl font-bold text-accent mt-6 mb-4">{parseInline(title)}</h1>);
    } else if (line.startsWith('## ')) {
      flushList();
      const title = line.substring(3);
      elements.push(<h2 key={index} id={createSlug(title)} className="text-2xl font-bold text-stone-100 mt-5 mb-3 border-b-2 border-stone-700/60 pb-2">{parseInline(title)}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      const title = line.substring(4);
      elements.push(<h3 key={index} id={createSlug(title)} className="text-xl font-bold text-stone-200 mt-4 mb-2">{parseInline(title)}</h3>);
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

interface Section {
    title: string;
    slug: string;
    content: React.ReactNode[];
}

interface TocEntry {
    title: string;
    slug: string;
}

const HelpPage: React.FC = () => {
    const { settings } = useSystemState();
    const [sections, setSections] = useState<Section[]>([]);
    const [toc, setToc] = useState<TocEntry[]>([]);
    const [intro, setIntro] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const processedContent = applyTerminology(helpContent, settings.terminology);
        const rawSections = processedContent.split('\n## ');

        const introContent = parseMarkdown(rawSections.shift() || '');
        setIntro(introContent);

        const newSections: Section[] = [];
        const newToc: TocEntry[] = [];

        rawSections.forEach((sectionText, index) => {
            const lines = sectionText.split('\n');
            const title = lines.shift()?.trim() || `Section ${index + 1}`;
            const content = lines.join('\n');
            const slug = createSlug(title);

            if (title.toLowerCase() !== 'table of contents') {
                newToc.push({ title, slug });
            }

            newSections.push({
                title,
                slug,
                content: parseMarkdown(content),
            });
        });

        setSections(newSections);
        setToc(newToc);
    }, [helpContent, settings.terminology]);

    const handleTocClick = (slug: string) => {
        document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth' });
    };

    const TocComponent = (
        <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
            <ul className="list-none p-0 space-y-2">
                {toc.map(item => (
                    <li key={item.slug}>
                        <a 
                            href={`#${item.slug}`} 
                            onClick={(e) => { e.preventDefault(); handleTocClick(item.slug); }}
                            className="text-accent hover:underline text-base"
                        >
                            {item.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4">
                    <div className="prose prose-invert max-w-none text-stone-300 space-y-4">
                        {intro}
                    </div>
                </div>

                {sections.map((section, index) => (
                    <CollapsibleSection
                        key={section.slug}
                        id={section.slug}
                        title={section.title}
                        defaultOpen={index < 2} // Open "TOC" and "The Basics" by default
                    >
                        <div className="px-6 prose prose-invert max-w-none text-stone-300 space-y-4">
                            {section.title.toLowerCase() === 'table of contents' ? TocComponent : section.content}
                        </div>
                    </CollapsibleSection>
                ))}
            </Card>
        </div>
    );
};

export default HelpPage;