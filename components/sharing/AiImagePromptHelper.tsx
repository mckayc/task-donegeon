import React, { useState, useMemo } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const AiImagePromptHelper: React.FC = () => {
    const { addNotification } = useAppDispatch();
    const [isCopied, setIsCopied] = useState(false);
    const [promptData, setPromptData] = useState({
        subject: '',
        style: 'digital painting',
        adjectives: '',
        artist: 'greg rutkowski',
        lighting: 'cinematic lighting',
    });

    const finalPrompt = useMemo(() => {
        return [
            promptData.subject,
            promptData.adjectives,
            promptData.style,
            `by ${promptData.artist}`,
            promptData.lighting,
        ].filter(Boolean).join(', ');
    }, [promptData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPromptData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setPromptData(prev => ({ ...prev, [name]: value }));
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalPrompt).then(() => {
            addNotification({ type: 'success', message: 'Prompt copied to clipboard!' });
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }, () => {
            addNotification({ type: 'error', message: 'Failed to copy prompt.'});
        });
    };
    
    const freeGenerators = [
        { name: 'Perchance AI Generator', url: 'https://perchance.org/ai-text-to-image-generator' },
        { name: 'Mage.space', url: 'https://www.mage.space/' },
        { name: 'Leonardo.Ai', url: 'https://leonardo.ai/' },
    ];

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Use this tool to build a detailed prompt for external AI image generators, then upload the result.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" placeholder="e.g., 'a knight in shining armor'" value={promptData.subject} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adjectives">Adjectives</Label>
                    <Input id="adjectives" name="adjectives" placeholder="e.g., 'epic, detailed, glowing'" value={promptData.adjectives} onChange={handleChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="style">Art Style</Label>
                    <Input id="style" name="style" placeholder="e.g., 'digital painting', 'anime'" value={promptData.style} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="artist">In the style of...</Label>
                    <Input id="artist" name="artist" placeholder="e.g., 'greg rutkowski'" value={promptData.artist} onChange={handleChange} />
                </div>
            </div>
             <div className="p-4 bg-background rounded-md border">
                <Label>Generated Prompt</Label>
                <p className="text-foreground font-mono text-sm mt-1">{finalPrompt}</p>
            </div>
            <div className="flex items-center gap-4">
                <Button onClick={copyToClipboard} disabled={!promptData.subject}>
                    {isCopied ? 'Copied!' : 'Copy Prompt'}
                </Button>
                <Select>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Go to Generator..." />
                    </SelectTrigger>
                    <SelectContent>
                        {freeGenerators.map(gen => (
                            <SelectItem key={gen.name} value={gen.name} onSelect={() => window.open(gen.url, '_blank')}>
                                {gen.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

export default AiImagePromptHelper;