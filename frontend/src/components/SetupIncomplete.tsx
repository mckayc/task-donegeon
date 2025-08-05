
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const SetupIncomplete: React.FC = () => {
    const [generatedSecret, setGeneratedSecret] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const generateSecret = () => {
        const array = new Uint32Array(16);
        window.crypto.getRandomValues(array);
        const secret = Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
        setGeneratedSecret(secret);
        setIsCopied(false);
    };

    const copyToClipboard = () => {
        if (!generatedSecret) return;
        navigator.clipboard.writeText(generatedSecret).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        });
    };

    return (
        <Card className="w-full max-w-2xl animate-fade-in border-yellow-500/50">
            <div className="text-center mb-6">
                <h2 className="text-3xl text-yellow-400">Configuration Required</h2>
                <p className="text-stone-400 mt-2">
                    Welcome to Task Donegeon! Your application is not yet securely configured.
                </p>
            </div>
            <div className="space-y-6 text-stone-300">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-400">Step 1: Generate a Secret Key</h3>
                    <p className="text-sm">
                        Your app needs a secret key to sign authentication tokens. Click the button below to generate a cryptographically secure key.
                    </p>
                    <div className="flex items-center space-x-2 pt-2">
                        <Button onClick={generateSecret} className="w-auto flex-shrink-0">
                            Generate New Secret
                        </Button>
                        <Input 
                            type="text" 
                            value={generatedSecret} 
                            readOnly 
                            placeholder="A new secret will appear here..." 
                            className="bg-stone-900 font-mono text-sm"
                            aria-label="Generated JWT Secret"
                        />
                         <Button onClick={copyToClipboard} className="w-auto flex-shrink-0" disabled={!generatedSecret}>
                            {isCopied ? 'Copied!' : 'Copy'}
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-400">Step 2: Update Your Server Configuration</h3>
                    <p className="text-sm">
                        You now need to add this key to your server's environment file.
                    </p>
                    <ol className="list-decimal list-inside text-sm space-y-1 pl-2 text-stone-400">
                        <li>SSH into your server or access its file system.</li>
                        <li>Navigate to your Task Donegeon project directory.</li>
                        <li>Open the file located at: <code className="bg-stone-900/80 px-1 py-0.5 rounded text-yellow-300">backend/.env</code></li>
                        <li>Find the line for <code className="text-stone-100">JWT_SECRET</code> and paste your new key as its value.</li>
                    </ol>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-400">Step 3: Restart the Application</h3>
                    <p className="text-sm">
                        To apply the new secret, you must restart the application. If you are using Docker Compose, run these commands from your project's root directory:
                    </p>
                    <pre className="bg-stone-900/80 p-3 rounded-md text-sm text-yellow-300 overflow-x-auto">
                        <code>docker-compose down && docker-compose up --build -d</code>
                    </pre>
                </div>
                 <p className="text-center text-stone-400 pt-4">
                    Once restarted, please refresh this page.
                </p>
            </div>
        </Card>
    );
};
