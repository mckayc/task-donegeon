import { MathChallenge, CellValue } from "./MathMuncherTypes";
import { generateChallengeGrid, isPrime, getFactors, getGCF, getLCM, simplifyFraction, getRandomInt } from "./MathMuncherHelpers";

// --- GRADE 1 ---
const grade1: MathChallenge[] = [
    { title: 'Munch the Even Numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,10)*2, () => getRandomInt(0,9)*2+1, (n) => typeof n === 'number' && n % 2 === 0) },
    { title: 'Munch the Odd Numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(0,9)*2+1, () => getRandomInt(1,10)*2, (n) => typeof n === 'number' && n % 2 !== 0) },
    { title: 'Munch numbers GREATER than 5', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(6,10), () => getRandomInt(1,5), (n) => typeof n === 'number' && n > 5) },
    { title: 'Munch numbers LESS than 8', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,7), () => getRandomInt(8,12), (n) => typeof n === 'number' && n < 8) },
    { title: 'Munch sums that equal 7', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => { const a = getRandomInt(0,7); return `${a}+${7-a}`;}, () => { const a = getRandomInt(0,10); const b = getRandomInt(0,10); return a+b === 7 ? `${a}+${b+1}`: `${a}+${b}`}, (v) => eval(String(v)) === 7)},
    { title: 'Munch differences that equal 4', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => { const a = getRandomInt(4,10); return `${a}-${a-4}`;}, () => { const a = getRandomInt(5,10); return `${a}-${getRandomInt(0,a-1)}`;}, (v) => eval(String(v)) === 4)},
    { title: 'Munch numbers when counting by 5s', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,10)*5, () => getRandomInt(1,50), (n) => typeof n === 'number' && n > 0 && n % 5 === 0) },
    { title: 'Munch pairs that make 10', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => { const a = getRandomInt(0,10); return `${a}+${10-a}`;}, () => { const a = getRandomInt(0,10); const b = getRandomInt(0,10); return a+b === 10 ? `${a}+${b+1}` : `${a}+${b}`;}, (v) => eval(String(v)) === 10)},
    { title: 'Munch the doubles', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => { const a = getRandomInt(1,5); return `${a}+${a}`;}, () => { const a = getRandomInt(1,5); const b=getRandomInt(1,5); return `${a}+${a===b?b+1:b}`;}, (v) => {const [a,b] = String(v).split('+').map(Number); return a===b;}) },
    { title: 'Munch numbers BETWEEN 4 and 9', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(5,8), () => [getRandomInt(1,4), getRandomInt(9,12)][getRandomInt(0,1)], (n) => typeof n === 'number' && n > 4 && n < 9) },
];

