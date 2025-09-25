import { Cell, CellValue } from "./types";

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
    if (num <= 3) return true;
    if (num % 2 === 0 || num % 3 === 0) return false;
    for (let i = 5; i * i <= num; i = i + 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
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
    if (denominator === 0) return [numerator, denominator];
    const commonDivisor = gcd(numerator, denominator);
    return [numerator / commonDivisor, denominator / commonDivisor];
};


/**
 * Fills a 5x5 grid with a mix of correct and incorrect answers, preventing infinite loops.
 * @param correctGenerator A function that returns a correct value.
 * @param incorrectGenerator A function that returns an incorrect value.
 * @param checker A function to verify if a value is correct.
 * @returns A 2D array of Cells.
 */
export const generateChallengeGrid = (
    correctGenerator: () => CellValue,
    incorrectGenerator: () => CellValue,
    checker: (val: CellValue) => boolean
): Cell[][] => {
    const gridSize = 5;
    const totalCells = gridSize * gridSize;
    const targetCorrect = Math.floor(totalCells * 0.4); // ~40% correct answers

    const values: { value: CellValue, isCorrect: boolean }[] = [];
    const usedValues = new Set<string>();
    const MAX_TOTAL_ATTEMPTS = 500;
    let totalAttempts = 0;

    // 1. Generate unique correct values
    while (values.filter(v => v.isCorrect).length < targetCorrect && totalAttempts < MAX_TOTAL_ATTEMPTS) {
        const value = correctGenerator();
        if (!usedValues.has(String(value)) && checker(value)) {
            values.push({ value, isCorrect: true });
            usedValues.add(String(value));
        }
        totalAttempts++;
    }

    // 2. Fill the rest with unique incorrect values
    while (values.length < totalCells && totalAttempts < MAX_TOTAL_ATTEMPTS) {
        const value = incorrectGenerator();
        if (!usedValues.has(String(value)) && !checker(value)) {
            values.push({ value, isCorrect: false });
            usedValues.add(String(value));
        }
        totalAttempts++;
    }
    
    // 3. Fallback: If generators struggled, fill remaining cells to ensure grid is full.
    while (values.length < totalCells) {
        let fallbackValue: CellValue;
        let isCorrect: boolean;
        let fallbackAttempts = 0;
        do {
            fallbackValue = Math.random() > 0.5 ? correctGenerator() : incorrectGenerator();
            isCorrect = checker(fallbackValue);
            fallbackAttempts++;
        } while (usedValues.has(String(fallbackValue)) && fallbackAttempts < 50);
        
        values.push({ value: fallbackValue, isCorrect });
        usedValues.add(String(fallbackValue));
    }

    if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
        console.warn("generateChallengeGrid reached max attempts. The grid may not be perfectly balanced.");
    }

    // 4. Shuffle and build the grid
    const shuffledValues = shuffleArray(values);
    const grid: Cell[][] = Array.from({ length: gridSize }, () => Array(gridSize));
    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        grid[row][col] = { ...shuffledValues[i], isEaten: false };
    }
    
    return grid;
};
