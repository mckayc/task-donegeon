import { Cell, CellValue } from "./MathMuncherTypes";

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const isPrime = (num: number): boolean => {
    if (num <= 1) return false;
    for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
    }
    return true;
};

export const getFactors = (num: number): number[] => {
    const factors = new Set<number>();
    for (let i = 1; i * i <= num; i++) {
        if (num % i === 0) {
            factors.add(i);
            factors.add(num / i);
        }
    }
    return Array.from(factors);
};

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

export const getGCF = (a: number, b: number): number => gcd(a, b);

export const getLCM = (a: number, b: number): number => (a * b) / gcd(a, b);

export const simplifyFraction = (numerator: number, denominator: number): [number, number] => {
    const commonDivisor = gcd(numerator, denominator);
    return [numerator / commonDivisor, denominator / commonDivisor];
};


/**
 * Fills a grid with a mix of correct and incorrect answers.
 * @param gridSize The size of the grid (e.g., 6 for 6x6).
 * @param correctGenerator A function that returns a correct value.
 * @param incorrectGenerator A function that returns an incorrect value.
 * @param checker A function to double-check that incorrect values are not accidentally correct.
 * @returns A 2D array of Cells.
 */
export const generateChallengeGrid = (
    gridSize: 6 | 12,
    correctGenerator: () => CellValue,
    incorrectGenerator: () => CellValue,
    checker: (val: CellValue) => boolean
): Cell[][] => {
    const grid: Cell[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
    const totalCells = gridSize * gridSize;
    const targetCorrect = Math.floor(totalCells * 0.4);

    const allPositions: { r: number, c: number }[] = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            allPositions.push({ r, c });
        }
    }
    shuffleArray(allPositions);

    // Fill with correct answers
    for (let i = 0; i < targetCorrect; i++) {
        const pos = allPositions[i];
        if (!pos) continue;
        let value: CellValue;
        do {
            value = correctGenerator();
        } while (!checker(value)); // Ensure generator is correct
        grid[pos.r][pos.c] = { value, isCorrect: true, isEaten: false };
    }

    // Fill the rest with incorrect answers
    for (let i = targetCorrect; i < totalCells; i++) {
        const pos = allPositions[i];
        if (!pos) continue;
        let value: CellValue;
        do {
            value = incorrectGenerator();
        } while (checker(value)); // Ensure generator is actually incorrect
        grid[pos.r][pos.c] = { value, isCorrect: false, isEaten: false };
    }

    return grid;
};

/**
 * Generates a simple number grid.
 */
export const generateSimpleNumberGrid = (
    gridSize: 6 | 12,
    checker: (n: number) => boolean,
    range: [number, number],
    isFloat: boolean = false
): Cell[][] => {
    const correctGen = () => {
        let num;
        do { num = getRandomInt(range[0], range[1]); } while (!checker(num));
        return num;
    };
    const incorrectGen = () => {
        let num;
        do { num = getRandomInt(range[0], range[1]); } while (checker(num));
        return num;
    };
    return generateChallengeGrid(gridSize, correctGen, incorrectGen, (v) => checker(v as number));
};
