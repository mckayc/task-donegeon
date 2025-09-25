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
    { title: 'Munch products equal to 1,764', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'42×42', ()=>'30×60', v=>safeEval(String(v)) === 1764)},
    { title: 'Munch facts equal to 24', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'72÷3', ()=>'65÷2', v=>safeEval(String(v)) === 24)},
    { title: 'Munch fractions equal to 7/8', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'3/8+4/8', ()=>'2/8+2/8', v=>safeEval(String(v)) === 7/8)},
    { title: 'Munch fractions equal to 2/3', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'4/6', ()=>'8/12', v=>safeEval(String(v)) === 2/3)},
    { title: 'Munch fractions equal to 2 1/2', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'5/2', ()=>'9/5', v=>safeEval(String(v)) === 2.5)},
    { title: 'Munch sums equal to 1.25', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'0.75+0.50', ()=>'0.60+0.70', v=>safeEval(String(v)) === 1.25)},
    { title: 'Munch numbers equal to 25% of 100', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>[25, '1/4'][getRandomInt(0,1)], ()=>[50,75][getRandomInt(0,1)], v=>safeEval(String(v).replace('%','/100')) === 25)},
    { title: 'Munch equations equal to 14', gridSize: 5, generateGrid: () => generateChallengeGrid(()=>'(2+5)×2', ()=>'3+4×2', v=>safeEval(String(v))===14)},
    { title: 'Munch GCF of 12 and 18', gridSize: 5, generateGrid: () => generateChallengeGrid(() => [3,6][getRandomInt(0,1)], () => 5, v => 12 % (v as number) === 0 && 18 % (v as number) === 0)},
    { title: 'Munch LCM of 3 and 4', gridSize: 5, generateGrid: () => generateChallengeGrid(() => [12,24][getRandomInt(0,1)], () => 9, v => (v as number) % 3 === 0 && (v as number) % 4 === 0)},
];
