import React, { useState, useMemo } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import Button from '../ui/Button';
import Input from '../ui/Input';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setPromptData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

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
                <h4 className="font-bold text-lg text-stone-200">Free AI Image Generators</h4>
                <p className="text-sm text-stone-400">Use these free services to generate images for your assets. Create a prompt below, or use your own!</p>
                <div className="flex flex-wrap gap-3 mt-3">
                    {freeGenerators.map(site => (
                        <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer" className="bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold py-1 px-3 rounded-full text-sm transition-colors">
                            {site.name} &rarr;
                        </a>
                    ))}
                </div>
            </div>
            
            <div className="pt-4 border-t border-stone-700/60">
                <h4 className="font-bold text-lg text-stone-200">Prompt Builder</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Input label="Subject" name="subject" value={promptData.subject} onChange={handleChange} placeholder="e.g., fantasy sword, cute dragon" />
                    <Input label="Adjectives" name="adjectives" value={promptData.adjectives} onChange={handleChange} placeholder="e.g., glowing, ancient, tiny" />
                    <Input as="select" label="Style" name="style" value={promptData.style} onChange={handleChange}>
                        <option>digital painting</option>
                        <option>concept art</option>
                        <option>photorealistic</option>
                        <option>anime style</option>
                        <option>cartoon</option>
                        <option>pixel art</option>
                        <option>low poly</option>
                        <option>watercolor</option>
                        <option>oil painting</option>
                        <option>3d render</option>
                    </Input>
                    <Input as="select" label="Artist / Platform Style" name="artist" value={promptData.artist} onChange={handleChange}>
                        <option>greg rutkowski</option>
                        <option>artgerm</option>
                        <option>alphonse mucha</option>
                        <option>artstation</option>
                        <option>studio ghibli</option>
                        <option>disney pixar</option>
                        <option>d&d rulebook</option>
                        <option>unreal engine</option>
                        <option>vray</option>
                    </Input>
                    <Input as="select" label="Lighting" name="lighting" value={promptData.lighting} onChange={handleChange}>
                        <option>cinematic lighting</option>
                        <option>dramatic lighting</option>
                        <option>volumetric lighting</option>
                        <option>studio lighting</option>
                        <option>soft light</option>
                        <option>god rays</option>
                        <option>rim lighting</option>
                    </Input>
                </div>
                 <div className="mt-4 p-3 bg-stone-900/50 rounded-md">
                    <p className="text-xs font-semibold text-stone-400 uppercase">Generated Prompt</p>
                    <p className="text-stone-200 font-mono text-sm mt-1">{finalPrompt}</p>
                </div>
                 <div className="text-right mt-2">
                    <Button variant="secondary" onClick={copyToClipboard} className="text-xs py-1 px-3">
                        {isCopied ? 'Copied!' : 'Copy Prompt'}
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default AiImagePromptHelper;