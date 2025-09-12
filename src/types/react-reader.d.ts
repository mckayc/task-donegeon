
declare module 'react-reader' {
  import * as React from 'react';

  export interface NavItem {
    id: string;
    href: string;
    label: string;
    subitems?: NavItem[];
  }

  export interface Rendition {
    display: (target?: string | number) => Promise<void>;
    next: () => Promise<void>;
    prev: () => Promise<void>;
    goTo: (href: string) => Promise<void>;
    themes: {
      override: (name: string, value: string) => void;
    };
  }

  export interface ReactReaderProps {
    url: string | ArrayBuffer;
    title?: string;
    location?: string | number;
    locationChanged?: (epubcifi: string) => void;
    tocChanged?: (toc: NavItem[]) => void;
    styles?: object;
    epubViewStyles?: object;
    loadingView?: React.ReactNode;
    getRendition?: (rendition: Rendition) => void;
  }

  export const ReactReader: React.FC<ReactReaderProps>;
  // FIX: Correctly typed the ReactReaderStyle object to allow for property access, resolving multiple type errors.
  export const ReactReaderStyle: any;
}
