import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Guild } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditGuildDialogProps {
  guild: Guild | null;
  onClose: () => void;
}

const EditGuildDialog: React.FC<EditGuildDialogProps> = ({ guild, onClose }) => {
  const { users } = useAppState();
  const { addGuild, updateGuild } = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    memberIds: [] as string[],
  });

  useEffect(() => {
    if (guild) {
      setFormData({ 
          name: guild.name, 
          purpose: guild.purpose,
          memberIds: [...guild.memberIds] 
      });
    }
  }, [guild]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleMemberChange = (userId: string) => {
    setFormData(prev => {
        const newMemberIds = [...prev.memberIds];
        const index = newMemberIds.indexOf(userId);
        if (index > -1) {
            newMemberIds.splice(index, 1);
        } else {
            newMemberIds.push(userId);
        }
        return { ...prev, memberIds: newMemberIds };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guild) {
      updateGuild({ ...guild, ...formData });
    } else {
      addGuild(formData);
    }
    onClose();
  };

  const dialogTitle = guild ? 'Edit Guild' : 'Create New Guild';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-medieval text-emerald-400 mb-6">{dialogTitle}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Guild Name" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-stone-300 mb-1">
              Purpose
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={3}
              value={formData.purpose}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-stone-700 border border-stone-600 rounded-md"
              placeholder="What is the goal of this guild?"
            />
          </div>
          
           <div className="p-4 bg-stone-900/50 rounded-lg">
            <h3 className="font-semibold text-stone-200 mb-3">Guild Members</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map(user => (
                    <div key={user.id} className="flex items-center">
                        <input type="checkbox" id={`guild-member-${user.id}`} name={`guild-member-${user.id}`} checked={formData.memberIds.includes(user.id)} onChange={() => handleMemberChange(user.id)} className="h-4 w-4 text-emerald-600 bg-stone-700 border-stone-500 rounded focus:ring-emerald-500" />
                        <label htmlFor={`guild-member-${user.id}`} className="ml-3 text-stone-300">{user.gameName} ({user.role})</label>
                    </div>
                ))}
            </div>
          </div>


          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{guild ? 'Save Changes' : 'Create Guild'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGuildDialog;
