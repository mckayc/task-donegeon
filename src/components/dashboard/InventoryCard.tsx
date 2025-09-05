import React from 'react';
import Card from '../user-interface/Card';
import { RewardTypeDefinition } from '../items/types';
import { Terminology } from '../../types/app';
import { useRewardValue } from '../../hooks/useRewardValue';

type Currency = RewardTypeDefinition & { amount: number };
type Experience = RewardTypeDefinition & { amount: number };

interface InventoryCardProps {
    userCurrencies: Currency[];
    userExperience: Experience[];
    terminology: Terminology;
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    dragHandleProps?: any;
}

const CurrencyDisplay: React.FC<{currency: Currency}> = ({ currency }) => {
    const realValue = useRewardValue(currency.amount, currency.id);
    const title = `${currency.name}: ${currency.amount}${realValue ? ` (${realValue})` : ''}`;

    return (
        <div title={title} className="flex items-baseline justify-between">
            <span className="text-stone-200 flex items-center gap-2">
                <span>{currency.icon}</span>
                <span>{currency.name}</span>
            </span>
            <span className="font-semibold text-accent-light">{currency.amount}</span>
        </div>
    );
}

const InventoryCard: React.FC<InventoryCardProps> = ({ userCurrencies, userExperience, terminology, ...cardProps }) => {
    return (
        <Card title="Inventory" {...cardProps}>
            <div className="grid grid-cols-2 gap-x-6">
                <div>
                    <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1 capitalize">{terminology.currency}</h4>
                    <div className="space-y-2 mt-2">
                        {userCurrencies.length > 0 ? userCurrencies.map(c => 
                            <CurrencyDisplay key={c.id} currency={c} />
                        ) : <p className="text-stone-400 text-sm italic">None</p>}
                    </div>
                </div>
                 <div>
                    <h4 className="font-bold text-lg text-stone-300 mb-2 border-b border-stone-700 pb-1 capitalize">{terminology.xp}</h4>
                    <div className="space-y-2 mt-2">
                        {userExperience.length > 0 ? userExperience.map(xp => 
                            <div key={xp.id} className="flex items-baseline justify-between">
                                <span className="text-stone-200 flex items-center gap-2">
                                    <span>{xp.icon}</span>
                                    <span>{xp.name}</span>
                                </span>
                                <span className="font-semibold text-sky-400">{xp.amount}</span>
                            </div>
                        ) : <p className="text-stone-400 text-sm italic">None</p>}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default InventoryCard;
