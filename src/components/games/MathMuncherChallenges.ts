
import { GameGrades, MathChallenge } from "./MathMuncherTypes";
import { 
    getRandomInt, 
    generateChallengeGrid, 
    isPrime, 
    getFactors, 
    getGCF, 
    getLCM,
    simplifyFraction 
} from "./MathMuncherHelpers";

// --- GRADE 1 ---
const grade1: MathChallenge[] = [
    { title: 'Munch the Even Numbers', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,10)*2, () => getRandomInt(0,9)*2+1, (n) => typeof n === 'number' && n % 2 === 0) },
    { title: 'Munch the Odd Numbers', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(0,9)*2+1, () => getRandomInt(1,10)*2, (n) => typeof n === 'number' && n % 2 !== 0) },
    { title: 'Munch numbers GREATER than 5', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(6,10), () => getRandomInt(1,5), (n) => typeof n === 'number' && n > 5) },
    { title: 'Munch numbers LESS than 8', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,7), () => getRandomInt(8,12), (n) => typeof n === 'number' && n < 8) },
    { title: 'Munch sums that equal 7', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => { const a = getRandomInt(0,7); return `${a}+${7-a}`;}, () => { const a = getRandomInt(0,6); return `${a}+${getRandomInt(0,6)}`;}, (v) => eval(v as string) === 7)},
    { title: 'Munch differences that equal 4', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => { const a = getRandomInt(4,10); return `${a}-${a-4}`;}, () => { const a = getRandomInt(5,10); return `${a}-${getRandomInt(0,a-1)}`;}, (v) => eval(v as string) === 4)},
    { title: 'Munch numbers when counting by 2s', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,10)*2, () => getRandomInt(0,9)*2+1, (n) => typeof n === 'number' && n % 2 === 0 && n > 0) },
    { title: 'Munch pairs that make 10', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => { const a = getRandomInt(0,10); return `${a}+${10-a}`;}, () => { const a = getRandomInt(0,9); return `${a}+${getRandomInt(0,9)}`;}, (v) => eval(v as string) === 10)},
    { title: 'Munch the doubles', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => { const a = getRandomInt(1,5); return `${a}+${a}`;}, () => { const a = getRandomInt(1,5); const b=getRandomInt(1,5); return `${a}+${a===b?b+1:b}`;}, (v) => {const [a,b] = (v as string).split('+').map(Number); return a===b;}) },
    { title: 'Munch numbers BETWEEN 4 and 9', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(5,8), () => [getRandomInt(1,4), getRandomInt(9,12)][getRandomInt(0,1)], (n) => typeof n === 'number' && n > 4 && n < 9) },
];

// --- GRADE 2 ---
const grade2: MathChallenge[] = [
    { title: 'Munch sums up to 20', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => { const a = getRandomInt(1,19); const b = getRandomInt(1, 20-a); return `${a}+${b}`; }, () => `${getRandomInt(10,20)}+${getRandomInt(10,20)}`, (v) => eval(v as string) <= 20)},
    { title: 'Munch differences up to 20', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => { const a = getRandomInt(1,20); const b = getRandomInt(0,a); return `${a}-${b}`; }, () => {const a=getRandomInt(1,10); const b=getRandomInt(a+1, 20); return `${a}-${b}`;}, (v) => eval(v as string) >= 0)},
    { title: 'Munch numbers when skip-counting by 3s', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,10)*3, () => getRandomInt(1,30), (n) => typeof n === 'number' && n > 0 && n % 3 === 0) },
    { title: 'Munch answers to 2s, 5s, or 10s multiplication', gridSize: 12, generateGrid: () => {
        const mults = [2,5,10];
        const correctGen = () => mults[getRandomInt(0,2)] * getRandomInt(1,10);
        const incorrectGen = () => { let n; do { n = getRandomInt(2,50); } while(n%2===0 || n%5===0); return n; };
        return generateChallengeGrid(12, correctGen, incorrectGen, (v) => typeof v === 'number' && (v%2===0 || v%5===0));
    }},
    { title: 'Munch answers to division by 2, 5, or 10', gridSize: 12, generateGrid: () => {
        const divs = [2,5,10];
        const correctGen = () => { const d = divs[getRandomInt(0,2)]; return `${d*getRandomInt(1,10)}÷${d}`;};
        const incorrectGen = () => { let n,d; do {n=getRandomInt(2,50); d=divs[getRandomInt(0,2)];} while(n%d===0); return `${n}÷${d}`};
        return generateChallengeGrid(6, correctGen, incorrectGen, (v) => { const [n,d] = (v as string).split('÷').map(Number); return n%d===0; });
    }},
    { title: 'Munch the Even Numbers (up to 100)', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,50)*2, () => getRandomInt(0,49)*2+1, (n) => typeof n === 'number' && n % 2 === 0) },
    { title: 'Munch numbers with 5 in the tens place', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 50+getRandomInt(0,9), () => getRandomInt(10,100), (n) => typeof n === 'number' && Math.floor(n/10) % 10 === 5)},
    { title: 'Munch expressions where the left is GREATER THAN the right', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a = getRandomInt(10,50); const b = getRandomInt(1,a-1); return `${a}>${b}`;}, () => {const a = getRandomInt(1,50); const b = getRandomInt(a, 50); return `${a}>${b}`;}, (v) => {const [a,b] = (v as string).split('>').map(Number); return a > b;})},
    { title: 'Munch Multiples of 10', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,10)*10, () => getRandomInt(1,100), (n) => typeof n === 'number' && n > 0 && n % 10 === 0) },
    { title: 'Munch the missing number that solves the equation', gridSize: 6, generateGrid: () => {
        const correctGen = () => {const a=getRandomInt(1,8); const b=getRandomInt(1, 9-a); return `${a}+${a+b}=${b}`;}; // Expression | Answer
        // Incorrect is just a random number
        return generateChallengeGrid(6, () => `${getRandomInt(1,5)}+__=${getRandomInt(6,10)}`, () => `${getRandomInt(1,8)}+__=${getRandomInt(2,5)}`, (v) => { const [p1, p2] = (v as string).split('='); const [a] = p1.split('+'); return Number(p2) - Number(a) > 0})
    }},
];

