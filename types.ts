
export enum SimulationMode {
  ELECTRIC = 'ELECTRIC',
  MAGNETIC = 'MAGNETIC',
  DYNAMIC = 'DYNAMIC'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Charge {
  id: string;
  x: number;
  y: number;
  q: number; // Điện tích (microCoulombs)
  vx: number; // Vận tốc x
  vy: number; // Vận tốc y
  mass: number; // Khối lượng (giả định)
}

export interface Wire {
  id: string;
  x: number;
  y: number;
  i: number; 
}

export interface SimSettings {
  showGrid: boolean;
  showVectors: boolean;
  fieldLineDensity: number;
  stepSize: number;
  showMouseVector: boolean;
  intensityColoring: boolean;
  isPaused: boolean;
}
