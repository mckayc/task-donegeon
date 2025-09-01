export interface Calculator {
  id: string;
  title: string;
  history: string;
}

export interface WindowState {
  id: string; // Corresponds to Calculator ID
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isOpen: boolean;
  isScientific: boolean;
}
