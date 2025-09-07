import React from 'react';
import { Minigame } from '../../../types';
import Button from '../user-interface/Button';

interface GameRulesDialogProps {
  game: Minigame;
  onClose: () => void;
}

const RulesContent: React.FC<{ gameId: string }> = ({ gameId }) => {
    const commonClasses = "prose prose-invert prose-sm max-w-none text-stone-300";

    switch(gameId) {
        case 'minigame-snake':
            return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Grow your snake as long as possible by eating the food that appears on the screen.</p>
                    <h4>How to Play</h4>
                    <ul>
                        <li>Use the arrow keys or on-screen D-pad to control the snake's direction.</li>
                        <li>Guide the snake to the red food squares. Each one you eat makes your snake longer and increases your score.</li>
                        <li>The game ends if the snake runs into the outer walls or its own body.</li>
                    </ul>
                    <h4>Tips</h4>
                    <p>Plan your turns ahead of time, especially as your snake gets longer. Try to keep your snake in open areas to avoid getting trapped.</p>
                </div>
            );
        case 'minigame-dragons-dice':
             return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Score as many points as possible over 5 rounds.</p>
                    <h4>How to Play</h4>
                    <ol>
                        <li>On your turn, you roll all six dice. You must select at least one scoring die or combination.</li>
                        <li>After selecting your dice, you can either **Bank** your current turn's score and end your round, or **Roll Again** with the remaining dice.</li>
                        <li>If you roll and none of the new dice can score, you **BUST**! You lose all points accumulated during that turn.</li>
                        <li>If you score with all six dice in one or more rolls (called "Hot Dice"), you can roll all six dice again and continue your turn.</li>
                    </ol>
                    <h4>Scoring</h4>
                     <ul className="list-disc list-inside space-y-1">
                        <li>Single 1: <strong>100</strong> points</li>
                        <li>Single 5: <strong>50</strong> points</li>
                        <li>Three 1s: <strong>1000</strong> | Three 2s: <strong>200</strong> | Three 3s: <strong>300</strong> | etc.</li>
                        <li>4-of-a-kind: <strong>Double</strong> the 3-of-a-kind score</li>
                        <li>1-6 Straight: <strong>1500</strong> points</li>
                        <li>Three Pairs: <strong>1500</strong> points</li>
                    </ul>
                </div>
            );
        case 'minigame-rune-breaker':
             return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Clear all the runes from the screen by hitting them with the orb.</p>
                    <h4>How to Play</h4>
                    <ul>
                        <li>Move your mouse or finger left and right to control the paddle at the bottom of the screen.</li>
                        <li>Keep the orb in play by bouncing it off your paddle.</li>
                        <li>If the orb falls past your paddle, you lose a life.</li>
                        <li>Break runes for points. Clear all runes to advance to the next level.</li>
                        <li>Occasionally, a power-up will fall. Catch it with your paddle to activate it!</li>
                    </ul>
                </div>
            );
        case 'minigame-dungeon-dash':
             return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Run as far as you can through the dungeon without hitting any spikes.</p>
                    <h4>How to Play</h4>
                    <ul>
                        <li>Your character runs automatically.</li>
                        <li>Click, tap, or press the Spacebar to make your character jump.</li>
                        <li>Time your jumps carefully to clear the spike obstacles.</li>
                        <li>The game gets faster the longer you survive!</li>
                    </ul>
                </div>
            );
        case 'minigame-forge-master':
             return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Score as many points as you can by striking the metal at the perfect moment.</p>
                    <h4>How to Play</h4>
                    <ul>
                        <li>A speed indicator will move back and forth across the forge bar.</li>
                        <li>Click, tap, or press the Spacebar to strike.</li>
                        <li>Hitting inside the larger "Good" zone scores points.</li>
                        <li>Hitting inside the smaller "Perfect" zone scores more points and builds your combo.</li>
                        <li>Consecutive "Perfect" strikes increase your combo multiplier for huge bonus points!</li>
                        <li>You have a limited number of strikes (misses).</li>
                    </ul>
                </div>
            );
        case 'minigame-archers-folly':
             return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Hit as many targets as you can before you run out of arrows.</p>
                    <h4>How to Play</h4>
                    <ul>
                        <li>Click and drag your mouse to aim the bow. A white line will show the predicted path of your arrow.</li>
                        <li>The farther you pull back, the more power your shot will have, which is shown in the power meter.</li>
                        <li>Release the mouse button to fire.</li>
                        <li>Hitting a target awards points and gives you an extra arrow.</li>
                        <li>Targets will get smaller and faster as your score increases.</li>
                    </ul>
                </div>
            );
        case 'minigame-tetris':
             return (
                <div className={commonClasses}>
                    <h4>Objective</h4>
                    <p>Rotate and drop falling blocks (Tetriminos) to create solid horizontal lines without any gaps.</p>
                    <h4>How to Play</h4>
                    <ul>
                        <li><strong>Move:</strong> Use the Left/Right arrow keys or on-screen buttons.</li>
                        <li><strong>Rotate:</strong> Use the Up arrow key or Rotate button.</li>
                        <li><strong>Soft Drop:</strong> Use the Down arrow key or button to speed up the piece's descent.</li>
                        <li><strong>Hard Drop:</strong> Press the Spacebar or Hard Drop button to instantly drop the piece to the bottom.</li>
                        <li>When you complete a line, it disappears, and you score points. The blocks above will fall to fill the space.</li>
                        <li>The game ends if the blocks stack up to the top of the screen.</li>
                    </ul>
                    <h4>Scoring</h4>
                     <ul className="list-disc list-inside space-y-1">
                        <li>1 Line (Single): <strong>100</strong> points x (level + 1)</li>
                        <li>2 Lines (Double): <strong>300</strong> points x (level + 1)</li>
                        <li>3 Lines (Triple): <strong>500</strong> points x (level + 1)</li>
                        <li>4 Lines (Tetris): <strong>800</strong> points x (level + 1)</li>
                    </ul>
                </div>
            );
        default:
            return <p>No rules available for this game.</p>;
    }
}

const GameRulesDialog: React.FC<GameRulesDialogProps> = ({ game, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-stone-700/60">
            <h2 className="text-3xl font-medieval text-emerald-400 flex items-center gap-3">
                {game.icon} Rules for "{game.name}"
            </h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
            <p className="text-stone-400 mb-4">{game.description}</p>
            <RulesContent gameId={game.id} />
        </div>
        <div className="flex justify-end space-x-4 p-4 mt-auto border-t border-stone-700/60">
          <Button type="button" onClick={onClose}>Got It</Button>
        </div>
      </div>
    </div>
  );
};

export default GameRulesDialog;
