
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import FieldCanvas from './components/FieldCanvas';
import { SimulationMode, Charge, Wire, SimSettings } from './types';
import { calculateCoulombDynamics } from './services/physicsEngine';

const INITIAL_CHARGES: Charge[] = [
  { id: '1', x: 250, y: 300, q: 15, vx: 0, vy: 0, mass: 10 },
  { id: '2', x: 550, y: 300, q: -15, vx: 0, vy: 0, mass: 10 }
];

const INITIAL_WIRES: Wire[] = [
  { id: 'w1', x: 400, y: 300, i: 10 }
];

const DEFAULT_SETTINGS: SimSettings = {
  showGrid: true,
  showVectors: true,
  fieldLineDensity: 16,
  stepSize: 2,
  showMouseVector: true,
  intensityColoring: true,
  isPaused: false
};

const App: React.FC = () => {
  const [mode, setMode] = useState<SimulationMode>(SimulationMode.ELECTRIC);
  const [charges, setCharges] = useState<Charge[]>(INITIAL_CHARGES);
  const [wires, setWires] = useState<Wire[]>(INITIAL_WIRES);
  const [settings, setSettings] = useState<SimSettings>(DEFAULT_SETTINGS);

  // Vòng lặp mô phỏng chính cho chế độ Dynamic
  useEffect(() => {
    if (mode !== SimulationMode.DYNAMIC || settings.isPaused) return;

    const interval = setInterval(() => {
      setCharges(prev => calculateCoulombDynamics(prev, window.innerWidth - 320, window.innerHeight));
    }, 16);

    return () => clearInterval(interval);
  }, [mode, settings.isPaused]);

  const handleAdd = useCallback(() => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = 150 + Math.random() * 400;
    const y = 100 + Math.random() * 400;
    
    if (mode === SimulationMode.MAGNETIC) {
      setWires(prev => [...prev, { id, x, y, i: 10 }]);
    } else {
      setCharges(prev => [...prev, { id, x, y, q: 10, vx: 0, vy: 0, mass: 10 }]);
    }
  }, [mode]);

  const handleClear = useCallback(() => {
    if (mode === SimulationMode.MAGNETIC) setWires([]);
    else setCharges([]);
  }, [mode]);

  const handleRemove = useCallback((id: string) => {
    if (mode === SimulationMode.MAGNETIC) {
      setWires(prev => prev.filter(w => w.id !== id));
    } else {
      setCharges(prev => prev.filter(c => c.id !== id));
    }
  }, [mode]);

  const handleUpdateValue = useCallback((id: string, value: number) => {
    if (mode === SimulationMode.MAGNETIC) {
      setWires(prev => prev.map(w => w.id === id ? { ...w, i: value } : w));
    } else {
      setCharges(prev => prev.map(c => c.id === id ? { ...c, q: value } : c));
    }
  }, [mode]);

  const handleUpdatePosition = useCallback((id: string, x: number, y: number) => {
    if (mode === SimulationMode.MAGNETIC) {
      setWires(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
    } else {
      setCharges(prev => prev.map(c => c.id === id ? { ...c, x, y, vx: 0, vy: 0 } : c));
    }
  }, [mode]);

  const handleReset = useCallback(() => {
    setCharges(INITIAL_CHARGES.map(c => ({ ...c })));
    setWires(INITIAL_WIRES.map(w => ({ ...w })));
    setSettings(prev => ({ ...prev, isPaused: false }));
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar 
        mode={mode}
        setMode={setMode}
        charges={charges}
        wires={wires}
        settings={settings}
        updateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
        onAdd={handleAdd}
        onClear={handleClear}
        onRemove={handleRemove}
        onUpdateValue={handleUpdateValue}
        onReset={handleReset}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="absolute top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center pointer-events-none">
          <div className="bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-4 pointer-events-auto shadow-2xl">
             <div className="flex items-center gap-2">
                <i className={`fa-solid ${mode === SimulationMode.ELECTRIC ? 'fa-bolt text-blue-400' : mode === SimulationMode.MAGNETIC ? 'fa-magnet text-indigo-400' : 'fa-atom text-emerald-400'}`}></i>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{mode} MODE</span>
             </div>
             <div className="w-px h-4 bg-slate-700"></div>
             <div className="text-[10px] text-slate-400 font-mono">
                {mode === SimulationMode.MAGNETIC ? `${wires.length} Wires` : `${charges.length} Charges`}
             </div>
          </div>
        </header>

        <FieldCanvas 
          mode={mode}
          charges={charges}
          wires={wires}
          settings={settings}
          onUpdateElementPosition={handleUpdatePosition}
        />

        <footer className="absolute bottom-6 left-6 z-10 pointer-events-none">
           <div className="bg-slate-950/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 shadow-2xl max-w-sm pointer-events-auto border-l-4 border-l-blue-500">
              <h4 className="text-[10px] font-bold text-blue-400 mb-1 uppercase tracking-widest">Kiến thức Vật lí 11</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {mode === SimulationMode.DYNAMIC 
                  ? "Hai điện tích cùng dấu đẩy nhau (F⃗ hướng ra ngoài), trái dấu hút nhau (F⃗ hướng vào trong). Lực tỷ lệ nghịch với r²."
                  : mode === SimulationMode.ELECTRIC 
                  ? "Đường sức điện xuất phát từ điện tích dương và kết thúc ở điện tích âm."
                  : "Sử dụng quy tắc nắm tay phải để xác định chiều của từ trường quanh dòng điện thẳng."}
              </p>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
