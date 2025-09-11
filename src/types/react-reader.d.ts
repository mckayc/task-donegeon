// src/types/react-reader.d.ts

declare module 'react-reader' {
  import * as React from 'react';

  // This is a partial definition to satisfy the compiler based on current usage.
  // The actual library may have more properties.
  export const ReactReaderStyle: {
    container: React.CSSProperties;
    readerArea: React.CSSProperties;
    arrow: React.CSSProperties;
    arrowHover: React.CSSProperties;
    titleArea: React.CSSProperties;
    tocArea: React.CSSProperties;
    tocButton: React.CSSProperties;
    tocButtonExpanded: React.CSSProperties;
    loadingView: React.CSSProperties;
    [key: string]: React.CSSProperties | undefined;
  };
  
  export interface ReactReaderProps {
    url: string | ArrayBuffer;
    title?: string;
    location?: string | number;
    locationChanged?: (epubcifi: string) => void;
    tocChanged?: (toc: any[]) => void;
    styles?: Partial<typeof ReactReaderStyle>;
    showToc?: boolean;
    loadingView?: React.ReactNode;
    epubOptions?: object;
    getRendition?: (rendition: any) => void;
  }

  const ReactReader: React.ComponentType<ReactReaderProps>;
  export default ReactReader;
}
