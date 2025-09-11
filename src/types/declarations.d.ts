
// This file tells TypeScript that modules for the EPUB reader exist,
// even though they are loaded via an import map and not from node_modules.
// This resolves the "Cannot find module" build error.

declare module 'readk-it';
declare module 'jszip';
