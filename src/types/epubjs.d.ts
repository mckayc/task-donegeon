
declare module 'epubjs' {
  export interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  export interface Rendition {
    display: (target?: string) => Promise<void>;
    on: (event: string, callback: (location: any) => void) => void;
    next: () => Promise<void>;
    prev: () => Promise<void>;
  }

  export interface Book {
    ready: Promise<void>;
    navigation: {
      load: () => Promise<{ toc: NavItem[] }>;
    };
    renderTo: (element: HTMLElement | string, options: any) => Rendition;
    destroy: () => void;
  }

  export default function Epub(url: string | ArrayBuffer): Book;
}
