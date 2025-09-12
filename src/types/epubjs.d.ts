declare module 'epubjs' {
  export class Book {
    constructor(url: string, options?: any);
    renderTo(element: string | HTMLElement, options?: any): Rendition;
    ready: Promise<void>;
    locations: {
      generate(chars?: number): Promise<string[]>;
      percentageFromCfi(cfi: string): number;
      cfiFromPercentage(percentage: number): string;
    };
    navigation: {
      toc: {
        label: string;
        href: string;
      }[];
    };
    destroy(): void;
  }

  export interface Location {
    start: {
      cfi: string;
      displayed: {
        page: number;
        total: number;
      };
    };
    end: {
      cfi: string;
      displayed: {
        page: number;
        total: number;
      };
    };
  }

  export class Rendition {
    display(target?: string): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    on(event: string, callback: (location: Location) => void): void;
    themes: {
      register(name: string, styles: any): void;
      select(name: string): void;
      fontSize(size: string): void;
    };
    destroy(): void;
  }

  export default function ePub(url: string, options?: any): Book;
}
