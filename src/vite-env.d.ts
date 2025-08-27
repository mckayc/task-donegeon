// Fix: Removed reference to "vite/client" to resolve a type definition error.
// The module declaration for "*.md?raw" is sufficient for the project's usage of Vite features.

declare module '*.md?raw' {
  const content: string;
  export default content;
}
