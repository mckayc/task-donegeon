import { MathChallenge, CellValue } from "../types";
import { generateChallengeGrid, getRandomInt, isPrime } from "../helpers";

// Helper for robust expression evaluation
const safeEval = (expr: string): number | null => {
    try {
        if (/[^0-9+\-*/.() ]/.test(expr)) return null;
        return new Function(`return ${expr.replace(/\b\d+\s*%/g, (match) => `(${match.replace('%', '')}/100)`).replace('×', '*').replace('÷', '/').replace(/\*\*/g, '**')}`)();
    } catch { return null; }
};

export const challenges: MathChallenge[] = [
    { title: 'Munch products equal to 3/8', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'1/2×3/4', ()=>'2/3×1/4', v=>safeEval(String(v))===3/8)},
    { title: 'Munch answers equal to 6', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'3÷(1/2)', ()=>'5÷(1/3)', v=>safeEval(String(v))===6)},
    { title: 'Munch sums equal to 1', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'1/2+1/2', ()=>'3/4+1/3', v=>safeEval(String(v))===1)},
    { title: 'Munch values equal to 0.75', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>['3/4', '75%'][getRandomInt(0,1)], ()=>'2/5', v=>safeEval(String(v))===0.75)},
    { title: 'Munch ratios equal to 2:3', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'4:6', ()=>'5:7', v=>{const [a,b]=String(v).split(':').map(Number); return a/b === 2/3})},
    { title: 'Munch answers equal to 20% of 60', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>[12, '0.2×60'][getRandomInt(0,1)], ()=>15, v=>safeEval(String(v))===12)},
    { title: 'Munch answers equal to 25', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'5**2', ()=>'2**3', v=>safeEval(String(v))===25)},
    { title: 'Munch equations equal to 17', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'2**3+9', ()=>'(5+3)**2-47', v=>safeEval(String(v))===17)},
    { title: 'Munch sums equal to -3', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'-5+2', ()=>'-2+3', v=>safeEval(String(v))===-3)},
    { title: 'Munch equations with x=6', gridSize: 6, generateGrid: () => generateChallengeGrid(()=>'x+4=10', ()=>'x-3=10', v=>{const [p,a]=String(v).replace('x','6').split('='); return safeEval(p)===Number(a)})},
];