// --- GRADE 3 ---
const grade3: MathChallenge[] = [
    { title: 'Munch correct multiplication facts', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(2,12); const b=getRandomInt(2,12); return `${a}×${b}=${a*b}`;}, () => {const a=getRandomInt(2,12); const b=getRandomInt(2,12); return `${a}×${b}=${a*b+getRandomInt(1,5)}`;}, (v) => {const [p,ans] = (v as string).split('='); return eval(p.replace('×','*')) === Number(ans)}) },
    { title: 'Munch correct division facts', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const b=getRandomInt(2,12); const ans=getRandomInt(2,12); return `${b*ans}÷${b}=${ans}`;}, () => {const b=getRandomInt(2,12); const ans=getRandomInt(2,12); return `${b*ans+getRandomInt(1,b-1)}÷${b}=${ans}`;}, (v) => { const [p,ans] = (v as string).split('='); const [n,d] = p.split('÷').map(Number); return n/d === Number(ans); }) },
    { title: 'Munch the prime numbers', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47][getRandomInt(0,14)], () => getRandomInt(4,50), (n) => typeof n === 'number' && isPrime(n)) },
    { title: 'Munch Multiples of 6', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,12)*6, () => getRandomInt(1,72), (n) => typeof n === 'number' && n > 0 && n % 6 === 0) },
    { title: 'Munch correct addition up to 100', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(10,90); const b=getRandomInt(1,100-a); return `${a}+${b}=${a+b}`;}, () => {const a=getRandomInt(10,90); const b=getRandomInt(1,100-a); return `${a}+${b}=${a+b-getRandomInt(1,5)}`;}, (v) => {const [p,ans] = (v as string).split('='); return eval(p) === Number(ans)}) },
    { title: 'Munch equivalent expressions', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(2,5); const b=getRandomInt(2,5); return `${new Array(b).fill(a).join('+')}=${b}×${a}`;}, () => {const a=getRandomInt(2,5); const b=getRandomInt(2,5); return `${new Array(b).fill(a).join('+')}=${b+1}×${a}`;}, (v) => {const [add,mult] = (v as string).split('='); return eval(add) === eval(mult.replace('×','*'))}) },
    { title: 'Munch fractions equivalent to 1/2', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(2,10); return `${a}/${a*2}`;}, () => {const a=getRandomInt(2,10); return `${a}/${a*2+1}`;}, (v) => {const [n,d] = (v as string).split('/').map(Number); return n/d === 0.5}) },
    { title: 'Munch expressions where the left is LESS THAN the right', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a = getRandomInt(100,500); const b = getRandomInt(a+1,999); return `${a}<${b}`;}, () => {const a = getRandomInt(100,999); const b = getRandomInt(1, a); return `${a}<${b}`;}, (v) => {const [a,b] = (v as string).split('<').map(Number); return a < b;})},
    { title: 'Munch the missing factor that is 5', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => `__×${getRandomInt(2,12)}=${5*getRandomInt(2,12)}`, () => `__×${getRandomInt(2,12)}=${getRandomInt(13,25)}`, (v) => { const [p,ans]= (v as string).split('='); const factor = p.split('×')[1]; return Number(ans) % Number(factor) === 0 && Number(ans) / Number(factor) === 5})},
    { title: 'Munch the answer to "How many 5s in 25?"', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 5, () => getRandomInt(1,10), (v) => v === 5) },
];