// --- GRADE 2 ---
const grade2: MathChallenge[] = [
    { title: 'Munch sums that equal 15', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => { const a = getRandomInt(1,14); return `${a}+${15-a}`; }, () => { const a = getRandomInt(1,20); const b = getRandomInt(1,20); return a+b === 15 ? `${a}+${b+1}` : `${a}+${b}`;}, (v) => eval(String(v)) === 15)},
    { title: 'Munch differences that equal 11', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => { const a = getRandomInt(11,20); return `${a}-${a-11}`; }, () => {const a=getRandomInt(1,20); const b=getRandomInt(1,20); return a-b === 11 ? `${a}-${b+1}` : `${a}-${b}`;}, (v) => eval(String(v)) === 11)},
    { title: 'Munch numbers when skip-counting by 3s', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,10)*3, () => getRandomInt(1,30), (n) => typeof n === 'number' && n > 0 && n % 3 === 0) },
    { title: 'Munch facts that equal 20', gridSize: 12, generateGrid: () => {
        const correctOptions = ['2×10', '10×2', '4×5', '5×4'];
        return generateChallengeGrid(12, () => correctOptions[getRandomInt(0,3)], () => `${getRandomInt(2,10)}×${getRandomInt(2,10)}`, v => eval(String(v).replace('×','*')) === 20)
    }},
    { title: 'Munch facts that equal 2', gridSize: 12, generateGrid: () => {
        const correctOptions = ['10÷5', '20÷10', '4÷2', '8÷4', '6÷3'];
        return generateChallengeGrid(12, () => correctOptions[getRandomInt(0,4)], () => `${getRandomInt(5,20)}÷${getRandomInt(3,10)}`, v => eval(String(v).replace('÷','/')) === 2)
    }},
    { title: 'Munch the Odd Numbers (up to 50)', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(0,24)*2+1, () => getRandomInt(1,25)*2, (n) => typeof n === 'number' && n % 2 !== 0) },
    { title: 'Munch numbers with 4 in the tens place', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => 40+getRandomInt(0,9), () => { let n; do {n = getRandomInt(10,99);} while(Math.floor(n/10)===4); return n;}, (n) => typeof n === 'number' && Math.floor(n/10) % 10 === 4)},
    { title: 'Munch TRUE equations', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => {const a = getRandomInt(10,50); const b = getRandomInt(1,a-1); return `${a}>${b}`;}, () => {const a = getRandomInt(1,50); const b = getRandomInt(a, 50); return `${a}>${b}`;}, (v) => {const [a,b] = String(v).split('>').map(Number); return a > b;})},
    { title: 'Munch Multiples of 10', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,10)*10, () => {let n; do {n = getRandomInt(1,100);} while (n%10===0); return n;}, (n) => typeof n === 'number' && n > 0 && n % 10 === 0) },
    { title: 'Munch equations that are correct', gridSize: 12, generateGrid: () => {
        const correctGen = () => {const a=getRandomInt(2,8); const b=getRandomInt(1, 9-a); return `${a}+${b}=${a+b}`;};
        const incorrectGen = () => {const a=getRandomInt(1,8); const b=getRandomInt(1, 9-a); return `${a}+${b}=${a+b+getRandomInt(1,3)}`;};
        return generateChallengeGrid(12, correctGen, incorrectGen, v => { const [p, ans] = String(v).split('='); return eval(p) === Number(ans)})
    }},
];

// --- GRADE 3 ---
const grade3: MathChallenge[] = [
    { title: 'Munch facts that equal 24', gridSize: 12, generateGrid: () => {
        const correct = ['3×8', '8×3', '4×6', '6×4', '2×12', '12×2'];
        return generateChallengeGrid(12, ()=>correct[getRandomInt(0,5)], ()=>`${getRandomInt(2,12)}×${getRandomInt(2,12)}`, v=>eval(String(v).replace('×','*'))===24)
    }},
    { title: 'Munch facts that equal 7', gridSize: 12, generateGrid: () => {
        const correct = ['14÷2', '21÷3', '28÷4', '35÷5', '42÷6', '49÷7'];
        return generateChallengeGrid(12, ()=>correct[getRandomInt(0,5)], ()=>`${getRandomInt(10,50)}÷${getRandomInt(2,7)}`, v=>eval(String(v).replace('÷','/'))===7)
    }},
    { title: 'Munch the prime numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => [11,13,17,19,23,29,31,37,41,43,47][getRandomInt(0,10)], () => {let n; do {n=getRandomInt(10,50);} while(isPrime(n)); return n;}, (n) => typeof n === 'number' && isPrime(n)) },
    { title: 'Munch Multiples of 6', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,12)*6, () => {let n; do {n=getRandomInt(1,72);} while(n%6===0); return n;}, (n) => typeof n === 'number' && n > 0 && n % 6 === 0) },
    { title: 'Munch answers that equal 72', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>{const a=getRandomInt(1,71); return `${a}+${72-a}`}, ()=>(`${getRandomInt(20,50)}+${getRandomInt(20,50)}`), v=>eval(String(v))===72)},
    { title: 'Munch equations equal to 3×4', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>['12', '4+4+4'][getRandomInt(0,1)], ()=>'5+5+5', v=>eval(String(v)) === 12)},
    { title: 'Munch fractions equal to 1/2', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => {const a=getRandomInt(2,10); return `${a}/${a*2}`;}, () => {const a=getRandomInt(2,10); return `${a}/${a*2+1}`;}, (v) => {const [n,d] = (v as string).split('/').map(Number); return n/d === 0.5}) },
    { title: 'Munch true comparisons', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => {const a = getRandomInt(100,500); const b = getRandomInt(a+1,999); return `${a}<${b}`;}, () => {const a = getRandomInt(100,999); const b = getRandomInt(1, a); return `${a}<${b}`;}, (v) => {const [a,b] = String(v).split('<').map(Number); return a < b;})},
    { title: 'Munch true equations for a missing factor', gridSize: 12, generateGrid: () => {
        const correctGen = ()=>{const a=getRandomInt(2,10), b=getRandomInt(2,10); return `${a}×__=${a*b}`;};
        const incorrectGen = ()=>{const a=getRandomInt(2,10), b=getRandomInt(2,10); return `${a}×__=${a*b+1}`;};
        return generateChallengeGrid(12, correctGen, incorrectGen, v=>{const [p,ans]=String(v).split('='); const a=p.split('×')[0]; return Number(ans)%Number(a)===0})
    }},
    { title: 'Munch answers to: How many 5s in 25?', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => ['5', '25÷5'][getRandomInt(0,1)], () => ['4','10'][getRandomInt(0,1)], (v) => eval(String(v).replace('÷','/')) === 5) },
];

