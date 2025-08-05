
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download } from 'lucide-react';

const assetPacks = [
    {
        title: "Default Quest Pack",
        description: "A balanced set of starter quests covering chores, personal care, and learning. Perfect for getting started.",
        author: "Donegeon Masters",
        version: "1.0.0",
        items: "4 Quests, 4 Groups"
    },
    {
        title: "Advanced Adventurer Pack",
        description: "Challenging quests for older explorers, focusing on responsibility, long-term projects, and skill development.",
        author: "Community",
        version: "0.8.0",
        items: "15 Quests, 5 Groups (Coming Soon)"
    },
     {
        title: "Fantasy Item Pack",
        description: "A collection of magical items, potions, and scrolls for your donegeon's marketplace.",
        author: "Community",
        version: "0.5.0",
        items: "25 Market Items (Coming Soon)"
    }
];


const AssetLibraryPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-donegeon-gold mb-6" style={{ textShadow: '1px 1px 2px #000' }}>
        Asset Library
      </h1>
      <p className="mb-6 text-lg text-donegeon-text/80 max-w-3xl">
        Import pre-made asset packs to quickly populate your donegeon with new quests, items, and more.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assetPacks.map((pack, index) => (
          <Card key={pack.title} className="flex flex-col bg-donegeon-brown/80 hover:border-donegeon-gold transition-colors border border-donegeon-gray">
            <CardHeader>
              <CardTitle>{pack.title}</CardTitle>
               <p className="text-xs text-donegeon-text/60 pt-1">by {pack.author}</p>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <div>
                <p className="text-sm text-donegeon-text/90 font-sans">{pack.description}</p>
                <p className="text-sm text-donegeon-gold mt-4 font-semibold">{pack.items}</p>
              </div>
              <Button disabled={index !== 0} className="w-full mt-6">
                <Download className="mr-2 h-4 w-4" />
                {index === 0 ? 'Import Pack' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssetLibraryPage;
