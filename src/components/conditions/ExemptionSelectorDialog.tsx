import React, { useState, useMemo } from 'react';
import { Quest, Market, QuestGroup } from '../../types';
import { useQuestsState } from '../../context/QuestsContext';
import { useEconomyState } from '../../context/EconomyContext';
import Button from '../user-interface/Button';
import Input from '../user-interface/Input';

interface ExemptionSelectorDialogProps {
  initialQuestIds: string[];
  initialMarketIds: string[];
  initialQuestGroupIds: string[];
  onSave: (questIds: string[], marketIds: string[], questGroupIds: string[]) => void;
  onClose: () => void;
}

const ExemptionSelectorDialog: React.FC<ExemptionSelectorDialogProps> = ({ initialQuestIds, initialMarketIds, initialQuestGroupIds, onSave, onClose }) => {
    const { quests, questGroups } = useQuestsState();
    const { markets } = useEconomyState();

    const [selectedQuestIds, setSelectedQuestIds] = useState(new Set(initialQuestIds));
    const [selectedMarketIds, setSelectedMarketIds] = useState(new Set(initialMarketIds));
    const [selectedQuestGroupIds, setSelectedQuestGroupIds] = useState(new Set(initialQuestGroupIds));
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQuests = useMemo(() => quests.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase())), [quests, searchTerm]);
    const filteredMarkets = useMemo(() => markets.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase())), [markets, searchTerm]);
    const filteredQuestGroups = useMemo(() => questGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())), [questGroups, searchTerm]);

    const handleToggleQuest = (id: string) => {
        const newSet = new Set(selectedQuestIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedQuestIds(newSet);
    };

    const handleToggleMarket = (id: string) => {
        const newSet = new Set(selectedMarketIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedMarketIds(newSet);
    };
    
    const handleToggleQuestGroup = (id: string) => {
        const newSet = new Set(selectedQuestGroupIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedQuestGroupIds(newSet);
    };

    const handleSave = () => {
        onSave(Array.from(selectedQuestIds), Array.from(selectedMarketIds), Array.from(selectedQuestGroupIds));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-stone-700/60 flex-shrink-0">
                    <h2 className="text-2xl font-medieval text-emerald-400">Select Exemptions</h2>
                    <Input placeholder="Search assets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-4"/>
                </div>

                <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
                    <div>
                        <h3 className="font-semibold text-stone-200 mb-2">Quests</h3>
                        <div className="space-y-2 max-h-full overflow-y-auto pr-2">
                            {filteredQuests.map(quest => (
                                <label key={quest.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedQuestIds.has(quest.id)} onChange={() => handleToggleQuest(quest.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"/>
                                    <span>{quest.icon} {quest.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-stone-200 mb-2">Markets</h3>
                         <div className="space-y-2 max-h-full overflow-y-auto pr-2">
                            {filteredMarkets.map(market => (
                                <label key={market.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedMarketIds.has(market.id)} onChange={() => handleToggleMarket(market.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"/>
                                    <span>{market.icon} {market.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-stone-200 mb-2">Quest Groups</h3>
                         <div className="space-y-2 max-h-full overflow-y-auto pr-2">
                            {filteredQuestGroups.map(group => (
                                <label key={group.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-stone-700 cursor-pointer">
                                    <input type="checkbox" checked={selectedQuestGroupIds.has(group.id)} onChange={() => handleToggleQuestGroup(group.id)} className="h-4 w-4 rounded text-emerald-600 bg-stone-700 border-stone-500"/>
                                    <span>{group.icon} {group.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-stone-700/60 mt-auto flex justify-end space-x-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSave}>Save Selections</Button>
                </div>
            </div>
        </div>
    );
};

export default ExemptionSelectorDialog;