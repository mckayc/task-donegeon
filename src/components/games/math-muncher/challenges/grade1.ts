import { MathChallenge, CellValue } from "../types";
import { generateChallengeGrid, getRandomInt } from "../helpers";

// Helper for robust expression evaluation
const safeEval = (expr: string): number | null => {
    try {
        if (/[^0-9+\-*/.() ]/.test(expr)) return null;
        return new Function(`return ${expr}`)();
    } catch { return null; }
};

export const challenges: MathChallenge[] = [
    { title: 'Munch the Even Numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,10)*2, () => getRandomInt(0,9)*2+1, (n) => typeof n === 'number' && n % 2 === 0) },
    { title: 'Munch the Odd Numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(0,9)*2+1, () => getRandomInt(1,10)*2, (n) => typeof n === 'number' && n % 2 !== 0) },
    { title: 'Munch numbers GREATER than 5', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(6,12), () => getRandomInt(1,5), (n) => typeof n === 'number' && n > 5) },
    { title: 'Munch numbers LESS than 8', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,7), () => getRandomInt(8,15), (n) => typeof n === 'number' && n < 8) },
    { title: 'Munch sums that equal 7', gridSize: 6, generateGrid: () => generateChallengeGrid(() => { const a = getRandomInt(0,7); return `${a}+${7-a}`;}, () => { const a = getRandomInt(0,10); const b = getRandomInt(0,10); return a+b === 7 ? `${a}+${b+1}`: `${a}+${b}`}, (v) => safeEval(String(v)) === 7)},
    { title: 'Munch differences that equal 4', gridSize: 6, generateGrid: () => generateChallengeGrid(() => { const a = getRandomInt(4,10); return `${a}-${a-4}`;}, () => {const a = getRandomInt(5,10); const b = getRandomInt(0,10); return a-b === 4 ? `${a}-${b+1}` : `${a}-${b}`;}, (v) => safeEval(String(v)) === 4)},
    { title: 'Munch numbers when counting by 5s', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,10)*5, () => { let n; do { n = getRandomInt(1,50); } while (n % 5 === 0); return n; }, (n) => typeof n === 'number' && n > 0 && n % 5 === 0) },
    { title: 'Munch pairs that make 10', gridSize: 6, generateGrid: () => generateChallengeGrid(() => { const a = getRandomInt(0,10); return `${a}+${10-a}`;}, () => { const a = getRandomInt(0,10); const b = getRandomInt(0,10); return a+b === 10 ? `${a}+${b+1}` : `${a}+${b}`;}, (v) => safeEval(String(v)) === 10)},
    { title: 'Munch the doubles', gridSize: 6, generateGrid: () => generateChallengeGrid(() => { const a = getRandomInt(1,9); return `${a}+${a}`;}, () => { const a = getRandomInt(1,9); const b=getRandomInt(1,9); return `${a}+${a===b?b+1:b}`;}, (v) => {const [a,b] = String(v).split('+').map(Number); return a===b;}) },
    { title: 'Munch numbers BETWEEN 4 and 9', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(5,8), () => [getRandomInt(1,4), getRandomInt(9,12)][getRandomInt(0,1)], (n) => typeof n === 'number' && n > 4 && n < 9) },
];
