

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthDispatch } from '../../context/AuthContext';
import { Role } from '../users/types';
import { SystemStatus } from '../../types/app';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';
import UserFormFields from '../users/UserFormFields';
import { CheckCircleIcon, XCircleIcon } from '../user-interface/Icons';
import ToggleSwitch from '../user-interface/ToggleSwitch';
import { logger } from '../../utils/logger';

const StatusCheck: React.FC<{
  title: string;
  isOk: boolean;
  isSkipped: boolean;
  onSkipToggle: () => void;
  children: React.ReactNode;
  skipLabel?: string;
}> = ({ title, isOk, isSkipped, onSkipToggle, children, skipLabel = "Skip" }) => {
  const isPassing = isOk || isSkipped;

  // By giving the details element a key that changes when it passes,
  // we force it to re-mount, which respects the new initial `open` state.
  // This is a clean way to control the collapse behavior without complex state/refs.
  const detailsKey = useMemo(() => isPassing, [isPassing]);

  return (
    <details key={`${title}-${detailsKey}`} className="p-4 bg-slate-900/50 rounded-lg border border-stone-700" open={!isPassing}>
      <summary className="flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-2">
          {isPassing ? (
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          ) : (
            <XCircleIcon className="w-6 h-6 text-red-500" />
          )}
          <span className={`font-semibold ${isPassing ? 'text-green-400' : 'text-red-400'}`}>{title}</span>
        </div>
        {!isOk && <ToggleSwitch enabled={isSkipped} setEnabled={onSkipToggle} label={skipLabel} />}
      </summary>
      <div className="mt-4 pl-8 text-stone-400 text-sm prose prose-invert max-w-none">
        {children}
      </div>
    </details>
  );
};

const FirstRunWizard: React.FC = () => {
  const { completeFirstRun } = useAuthDispatch();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [skip, setSkip] = useState({
    gemini: false,
    database: false,
    jwt: false,
  });

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: '', gameName: '', email: '',
    birthday: '', password: '', confirmPassword: '', pin: '', confirmPin: '',
    aboutMe: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        logger.log('[FirstRunWizard] Checking system status...');
        const response = await fetch('/api/system/status');
        if (!response.ok) throw new Error('Failed to fetch system status');
        const data: SystemStatus = await response.json();
        logger.log('[FirstRunWizard] System status fetched successfully', data);
        setStatus(data);
      } catch (err) {
        logger.error('[FirstRunWizard] Failed to fetch system status', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSkipToggle = (key: keyof typeof skip) => {
    logger.log(`[FirstRunWizard] Toggled skip for: ${key}`);
    setSkip(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logger.log('[FirstRunWizard] Attempting to create Donegeon Master account', { username: formData.username, email: formData.email });
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters long."); return; }
    if (formData.pin !== formData.confirmPin) { setError("PINs do not match."); return; }
    if (formData.pin.length < 4 || formData.pin.length > 10 || !/^\d+$/.test(formData.pin)) { setError('PIN must be 4-10 numbers.'); return; }
    setError('');

    const { confirmPassword, confirmPin, ...newUserPayload } = formData;
    completeFirstRun({ ...newUserPayload, role: Role.DonegeonMaster });
  };

  const allChecksPassed = status && (status.geminiConnected || skip.gemini) && (status.database.isCustomPath || skip.database) && (status.jwtSecretSet || skip.jwt);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-3xl w-full bg-slate-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="text leading-none">
            <span style={{fontSize: '300px'}}>🧙‍♂️</span>
          </div>
          <h1 className="font-medieval text-accent mt-2">First Run Wizard</h1>
          <p className="text-stone-300 mt-2 max-w-xl mx-auto">
            Welcome to Task Donegeon! This wizard will check your server setup and help you create the first administrator account.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {loading && <div className="text-center">Checking system status...</div>}
          {status && (
            <>
              <StatusCheck title="Gemini API Key" isOk={status.geminiConnected} isSkipped={skip.gemini} onSkipToggle={() => handleSkipToggle('gemini')}>
                {status.geminiConnected ? (
                  <p>Your Gemini API key is connected successfully. AI features are available!</p>
                ) : (
                  <>
                    <p>The Gemini API key is not configured correctly. AI features will be disabled.</p>
                    <p>To fix this, get a key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AI Studio</a> and set the <code>API_KEY</code> environment variable in your <code>.env</code> file or hosting provider's settings.</p>
                    <pre className="whitespace-pre-wrap break-all"><code>API_KEY="your-gemini-api-key-here"</code></pre>
                  </>
                )}
              </StatusCheck>
              <StatusCheck title="Persistent Data Storage" isOk={status.database.isCustomPath} isSkipped={skip.database} onSkipToggle={() => handleSkipToggle('database')} skipLabel="I've mapped a volume">
                <p>Your application data is currently stored in the default internal location. For your data (users, quests, images) to be safe and persist if the container is recreated, you must map a persistent volume from your host machine.</p>
                <p><strong>Recommended Setup (Docker):</strong></p>
                <p>Set the <code>APP_DATA_PATH</code> environment variable in your <code>docker-compose.yml</code> or Docker run command to map a local folder to the container's <code>/app/data</code> directory.</p>
                <pre className="whitespace-pre-wrap break-all"><code>
{`services:
  task-donegeon:
    # ...
    environment:
      - APP_DATA_PATH=./my-task-data
    volumes:
      - "\${APP_DATA_PATH:-./data}:/app/data"`}
                </code></pre>
                <p>If you've already done this, you can safely check the box above and continue.</p>
              </StatusCheck>
              <StatusCheck title="JWT Secret" isOk={status.jwtSecretSet} isSkipped={skip.jwt} onSkipToggle={() => handleSkipToggle('jwt')}>
                 {status.jwtSecretSet ? (
                  <p>A secure JWT secret has been set. User sessions are properly secured.</p>
                 ) : (
                  <>
                    <p>A secure secret for signing authentication tokens has not been set. Using the default is insecure.</p>
                    <p>To fix this, set the <code>JWT_SECRET</code> environment variable to a long, random, and secret string.</p>
                    <pre className="whitespace-pre-wrap break-all"><code>JWT_SECRET="your-long-random-secret-string"</code></pre>
                  </>
                 )}
              </StatusCheck>
            </>
          )}
        </div>

        {allChecksPassed && (
          <div className="mt-8 pt-8 border-t border-stone-700">
            <h2 className="text-3xl font-medieval text-center text-emerald-400 mb-6">Create Donegeon Master Account</h2>
            <form onSubmit={handleAdminSubmit} className="space-y-6">
              <div className="space-y-4">
                <UserFormFields formData={formData} handleChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                  <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="PIN (4-10 digits)" id="pin" name="pin" type="password" value={formData.pin} onChange={handleChange} required />
                  <Input label="Confirm PIN" id="confirmPin" name="confirmPin" type="password" value={formData.confirmPin} onChange={handleChange} required />
                </div>
              </div>
              {error && <p className="text-red-400 text-center">{error}</p>}
              <div className="pt-4 text-center">
                <Button type="submit" className="w-full md:w-auto">Create Account & Begin</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirstRunWizard;