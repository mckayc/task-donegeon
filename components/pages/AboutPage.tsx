import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useAppState } from '../../context/AppContext';

interface Metadata {
    name: string;
    version: string;
    description: string;
}

const AboutPage: React.FC = () => {
    const { settings } = useAppState();
    const [metadata, setMetadata] = useState<Metadata | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/metadata.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Could not fetch metadata');
                }
                return res.json();
            })
            .then(data => setMetadata(data))
            .catch(err => {
                console.error("Failed to load metadata.json", err);
                setError("Could not load application details.");
            });
    }, []);

    const GITHUB_URL = 'https://github.com/mckayc/task-donegeon';

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-medieval text-stone-100 mb-8">About {settings.terminology.appName}</h1>
            <Card>
                {error && <p className="text-red-400">{error}</p>}
                {metadata ? (
                    <div className="space-y-6 text-stone-300 leading-relaxed">
                        <p>{metadata.description}</p>
                        
                        <div className="pt-4 border-t border-stone-700/60">
                            <p><strong>Version:</strong> {metadata.version}</p>
                        </div>

                        <div className="pt-4 border-t border-stone-700/60">
                            <h3 className="text-lg font-semibold text-stone-100 mb-2">Contribute or Report Issues</h3>
                            <p>
                                This project is open source. You can view the code, suggest features, or report bugs on our GitHub repository.
                            </p>
                            <a 
                                href={GITHUB_URL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block mt-3 text-emerald-400 hover:text-emerald-300 font-bold underline"
                            >
                                Visit GitHub Repository &rarr;
                            </a>
                        </div>
                    </div>
                ) : (
                    !error && <p>Loading application details...</p>
                )}
            </Card>
        </div>
    );
};

export default AboutPage;
