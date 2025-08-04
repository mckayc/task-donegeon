import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { Duty, DutySchema, Venture, VentureSchema } from '../schemas/assetSchemas';

const ASSETS_PATH = path.join((process as any).cwd(), 'assets');

// In-memory cache for our assets
const assetCache = {
    duties: null as Duty[] | null,
    ventures: null as Venture[] | null,
};

async function loadAndValidateAssets<T>(directory: string, schema: z.ZodType<T>): Promise<T[]> {
    const dirPath = path.join(ASSETS_PATH, directory);
    const results: T[] = [];
    try {
        const files = await fs.readdir(dirPath);
        for (const file of files) {
            if (path.extname(file) === '.json') {
                const filePath = path.join(dirPath, file);
                try {
                    const fileContent = await fs.readFile(filePath, 'utf-8');
                    const jsonData = JSON.parse(fileContent);
                    const validationResult = schema.safeParse(jsonData);
                    if (validationResult.success) {
                        results.push(validationResult.data);
                    } else {
                        console.error(`Validation failed for ${file}:`, validationResult.error.issues);
                    }
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                }
            }
        }
    } catch (error: any) {
        // If directory doesn't exist, it's not a critical error, just means no assets of that type.
        if (error.code !== 'ENOENT') {
            console.error(`Error reading asset directory ${directory}:`, error);
        }
    }
    return results;
}

export async function getDuties(): Promise<Duty[]> {
    if (assetCache.duties === null) {
        assetCache.duties = await loadAndValidateAssets('quests/duties', DutySchema);
    }
    return assetCache.duties;
}

export async function getVentures(): Promise<Venture[]> {
    if (assetCache.ventures === null) {
        assetCache.ventures = await loadAndValidateAssets('quests/ventures', VentureSchema);
    }
    return assetCache.ventures;
}

export async function initializeAssets() {
    console.log('Initializing and caching game assets...');
    await getDuties();
    await getVentures();
    console.log('Assets initialized.');
}

export function refreshAssets() {
    console.log('Refreshing game assets...');
    assetCache.duties = null;
    assetCache.ventures = null;
    // Immediately re-initialize after clearing cache
    initializeAssets();
}