// --- GRADE 4 ---
const grade4: MathChallenge[] = [
    { title: 'Munch answers equal to 92', gridSize: 6, generateGrid: () => generateChallengeGrid(6, ()=>['23×4','46×2'][getRandomInt(0,1)], ()=>`${getRandomInt(20,50)}×${getRandomInt(2,4)}`, v=>eval(String(v).replace('×','*'))===92)},
    { title: 'Munch facts equal to 5 R2', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>['27÷5','17÷3'][getRandomInt(0,1)], ()=>`${getRandomInt(20,40)}÷${getRandomInt(4,7)}`, v=>{const [n,d]=String(v).split('÷').map(Number); return Math.floor(n/d)===5 && n%d===2})},
    { title: 'Munch a Factor of 24', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => [1,2,3,4,6,8,12,24][getRandomInt(0,7)], () => {let n; do {n=getRandomInt(2,23)} while(24%n===0); return n;}, (n) => typeof n === 'number' && 24 % n === 0) },
    { title: 'Munch a Multiple of 12', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(1,10)*12, () => {let n; do {n=getRandomInt(1,120)} while(n%12===0); return n}, (n) => typeof n === 'number' && n > 0 && n % 12 === 0) },
    { title: 'Munch fractions less than 1/2', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>{const d=getRandomInt(3,10); const n=getRandomInt(1,Math.floor(d/2)-1); return `${n}/${d}`}, ()=>{const d=getRandomInt(3,10); const n=getRandomInt(Math.ceil(d/2),d-1); return `${n}/${d}`}, v=>eval(String(v))<0.5)},
    { title: 'Munch fractions equal to 3/4', gridSize: 12, generateGrid: () => generateChallengeGrid(12, () => {const a=getRandomInt(2,8); return `${a*3}/${a*4}`;}, () => {const a=getRandomInt(2,8); return `${a*3-1}/${a*4}`;}, (v) => {const [n,d] = String(v).split('/').map(Number); return n/d === 3/4}) },
    { title: 'Munch the Prime Numbers', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => [29,31,37,41,43,47][getRandomInt(0,5)], () => {let n; do {n=getRandomInt(25,50);} while(isPrime(n)); return n;}, (n) => typeof n === 'number' && isPrime(n)) },
    { title: 'Munch numbers equal to 0.4', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>['0.40','4/10'][getRandomInt(0,1)], ()=>['0.25','3/8'][getRandomInt(0,1)], v=>eval(String(v))===0.4)},
    { title: 'Munch answers equal to 435', gridSize: 6, generateGrid: () => generateChallengeGrid(6, ()=>['600-165','200+235'][getRandomInt(0,1)], ()=>['400+50','450-20'][getRandomInt(0,1)], v=>eval(String(v))===435)},
    { title: 'Munch numbers that round to 500 (nearest 100)', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => getRandomInt(450,549), () => getRandomInt(100,449), (n) => typeof n === 'number' && Math.round(n/100)*100===500)},
];

