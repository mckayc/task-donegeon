// FIX: This line can cause errors in environments where Vite types are not correctly resolved.
// Commenting it out to fix the "Cannot find type definition file for 'vite/client'" error.
// /// <reference types="vite/client" />

// The module declaration for "*.md?raw" is sufficient for the project's usage of Vite features.

declare module '*.md?raw' {
  const content: string;
  export default content;
}
