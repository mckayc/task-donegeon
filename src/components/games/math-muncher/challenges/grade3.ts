import { MathChallenge, CellValue } from "../types";
import { generateChallengeGrid, getRandomInt, isPrime } from "../helpers";

// Helper for robust expression evaluation
const safeEval = (expr: string): number | null => {
    try {
        if (/[^0-9+\-*/.() ]/.test(expr)) return null;
        return new Function(`return ${expr.replace('×', '*').replace('÷', '/')}`)();
    } catch { return null; }
};

export const challenges: MathChallenge[] = [
    { title: 'Munch facts that equal 24', gridSize: 5, generateGrid: () => {
        const correct = ['3×8', '8×3', '4×6', '6×4', '2×12', '12×2'];
        return generateChallengeGrid(()=>correct[getRandomInt(0,5)], ()=>`${getRandomInt(2,12)}×${getRandomInt(2,12)}`, v=>safeEval(String(v))===24)
    }},
    { title: 'Munch facts that equal 7', gridSize: 5, generateGrid: () => {
        const correct = ['14÷2', '21÷3', '28÷4', '35÷5', '42÷6', '49÷7'];
        return generateChallengeGrid(()=>correct[getRandomInt(0,5)], ()=>`${getRandomInt(10,50)}÷${getRandomInt(2,7)}`, v=>safeEval(String(v))===7)
    }},
    { title: 'Munch the prime numbers', gridSize: 5, generateGrid: () => generateChallengeGrid(() => [11,13,17,19,23,29,31,37,41,43,47][getRandomInt(0,10)], () => {let n; do {n=getRandomInt(10,50);} while(isPrime(n)); return n;}, (n) => typeof n === 'number' && isPrime(n)) },
    { title: 'Munch Multiples of 6', gridSize: 5, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,12)*6, () => {let n; do {n=getRandomInt(1,72);} while(n%6===0); return n;}, (n) => typeof n === 'number' && n > 0 && n % 6 === 0) },
    { title: 'Munch answers that equal 72', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>(`${getRandomInt(1,71)}+${72-getRandomInt(1,71)}`), ()=>(`${getRandomInt(20,50)}+${getRandomInt(20,50)}`), v=>safeEval(String(v))===72)},
    { title: 'Munch equations equal to 3×4', gridSize: 5, generateGrid: () => {
        const correctGen = () => ['12', '4+4+4'][getRandomInt(0,1)];
        const incorrectGen = () => { const rand = Math.random(); if (rand < 0.33) { return String(getRandomInt(13, 30)); } else if (rand < 0.66) { return `${getRandomInt(2,6)}+${getRandomInt(2,6)}+${getRandomInt(2,6)}`; } else { return `${getRandomInt(2,6)}×${getRandomInt(2,6)}`; } };
        const checker = (v: CellValue) => { try { return safeEval(String(v)) === 12; } catch(e) { return false; } };
        return generateChallengeGrid(correctGen, incorrectGen, checker)
    }},
    { title: 'Munch fractions equal to 1/2', gridSize: 5, generateGrid: () => generateChallengeGrid(() => {const a=getRandomInt(2,10); return `${a}/${a*2}`;}, () => {const a=getRandomInt(2,10); return `${a}/${a*2+1}`;}, (v) => {const [n,d] = (v as string).split('/').map(Number); return n/d === 0.5}) },
    { title: 'Munch true comparisons', gridSize: 5, generateGrid: () => generateChallengeGrid(() => {const a = getRandomInt(100,500); const b = getRandomInt(a+1,999); return `${a}<${b}`;}, () => {const a = getRandomInt(100,999); const b = getRandomInt(1, a); return `${a}<${b}`;}, (v) => {const [a,b] = String(v).split('<').map(Number); return a < b;})},
    { title: 'Munch true equations for a missing factor', gridSize: 5, generateGrid: () => {
        const correctGen = ()=>{const a=getRandomInt(2,10), b=getRandomInt(2,10); return `${a}×__=${a*b}`;};
        const incorrectGen = ()=>{const a=getRandomInt(2,10), b=getRandomInt(2,10); return `${a}×__=${a*b+1}`;};
        return generateChallengeGrid(correctGen, incorrectGen, v=>{const [p,ans]=String(v).split('='); const a=p.split('×')[0]; return Number(ans)%Number(a)===0})
    }},
    { title: 'Munch answers to: How many 5s in 25?', gridSize: 5, generateGrid: () => generateChallengeGrid(() => ['5', '25÷5'][getRandomInt(0,1)], () => [getRandomInt(1,4), getRandomInt(6,10)][getRandomInt(0,1)], (v) => safeEval(String(v)) === 5) },
];