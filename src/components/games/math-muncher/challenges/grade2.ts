import { MathChallenge, CellValue } from "../types";
import { generateChallengeGrid, getRandomInt } from "../helpers";

// Helper for robust expression evaluation
const safeEval = (expr: string): number | null => {
    try {
        if (/[^0-9+\-*/.() ]/.test(expr)) return null;
        return new Function(`return ${expr.replace('×', '*').replace('÷', '/')}`)();
    } catch { return null; }
};

export const challenges: MathChallenge[] = [
    { title: 'Munch sums that equal 15', gridSize: 5, generateGrid: () => generateChallengeGrid(() => { const a = getRandomInt(1,14); return `${a}+${15-a}`; }, () => { const a = getRandomInt(1,20); const b = getRandomInt(1,20); return a+b === 15 ? `${a}+${b+1}` : `${a}+${b}`;}, (v) => safeEval(String(v)) === 15)},
    { title: 'Munch differences that equal 11', gridSize: 5, generateGrid: () => generateChallengeGrid(() => { const a = getRandomInt(11,20); return `${a}-${a-11}`; }, () => {const a=getRandomInt(1,20); const b=getRandomInt(1,20); return a-b === 11 ? `${a}-${b+1}` : `${a}-${b}`;}, (v) => safeEval(String(v)) === 11)},
    { title: 'Munch numbers when skip-counting by 3s', gridSize: 5, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,10)*3, () => { let n; do { n = getRandomInt(1,30); } while (n % 3 === 0); return n; }, (n) => typeof n === 'number' && n > 0 && n % 3 === 0) },
    { title: 'Munch facts that equal 20', gridSize: 5, generateGrid: () => {
        const correctOptions = ['2×10', '10×2', '4×5', '5×4'];
        return generateChallengeGrid(() => correctOptions[getRandomInt(0,3)], () => `${getRandomInt(2,10)}×${getRandomInt(2,10)}`, v => safeEval(String(v)) === 20)
    }},
    { title: 'Munch facts that equal 2', gridSize: 5, generateGrid: () => {
        const correctOptions = ['10÷5', '20÷10', '4÷2', '8÷4', '6÷3'];
        return generateChallengeGrid(() => correctOptions[getRandomInt(0,4)], () => `${getRandomInt(5,20)}÷${getRandomInt(3,10)}`, v => safeEval(String(v)) === 2)
    }},
    { title: 'Munch the Odd Numbers (up to 50)', gridSize: 5, generateGrid: () => generateChallengeGrid(() => getRandomInt(0,24)*2+1, () => getRandomInt(1,25)*2, (n) => typeof n === 'number' && n % 2 !== 0) },
    { title: 'Munch numbers with 4 in the tens place', gridSize: 5, generateGrid: () => generateChallengeGrid(() => 40+getRandomInt(0,9), () => { let n; do {n = getRandomInt(10,99);} while(Math.floor(n/10) % 10 === 4); return n;}, (n) => typeof n === 'number' && Math.floor(n/10) % 10 === 4)},
    { title: 'Munch TRUE equations', gridSize: 5, generateGrid: () => generateChallengeGrid(() => {const a = getRandomInt(10,50); const b = getRandomInt(1,a-1); return `${a}>${b}`;}, () => {const a = getRandomInt(1,50); const b = getRandomInt(a, 50); return `${a}>${b}`;}, (v) => {const [a,b] = String(v).split('>').map(Number); return a > b;})},
    { title: 'Munch Multiples of 10', gridSize: 5, generateGrid: () => generateChallengeGrid(() => getRandomInt(1,10)*10, () => {let n; do {n = getRandomInt(1,100);} while (n%10===0); return n;}, (n) => typeof n === 'number' && n > 0 && n % 10 === 0) },
    { title: 'Munch equations that are correct', gridSize: 5, generateGrid: () => {
        const correctGen = () => {const a=getRandomInt(2,8); const b=getRandomInt(1, 9-a); return `${a}+${b}=${a+b}`;};
        const incorrectGen = () => {const a=getRandomInt(1,8); const b=getRandomInt(1, 9-a); return `${a}+${b}=${a+b+getRandomInt(1,3)}`;};
        return generateChallengeGrid(correctGen, incorrectGen, v => { const [p, ans] = String(v).split('='); return safeEval(p) === Number(ans)})
    }},
];