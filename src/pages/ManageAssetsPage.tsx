

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoaderCircle, ShieldAlert, PlusCircle, Pencil, Trash2, Download, Upload } from 'lucide-react';
import { Quest, QuestGroup } from '../types';

const DataManagementCard = () => (
    <Card className="bg-donegeon-brown/80 mt-6">
        <CardHeader>
            <CardTitle className="text-xl">Data Management</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="mb-4 text-sm text-donegeon-text/80">Backup your custom assets or import them from a file.</p>
            <div className="flex gap-4">
                <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" />Backup Assets</Button>
                <Button variant="outline" disabled><Upload className="mr-2 h-4 w-4" />Import from File</Button>
            </div>
        </CardContent>
    </Card>
);

const QuestList: React.FC = () => {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/quests')
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch quests'))
            .then(data => setQuests(data))
            .catch(err => setError(err.toString()))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center items-center p-8"><LoaderCircle className="h-8 w-8 animate-spin text-donegeon-accent" /></div>;
    if (error) return (
        <div className="text-donegeon-red p-4 flex flex-col items-center text-center">
            <ShieldAlert className="h-8 w-8 mb-2" />
            <p className="font-semibold">Failed to load quests</p>
            <p className="text-sm">{error}</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {quests.map(quest => (
                <div key={quest.id} className="p-3 rounded-lg bg-donegeon-gray-dark/50 border border-donegeon-gray flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-donegeon-text flex items-center gap-2">
                            {quest.emoji} {quest.title}
                        </p>
                        <p className="text-xs text-donegeon-text/60 font-sans">Group: {quest.questGroup?.title || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" disabled><Pencil className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const QuestGroupList: React.FC = () => {
    const [groups, setGroups] = useState<QuestGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        fetch('/api/quest-groups')
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch quest groups'))
            .then(data => setGroups(data))
            .catch(err => setError(err.toString()))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex justify-center items-center p-8"><LoaderCircle className="h-8 w-8 animate-spin text-donegeon-accent" /></div>;
    if (error) return (
        <div className="text-donegeon-red p-4 flex flex-col items-center text-center">
            <ShieldAlert className="h-8 w-8 mb-2" />
            <p className="font-semibold">Failed to load quest groups</p>
            <p className="text-sm">{error}</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {groups.map(group => (
                <div key={group.id} className="p-3 rounded-lg bg-donegeon-gray-dark/50 border border-donegeon-gray flex justify-between items-center">
                    <p className="font-semibold text-donegeon-text flex items-center gap-2">
                        {group.emoji} {group.title}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" disabled><Pencil className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ManageAssetsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('quests');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-donegeon-accent mb-6" style={{ textShadow: '1px 1px 2px #000' }}>
                Manage Assets
            </h1>

            <Card className="bg-donegeon-brown/80">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 border border-donegeon-gray rounded-lg p-1">
                           <Button size="sm" variant={activeTab === 'quests' ? 'default' : 'ghost'} onClick={() => setActiveTab('quests')}>Quests</Button>
                           <Button size="sm" variant={activeTab === 'groups' ? 'default' : 'ghost'} onClick={() => setActiveTab('groups')}>Quest Groups</Button>
                        </div>
                        <Button disabled><PlusCircle className="mr-2 h-4 w-4" />Create New</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {activeTab === 'quests' ? <QuestList /> : <QuestGroupList />}
                </CardContent>
            </Card>

            <DataManagementCard />
        </div>
    );
};

export default ManageAssetsPage;