// --- GRADE 4 ---
const grade4: MathChallenge[] = [
    { title: 'Munch answers to 2-digit × 1-digit multiplication', gridSize: 12, generateGrid: () => {
        const correctGen = () => getRandomInt(10,99) * getRandomInt(2,9);
        const incorrectGen = () => getRandomInt(100,500) + 1; // Simple incorrect logic
        return generateChallengeGrid(12, correctGen, incorrectGen, (n) => {
            const factors = getFactors(n as number);
            return factors.some(f => f >= 10 && f <= 99 && (n as number)/f >= 2 && (n as number)/f <= 9);
        });
    }},
    { title: 'Munch division problems with a remainder of 1', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const d=getRandomInt(2,9); const q=getRandomInt(2,9); return `${q*d+1}÷${d}`;}, () => {const d=getRandomInt(2,9); const q=getRandomInt(2,9); return `${q*d+getRandomInt(2,d-1)}÷${d}`;}, (v) => {const [n,d]=(v as string).split('÷').map(Number); return n%d===1;})},
    { title: 'Munch a Factor of 24', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => [1,2,3,4,6,8,12,24][getRandomInt(0,7)], () => getRandomInt(5,23), (n) => typeof n === 'number' && 24 % n === 0) },
    { title: 'Munch a Multiple of 8', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(1,12)*8, () => getRandomInt(1,96), (n) => typeof n === 'number' && n>0 && n % 8 === 0) },
    { title: 'Munch the larger fraction', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => "1/2 > 1/3", () => "1/4 > 1/3", (v) => {const [a,b] = (v as string).split('>').map(s=>eval(s)); return a > b}) },
    { title: 'Munch fractions equivalent to 2/3', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(2,10); return `${a*2}/${a*3}`;}, () => {const a=getRandomInt(2,10); return `${a*2-1}/${a*3}`;}, (v) => {const [n,d] = (v as string).split('/').map(Number); return n/d === 2/3}) },
    { title: 'Munch the Composite Numbers', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(2,25)*getRandomInt(2,4), () => getRandomInt(2,50), (n) => typeof n === 'number' && !isPrime(n)) },
    { title: 'Munch the decimals equal to 0.5', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 0.5, () => 0.05, (n) => n === 0.5)},
    { title: 'Munch correct subtraction of 3-digit numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(200,999); const b=getRandomInt(100,a-1); return `${a}-${b}=${a-b}`;}, () => {const a=getRandomInt(200,999); const b=getRandomInt(100,a-1); return `${a}-${b}=${a-b+getRandomInt(1,5)}`;}, (v) => {const [p,ans] = (v as string).split('='); return eval(p) === Number(ans)}) },
    { title: 'Munch the number that rounds to 100 (nearest 100)', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => getRandomInt(50,149), () => getRandomInt(150,249), (n) => typeof n === 'number' && Math.round(n/100)*100===100)},
];

// --- GRADE 5 ---
const grade5: MathChallenge[] = [
    { title: 'Munch the correct long multiplication answer', gridSize: 12, generateGrid: () => {
        const a = getRandomInt(10,99), b = getRandomInt(10,99);
        // FIX: Removed superfluous 5th argument.
        return generateChallengeGrid(12, ()=> a*b, () => a*b + getRandomInt(1,20), v => v === a*b)
    } },
    { title: 'Munch the correct long division answer', gridSize: 12, generateGrid: () => {
        const b = getRandomInt(2,9), ans = getRandomInt(10,99);
        // FIX: Removed superfluous 5th argument.
        return generateChallengeGrid(12, ()=> ans, () => ans + getRandomInt(1,5), v => v === ans)
    }},
    { title: 'Munch sums of fractions with like denominators', gridSize: 6, generateGrid: () => {
        const d = getRandomInt(3,12); const n1 = getRandomInt(1,d-1); const n2 = getRandomInt(1, d-n1); const [sn,sd] = simplifyFraction(n1+n2,d);
        return generateChallengeGrid(6, () => `${n1}/${d}+${n2}/${d}=${sn}/${sd}`, () => {const wrongN=getRandomInt(n1+n2+1, 2*d); const [wsn, wsd] = simplifyFraction(wrongN,d); return `${n1}/${d}+${n2}/${d}=${wsn}/${wsd}`}, v => { const [p,ans] = (v as string).split('='); return eval(p) === eval(ans)})
    }},
    { title: 'Munch the simplified version of 6/12', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => '1/2', () => '3/6', v => v === '1/2')},
    { title: 'Munch the mixed number for 7/3', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => '2 1/3', () => '2 2/3', v => v === '2 1/3')},
    { title: 'Munch correct decimal addition', gridSize: 6, generateGrid: () => {
        const a=getRandomInt(1,10)+getRandomInt(1,99)/100; const b=getRandomInt(1,10)+getRandomInt(1,99)/100;
        return generateChallengeGrid(6, () => `${a.toFixed(2)}+${b.toFixed(2)}=${(a+b).toFixed(2)}`, () => `${a.toFixed(2)}+${b.toFixed(2)}=${(a+b+0.1).toFixed(2)}`, v => {const [p,ans] = (v as string).split('='); return Math.abs(eval(p) - Number(ans)) < 0.001})
    }},
    { title: 'Munch the percentage equivalent of 1/4', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=> '25%', ()=> '20%', v => v === '25%')},
    { title: 'Munch the correct answer for 3+4×2', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 11, () => 14, v => v === 11)},
    { title: 'Munch the GCF of 12 and 18', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 6, () => 3, v => v === 6)},
    { title: 'Munch the LCM of 4 and 6', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 12, () => 24, v => v === 12)},
];

