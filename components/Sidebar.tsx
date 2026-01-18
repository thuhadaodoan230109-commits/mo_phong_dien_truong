
import React from 'react';
import { SimulationMode, Charge, Wire, SimSettings } from '../types';

interface SidebarProps {
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  charges: Charge[];
  wires: Wire[];
  settings: SimSettings;
  updateSettings: (s: Partial<SimSettings>) => void;
  onAdd: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  onUpdateValue: (id: string, value: number) => void;
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  mode, setMode, charges, wires, settings, updateSettings, onAdd, onClear, onRemove, onUpdateValue, onReset
}) => {
  const items = mode === SimulationMode.MAGNETIC ? wires : charges;

  return (
    <div className="w-80 bg-slate-900 h-screen flex flex-col border-r border-slate-700 shadow-2xl z-10 overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          PhysiField Lab
        </h1>
        <p className="text-slate-400 text-xs mt-1">Physics Simulation System</p>
      </div>

      <div className="grid grid-cols-1 gap-1 p-4 bg-slate-950/50 m-4 rounded-lg">
        <div className="flex gap-1">
          <button
            onClick={() => setMode(SimulationMode.ELECTRIC)}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold transition-all ${
              mode === SimulationMode.ELECTRIC ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            ELECTRIC FIELD
          </button>
          <button
            onClick={() => setMode(SimulationMode.MAGNETIC)}
            className={`flex-1 py-2 px-1 rounded-md text-[10px] font-bold transition-all ${
              mode === SimulationMode.MAGNETIC ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            MAGNETIC FIELD
          </button>
        </div>
        <button
          onClick={() => setMode(SimulationMode.DYNAMIC)}
          className={`w-full py-2 px-3 rounded-md text-[10px] font-bold transition-all mt-1 ${
            mode === SimulationMode.DYNAMIC ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <i className="fa-solid fa-play-circle mr-2"></i>
          COULOMB DYNAMICS
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-6 text-slate-100">
        {mode === SimulationMode.DYNAMIC && (
          <section className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
             <h3 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-widest">Simulation Control</h3>
             <div className="flex gap-2">
                <button 
                  onClick={() => updateSettings({ isPaused: !settings.isPaused })}
                  className={`flex-1 py-2 rounded font-bold text-xs transition-colors ${settings.isPaused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                >
                  {settings.isPaused ? 'RESUME' : 'PAUSE'}
                </button>
                <button 
                  onClick={onReset}
                  className="px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors"
                  title="Reset Simulation"
                >
                  <i className="fa-solid fa-rotate-right"></i>
                </button>
             </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Elements</h3>
            <div className="flex gap-2">
              <button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-500 p-1.5 rounded text-xs transition-colors">
                <i className="fa-solid fa-plus mr-1"></i> Add
              </button>
              <button onClick={onClear} className="bg-red-600/20 hover:bg-red-600 p-1.5 rounded text-xs text-red-400 hover:text-white transition-colors border border-red-900/50">
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                <i className="fa-solid fa-atom text-3xl mb-2 block"></i>
                <p className="text-sm italic">Canvas empty</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-all group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {mode === SimulationMode.MAGNETIC ? 'Current' : 'Charge Unit'}
                    </span>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      (mode === SimulationMode.MAGNETIC ? (item as Wire).i : (item as Charge).q) > 0 
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-red-600/20 text-red-400 border border-red-500/30'
                    }`}>
                      {(mode === SimulationMode.MAGNETIC ? (item as Wire).i : (item as Charge).q) > 0 ? '+' : '-'}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="range" 
                        min="-20" max="20" step="1"
                        value={mode === SimulationMode.MAGNETIC ? (item as Wire).i : (item as Charge).q}
                        onChange={(e) => onUpdateValue(item.id, parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-500">Value</span>
                        <span className="text-xs font-mono text-slate-200">
                          {mode === SimulationMode.MAGNETIC ? (item as Wire).i : (item as Charge).q} 
                          {mode === SimulationMode.MAGNETIC ? ' A' : ' μC'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="pt-4 border-t border-slate-800">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-sm text-slate-300">Display Grid</span>
              <input 
                type="checkbox" 
                checked={settings.showGrid}
                onChange={(e) => updateSettings({ showGrid: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
              />
            </label>
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-sm text-slate-300">Show Field Lines</span>
              <input 
                type="checkbox" 
                checked={settings.fieldLineDensity > 0}
                onChange={(e) => updateSettings({ fieldLineDensity: e.target.checked ? 16 : 0 })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
              />
            </label>
            <label className="flex items-center justify-between group cursor-pointer">
              <span className="text-sm text-slate-300">Show Vectors</span>
              <input 
                type="checkbox" 
                checked={settings.showVectors}
                onChange={(e) => updateSettings({ showVectors: e.target.checked })}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
              />
            </label>
          </div>
        </section>
      </div>
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-[9px] text-slate-600 text-center uppercase tracking-widest leading-loose">
        Coulomb's Law: F = k·|q1q2|/r²<br/>
        Grade 11 Physics Curriculum
      </div>
    </div>
  );
};

export default Sidebar;
