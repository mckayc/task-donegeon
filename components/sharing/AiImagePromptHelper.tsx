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
        { name: 'Stable Diffusion Online', url: 'https://stablediffusionweb.com/' },
    ];

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-lg text-foreground">Free AI Image Generators</h4>
                <p className="text-sm text-muted-foreground">Use these free services to generate images for your assets. Create a prompt below, or use your own!</p>
                <div className="flex flex-wrap gap-3 mt-3">
                    {freeGenerators.map(site => (
                        <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer" className="bg-background hover:bg-accent text-accent-foreground font-semibold py-1 px-3 rounded-full text-sm transition-colors border">
                            {site.name} &rarr;
                        </a>
                    ))}
                </div>
            </div>
            
            <div className="pt-4 border-t border-border">
                <h4 className="font-bold text-lg text-foreground">Prompt Builder</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="prompt-subject">Subject</Label>
                        <Input id="prompt-subject" name="subject" value={promptData.subject} onChange={handleChange} placeholder="e.g., fantasy sword, cute dragon" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt-adjectives">Adjectives</Label>
                        <Input id="prompt-adjectives" name="adjectives" value={promptData.adjectives} onChange={handleChange} placeholder="e.g., glowing, ancient, tiny" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt-style">Style</Label>
                        <Select name="style" value={promptData.style} onValueChange={value => handleSelectChange('style', value)}>
                            <SelectTrigger id="prompt-style"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="digital painting">digital painting</SelectItem>
                                <SelectItem value="concept art">concept art</SelectItem>
                                <SelectItem value="photorealistic">photorealistic</SelectItem>
                                <SelectItem value="anime style">anime style</SelectItem>
                                <SelectItem value="cartoon">cartoon</SelectItem>
                                <SelectItem value="pixel art">pixel art</SelectItem>
                                <SelectItem value="low poly">low poly</SelectItem>
                                <SelectItem value="watercolor">watercolor</SelectItem>
                                <SelectItem value="oil painting">oil painting</SelectItem>
                                <SelectItem value="3d render">3d render</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt-artist">Artist / Platform Style</Label>
                         <Select name="artist" value={promptData.artist} onValueChange={value => handleSelectChange('artist', value)}>
                            <SelectTrigger id="prompt-artist"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="greg rutkowski">greg rutkowski</SelectItem>
                                <SelectItem value="artgerm">artgerm</SelectItem>
                                <SelectItem value="alphonse mucha">alphonse mucha</SelectItem>
                                <SelectItem value="artstation">artstation</SelectItem>
                                <SelectItem value="studio ghibli">studio ghibli</SelectItem>
                                <SelectItem value="disney pixar">disney pixar</SelectItem>
                                <SelectItem value="d&d rulebook">d&d rulebook</SelectItem>
                                <SelectItem value="unreal engine">unreal engine</SelectItem>
                                <SelectItem value="vray">vray</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="prompt-lighting">Lighting</Label>
                        <Select name="lighting" value={promptData.lighting} onValueChange={value => handleSelectChange('lighting', value)}>
                            <SelectTrigger id="prompt-lighting"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cinematic lighting">cinematic lighting</SelectItem>
                                <SelectItem value="dramatic lighting">dramatic lighting</SelectItem>
                                <SelectItem value="volumetric lighting">volumetric lighting</SelectItem>
                                <SelectItem value="studio lighting">studio lighting</SelectItem>
                                <SelectItem value="soft light">soft light</SelectItem>
                                <SelectItem value="god rays">god rays</SelectItem>
                                <SelectItem value="rim lighting">rim lighting</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="mt-4 p-3 bg-background rounded-md border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Generated Prompt</p>
                    <p className="text-foreground font-mono text-sm mt-1">{finalPrompt}</p>
                </div>
                 <div className="text-right mt-2">
                    <Button variant="secondary" onClick={copyToClipboard} size="sm">
                        {isCopied ? 'Copied!' : 'Copy Prompt'}
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default AiImagePromptHelper;