// --- GRADE 5 ---
const grade5: MathChallenge[] = [
    { title: 'Munch products equal to 1,764', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'42×42', ()=>'30×60', v=>eval(String(v).replace('×','*')) === 1764)},
    { title: 'Munch facts equal to 24', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'72÷3', ()=>'65÷2', v=>eval(String(v).replace('÷','/')) === 24)},
    { title: 'Munch fractions equal to 7/8', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'3/8+4/8', ()=>'2/8+2/8', v=>eval(String(v)) === 7/8)},
    { title: 'Munch fractions equal to 2/3', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'4/6', ()=>'8/12', v=>eval(String(v)) === 2/3)},
    { title: 'Munch fractions equal to 2 1/2', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'5/2', ()=>'9/5', v=>eval(String(v)) === 2.5)},
    { title: 'Munch sums equal to 1.25', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'0.75+0.50', ()=>'0.60+0.70', v=>eval(String(v)) === 1.25)},
    { title: 'Munch numbers equal to 25% of 100', gridSize: 6, generateGrid: () => generateChallengeGrid(6, ()=>[25, '1/4'][getRandomInt(0,1)], ()=>[50,75][getRandomInt(0,1)], v=>eval(String(v)) === 25)},
    { title: 'Munch equations equal to 14', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'20-6', ()=>'3+4×2', v=>eval(String(v).replace('×','*'))===14)},
    { title: 'Munch GCF of 12 and 18', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => [3,6][getRandomInt(0,1)], () => 5, v => 12 % (v as number) === 0 && 18 % (v as number) === 0)},
    { title: 'Munch LCM of 3 and 4', gridSize: 6, generateGrid: () => generateChallengeGrid(6, () => [12,24][getRandomInt(0,1)], () => 9, v => (v as number) % 3 === 0 && (v as number) % 4 === 0)},
];

// --- GRADE 6 ---
const grade6: MathChallenge[] = [
    { title: 'Munch products equal to 3/8', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'1/2×3/4', ()=>'2/3×1/4', v=>eval(String(v).replace('×','*'))===3/8)},
    { title: 'Munch answers equal to 6', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'3÷1/2', ()=>'5÷1/3', v=>eval(String(v).replace('÷','/'))===6)},
    { title: 'Munch sums equal to 1', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'1/2+1/2', ()=>'3/4+1/3', v=>eval(String(v))===1)},
    { title: 'Munch values equal to 0.75', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'3/4', ()=>'2/5', v=>eval(String(v))===0.75)},
    { title: 'Munch ratios equal to 2:3', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'4:6', ()=>'5:7', v=>{const [a,b]=String(v).split(':').map(Number); return a/b === 2/3})},
    { title: 'Munch answers equal to 20% of 60', gridSize: 6, generateGrid: () => generateChallengeGrid(6, ()=>12, ()=>15, v=>v===12)},
    { title: 'Munch answers equal to 25', gridSize: 6, generateGrid: () => generateChallengeGrid(6, ()=>'5²', ()=>'2³', v=>eval(String(v).replace('²','**2').replace('³','**3'))===25)},
    { title: 'Munch equations equal to 17', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'2³+9', ()=>'(5+3)²-47', v=>eval(String(v).replace('³','**3').replace('²','**2'))===17)},
    { title: 'Munch sums equal to -3', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'-5+2', ()=>'-2+3', v=>eval(String(v))===-3)},
    { title: 'Munch equations with x=6', gridSize: 12, generateGrid: () => generateChallengeGrid(12, ()=>'x+4=10', ()=>'x-3=10', v=>{const [p,a]=String(v).replace('x','6').split('='); return eval(p)===Number(a)})},
];

export const challenges: Record<string, {name: string, challenges: MathChallenge[]}> = {
    "grade-1": { name: "1st Grade", challenges: grade1 },
    "grade-2": { name: "2nd Grade", challenges: grade2 },
    "grade-3": { name: "3rd Grade", challenges: grade3 },
    "grade-4": { name: "4th Grade", challenges: grade4 },
    "grade-5": { name: "5th Grade", challenges: grade5 },
    "grade-6": { name: "6th Grade", challenges: grade6 },
};
