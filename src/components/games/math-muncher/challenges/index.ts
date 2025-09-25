export const gradeManifest: Record<string, { name: string; import: () => Promise<{ challenges: any[] }> }> = {
    "grade-1": { name: "1st Grade", import: () => import('./grade1') },
    "grade-2": { name: "2nd Grade", import: () => import('./grade2') },
    "grade-3": { name: "3rd Grade", import: () => import('./grade3') },
    "grade-4": { name: "4th Grade", import: () => import('./grade4') },
    "grade-5": { name: "5th Grade", import: () => import('./grade5') },
    "grade-6": { name: "6th Grade", import: () => import('./grade6') },
};
