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
    { title: 'Munch answers equal to 92', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>['23×4','46×2'][getRandomInt(0,1)], ()=>`${getRandomInt(20,50)}×${getRandomInt(2,4)}`, v=>safeEval(String(v))===92)},
    { title: 'Munch facts equal to 5 R2', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>['27÷5','17÷3'][getRandomInt(0,1)], ()=>`${getRandomInt(20,40)}÷${getRandomInt(4,7)}`, v=>{const [n,d]=String(v).split('÷').map(Number); return Math.floor(n/d)===5 && n%d===2})},
    { title: 'Munch a Factor of 24', gridSize: 6, generateGrid: () => generateChallengeGrid(() => [1,2,3,4,6,8,12,24][getRandomInt(0,7)], () => {let n; do {n=getRandomInt(2,23)} while(24%n===0); return n;}, (n) => typeof n === 'number' && 24 % n === 0) },
    { title: 'Munch a Multiple of 12', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,10)*12, () => {let n; do {n=getRandomInt(1,120)} while(n%12===0); return n}, (n) => typeof n === 'number' && n > 0 && n % 12 === 0) },
    { title: 'Munch fractions less than 1/2', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>{const d=getRandomInt(3,10); const n=getRandomInt(1,Math.floor(d/2)-1); return `${n}/${d}`}, ()=>{const d=getRandomInt(3,10); const n=getRandomInt(Math.ceil(d/2),d-1); return `${n}/${d}`}, v=>safeEval(String(v))!<0.5)},
    { title: 'Munch fractions equal to 3/4', gridSize: 6, generateGrid: () => generateChallengeGrid(() => {const a=getRandomInt(2,8); return `${a*3}/${a*4}`;}, () => {const a=getRandomInt(2,8); return `${a*3-1}/${a*4}`;}, (v) => {const [n,d] = String(v).split('/').map(Number); return n/d === 3/4}) },
    { title: 'Munch the Prime Numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(() => [29,31,37,41,43,47][getRandomInt(0,5)], () => {let n; do {n=getRandomInt(25,50);} while(isPrime(n)); return n;}, (n) => typeof n === 'number' && isPrime(n)) },
    { title: 'Munch numbers equal to 0.4', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>['0.40','4/10','2/5'][getRandomInt(0,2)], ()=>['0.25','3/8'][getRandomInt(0,1)], v=>safeEval(String(v))===0.4)},
    { title: 'Munch answers equal to 435', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>['600-165','200+235'][getRandomInt(0,1)], ()=>['400+50','450-20'][getRandomInt(0,1)], v=>safeEval(String(v))===435)},
    { title: 'Munch numbers that round to 500 (nearest 100)', gridSize: 6, generateGrid: () => generateChallengeGrid(() => getRandomInt(450,549), () => [getRandomInt(100,449), getRandomInt(550, 999)][getRandomInt(0,1)], (n) => typeof n === 'number' && Math.round(n/100)*100===500)},
];
