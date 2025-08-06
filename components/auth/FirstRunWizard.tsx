import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../context/AppContext';
import { Role, SystemStatus } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import UserFormFields from '../users/UserFormFields';
import { CheckCircleIcon, XCircleIcon } from '../ui/Icons';
import ToggleSwitch from '../ui/ToggleSwitch';

const StatusCheck: React.FC<{
  title: string;
  isOk: boolean;
  isSkipped: boolean;
  onSkipToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOk, isSkipped, onSkipToggle, children }) => {
  const isPassing = isOk || isSkipped;
  return (
    <details className="p-4 bg-stone-900/50 rounded-lg border border-stone-700" open={!isOk}>
      <summary className="flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-2">
          {isPassing ? (
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          ) : (
            <XCircleIcon className="w-6 h-6 text-red-500" />
          )}
          <span className={`font-semibold ${isPassing ? 'text-green-400' : 'text-red-400'}`}>{title}</span>
        </div>
        {!isOk && <ToggleSwitch enabled={isSkipped} setEnabled={onSkipToggle} label="Skip" />}
      </summary>
      {!isOk && (
        <div className="mt-4 pl-8 text-stone-400 text-sm prose prose-invert max-w-none">
          {children}
        </div>
      )}
    </details>
  );
};

const FirstRunWizard: React.FC = () => {
  const { completeFirstRun } = useAppDispatch();
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
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/system/status');
        if (!response.ok) throw new Error('Failed to fetch system status');
        const data: SystemStatus = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSkipToggle = (key: keyof typeof skip) => {
    setSkip(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen flex items-center justify-center bg-stone-900 p-4">
      <div className="max-w-3xl w-full bg-stone-800 border border-stone-700 rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <span className="text-8xl">🧙‍♂️</span>
          <h1 className="font-medieval text-accent mt-4">First Run Wizard</h1>
          <p className="text-stone-300 mt-2 max-w-xl mx-auto">
            Welcome to Task Donegeon! This wizard will check your server setup and help you create the first administrator account.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {loading && <div className="text-center">Checking system status...</div>}
          {status && (
            <>
              <StatusCheck title="Gemini API Key" isOk={status.geminiConnected} isSkipped={skip.gemini} onSkipToggle={() => handleSkipToggle('gemini')}>
                <p>The Gemini API key is not configured correctly. AI features will be disabled.</p>
                <p>To fix this, set the <code>API_KEY</code> environment variable in your <code>.env</code> file or hosting provider's settings.</p>
                <pre><code>API_KEY="your-gemini-api-key-here"</code></pre>
              </StatusCheck>
              <StatusCheck title="Custom Database Location" isOk={status.database.isCustomPath} isSkipped={skip.database} onSkipToggle={() => handleSkipToggle('database')}>
                <p>The database is using the default internal location. This is not recommended for production as data may not persist if the container is recreated without a mapped volume.</p>
                <p>To fix this, set the <code>DATABASE_PATH</code> environment variable to a persistent location, like a mapped volume in Docker.</p>
                <pre><code>DATABASE_PATH="/app/data/database/main.sqlite"</code></pre>
              </StatusCheck>
              <StatusCheck title="JWT Secret" isOk={status.jwtSecretSet} isSkipped={skip.jwt} onSkipToggle={() => handleSkipToggle('jwt')}>
                <p>A secure secret for signing authentication tokens has not been set. Using the default is insecure.</p>
                <p>To fix this, set the <code>JWT_SECRET</code> environment variable to a long, random, and secret string.</p>
                <pre><code>JWT_SECRET="your-long-random-secret-string"</code></pre>
              </StatusCheck>
            </>
          )}
        </div>

        {allChecksPassed && (
          <div className="mt-8 pt-8 border-t border-stone-700">
            <h2 className="text-2xl font-medieval text-center text-emerald-400 mb-6">Create Donegeon Master Account</h2>
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
                <Button type="submit" className="w-full md:w-auto">Create My Account</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirstRunWizard;