// --- GRADE 6 ---
const grade6: MathChallenge[] = [
    { title: 'Munch correct fraction multiplication', gridSize: 6, generateGrid: () => {
        const [n1,d1]=simplifyFraction(getRandomInt(1,5),getRandomInt(2,6)); const [n2,d2]=simplifyFraction(getRandomInt(1,5),getRandomInt(2,6)); const [sn,sd]=simplifyFraction(n1*n2,d1*d2);
        return generateChallengeGrid(6, () => `${n1}/${d1}×${n2}/${d2}=${sn}/${sd}`, () => `${n1}/${d1}×${n2}/${d2}=${sn+1}/${sd}`, v => {const [p,a]=(v as string).split('='); return eval(p.replace('×','*')) === eval(a)})
    }},
    { title: 'Munch correct fraction division', gridSize: 6, generateGrid: () => {
        const [n1,d1]=simplifyFraction(getRandomInt(1,5),getRandomInt(2,6)); const [n2,d2]=simplifyFraction(getRandomInt(1,5),getRandomInt(2,6)); const [sn,sd]=simplifyFraction(n1*d2,d1*n2);
        return generateChallengeGrid(6, () => `${n1}/${d1}÷${n2}/${d2}=${sn}/${sd}`, () => `${n1}/${d1}÷${n2}/${d2}=${sn}/${sd+1}`, v => {const [p,a]=(v as string).split('='); return eval(p) === eval(a)})
    }},
    { title: 'Munch correct subtraction of unlike fractions', gridSize: 6, generateGrid: () => {
        const d1=getRandomInt(2,5), d2=getRandomInt(2,5); const n1=getRandomInt(1,d1-1), n2=getRandomInt(1,d2-1);
        if (n1/d1 < n2/d2) return grade6[2].generateGrid(); // regenerate if negative
        const [sn,sd] = simplifyFraction(n1*d2 - n2*d1, d1*d2);
        return generateChallengeGrid(6, () => `${n1}/${d1}-${n2}/${d2}=${sn}/${sd}`, () => `${n1}/${d1}-${n2}/${d2}=${sn}/${sd+1}`, v => {const [p,a]=(v as string).split('='); return Math.abs(eval(p)-eval(a))<0.001})
    }},
    { title: 'Munch the decimal for 3/4', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 0.75, () => 0.25, v => v === 0.75)},
    { title: 'Munch the correct ratio for 4:8', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => '1:2', () => '1:3', v => v === '1:2')},
    { title: 'Munch the answer to 20% of 60', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 12, () => 30, v => v === 12)},
    { title: 'Munch the value of 2³', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 8, () => 6, v => v === 8)},
    { title: 'Munch the answer to (3+2)²', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => 25, () => 11, v => v === 25)},
    // FIX: Removed superfluous 5th argument.
    { title: 'Munch the correct negative integer', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => -5, () => 5, v => v === -5)},
    { title: 'Munch equations where x = 7', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => {const a=getRandomInt(2,10); return `x+${a}=${7+a}`}, () => {const a=getRandomInt(2,10); return `x+${a}=${8+a}`}, v=>{const [p,ans]=(v as string).split('='); const [_,a]=p.split('+'); return Number(ans)-Number(a)===7})},
];

export const challenges: Record<string, {name: string, challenges: MathChallenge[]}> = {
    "grade-1": { name: "1st Grade", challenges: grade1 },
    "grade-2": { name: "2nd Grade", challenges: grade2 },
    "grade-3": { name: "3rd Grade", challenges: grade3 },
    "grade-4": { name: "4th Grade", challenges: grade4 },
    "grade-5": { name: "5th Grade", challenges: grade5 },
    "grade-6": { name: "6th Grade", challenges: grade6 },
};
