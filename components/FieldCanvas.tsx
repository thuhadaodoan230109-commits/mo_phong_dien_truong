
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SimulationMode, Charge, Wire, SimSettings, Vector2D } from '../types';
import { getElectricFieldAt, getMagneticFieldAt, normalize, magnitude } from '../services/physicsEngine';

interface FieldCanvasProps {
  mode: SimulationMode;
  charges: Charge[];
  wires: Wire[];
  settings: SimSettings;
  onUpdateElementPosition: (id: string, x: number, y: number) => void;
}

const FieldCanvas: React.FC<FieldCanvasProps> = ({
  mode, charges, wires, settings, onUpdateElementPosition
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Vector2D | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (settings.showGrid) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    }

    const getFieldAt = (p: Vector2D) => {
      if (mode === SimulationMode.MAGNETIC) return getMagneticFieldAt(p, wires);
      return getElectricFieldAt(p, charges);
    };

    // 1. Vẽ lưới vector (Chỉ khi không ở chế độ Dynamic)
    if (settings.showVectors && mode !== SimulationMode.DYNAMIC) {
      const spacing = 40;
      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          const field = getFieldAt({ x, y });
          const mag = magnitude(field);
          if (mag < 0.1) continue;
          const dir = normalize(field);
          const arrowLen = Math.min(15, mag * 0.1);
          ctx.strokeStyle = `hsla(${200 + Math.min(160, mag * 0.5)}, 80%, 60%, 0.3)`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + dir.x * arrowLen, y + dir.y * arrowLen);
          ctx.stroke();
        }
      }
    }

    // 2. Vẽ đường sức điện/từ
    if (mode !== SimulationMode.DYNAMIC && settings.fieldLineDensity > 0) {
      const sources = mode === SimulationMode.ELECTRIC ? charges : wires;
      ctx.lineWidth = 1;
      const traceLine = (start: Vector2D, direction: number) => {
        let p = { ...start };
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        for (let i = 0; i < 300; i++) {
          const field = getFieldAt(p);
          const mag = magnitude(field);
          if (mag < 0.1) break;
          const dir = normalize(field);
          p.x += dir.x * settings.stepSize * direction;
          p.y += dir.y * settings.stepSize * direction;
          ctx.lineTo(p.x, p.y);
          let tooClose = false;
          for (const s of sources) {
            const d = (p.x-s.x)**2 + (p.y-s.y)**2;
            if (d < 100) { tooClose = true; break; }
          }
          if (tooClose) break;
          if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) break;
        }
        ctx.stroke();
      };

      if (mode === SimulationMode.ELECTRIC) {
        charges.forEach(charge => {
          ctx.strokeStyle = charge.q > 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
          for (let i = 0; i < settings.fieldLineDensity; i++) {
            const angle = (i / settings.fieldLineDensity) * Math.PI * 2;
            traceLine({ x: charge.x + Math.cos(angle)*10, y: charge.y + Math.sin(angle)*10 }, charge.q > 0 ? 1 : -1);
          }
        });
      } else {
        wires.forEach(wire => {
           ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
           for (let r = 30; r < 200; r += 40) {
             for (let i = 0; i < 4; i++) {
                const angle = (i/4) * Math.PI * 2;
                traceLine({ x: wire.x + Math.cos(angle)*r, y: wire.y + Math.sin(angle)*r }, wire.i > 0 ? 1 : -1);
             }
           }
        });
      }
    }

    // 3. Xử lý logic và vẽ riêng cho chế độ DYNAMIC
    if (mode === SimulationMode.DYNAMIC) {
      // Vẽ các vector lực (Force Vectors)
      charges.forEach((c1, i) => {
        let netFx = 0;
        let netFy = 0;
        
        charges.forEach((c2, j) => {
          if (i === j) return;
          const dx = c1.x - c2.x;
          const dy = c1.y - c2.y;
          const r2 = Math.max(dx * dx + dy * dy, 625);
          const r = Math.sqrt(r2);
          
          // Tính lực từ c2 lên c1
          const fMag = (9e3 * c1.q * c2.q) / r2;
          const fx = fMag * (dx / r);
          const fy = fMag * (dy / r);
          netFx += fx;
          netFy += fy;

          // Vẽ đường nối mờ
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = (c1.q * c2.q > 0) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(c2.x, c2.y);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Vẽ vector lực tổng hợp (Force Vector)
        const forceMag = Math.sqrt(netFx**2 + netFy**2);
        if (forceMag > 0.5) {
          const forceDir = { x: netFx / forceMag, y: netFy / forceMag };
          const arrowLen = Math.min(60, forceMag * 0.8);
          
          // Màu sắc dựa trên hướng lực tổng hợp
          ctx.strokeStyle = '#fbbf24'; // Màu vàng cho lực
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(c1.x, c1.y);
          ctx.lineTo(c1.x + forceDir.x * arrowLen, c1.y + forceDir.y * arrowLen);
          ctx.stroke();

          // Vẽ đầu mũi tên
          const angle = Math.atan2(forceDir.y, forceDir.x);
          const head = 8;
          ctx.beginPath();
          ctx.moveTo(c1.x + forceDir.x * arrowLen, c1.y + forceDir.y * arrowLen);
          ctx.lineTo(c1.x + forceDir.x * arrowLen - head * Math.cos(angle - Math.PI/6), c1.y + forceDir.y * arrowLen - head * Math.sin(angle - Math.PI/6));
          ctx.lineTo(c1.x + forceDir.x * arrowLen - head * Math.cos(angle + Math.PI/6), c1.y + forceDir.y * arrowLen - head * Math.sin(angle + Math.PI/6));
          ctx.closePath();
          ctx.fillStyle = '#fbbf24';
          ctx.fill();

          // Hiển thị nhãn lực "F"
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Inter';
          ctx.fillText('F⃗', c1.x + forceDir.x * (arrowLen + 10), c1.y + forceDir.y * (arrowLen + 10));
        }
      });
    }

    // 4. Vẽ các thực thể (Hạt điện tích / Dây dẫn)
    const items = mode === SimulationMode.MAGNETIC ? wires : charges;
    items.forEach(item => {
      const val = mode === SimulationMode.MAGNETIC ? (item as Wire).i : (item as Charge).q;
      const isPos = val > 0;
      
      ctx.shadowBlur = draggingId === item.id ? 25 : 15;
      ctx.shadowColor = isPos ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      ctx.fillStyle = isPos ? '#3b82f6' : '#ef4444';
      ctx.beginPath(); ctx.arc(item.x, item.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = draggingId === item.id ? '#fff' : 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2; ctx.stroke();
      
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(isPos ? '+' : '-', item.x, item.y);
    });

    // 5. Probe Vector (Khi di chuột)
    if (settings.showMouseVector && mousePos && mode !== SimulationMode.DYNAMIC) {
      const field = getFieldAt(mousePos);
      const mag = magnitude(field);
      if (mag > 0.1) {
        const dir = normalize(field);
        const len = Math.min(80, mag * 1.5);
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(mousePos.x, mousePos.y); ctx.lineTo(mousePos.x + dir.x * len, mousePos.y + dir.y * len); ctx.stroke();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'; ctx.font = '11px monospace';
        ctx.fillText(`${mag.toFixed(1)} unit`, mousePos.x + 5, mousePos.y - 12);
      }
    }
  }, [mode, charges, wires, settings, mousePos, draggingId]);

  useEffect(() => {
    draw();
    let frameId: number;
    const loop = () => {
      if (mode === SimulationMode.DYNAMIC && !settings.isPaused) draw();
      frameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frameId);
  }, [draw, mode, settings.isPaused]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const items = mode === SimulationMode.MAGNETIC ? wires : charges;
    const clicked = items.find(s => (s.x - x)**2 + (s.y - y)**2 < 625); // Bán kính tương tác 25px
    if (clicked) setDraggingId(clicked.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    if (draggingId) onUpdateElementPosition(draggingId, x, y);
  };

  return (
    <div className="flex-1 relative cursor-crosshair">
      <canvas ref={canvasRef} className="w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setDraggingId(null)} onMouseLeave={() => setDraggingId(null)} />
      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-700 text-[10px] text-slate-300 pointer-events-none uppercase tracking-widest font-mono shadow-xl">
        {mode === SimulationMode.DYNAMIC ? 'Simulation: Active Newton-Coulomb (Slow-Mo)' : 'Mode: Field Visualization'}
      </div>
    </div>
  );
};

export default FieldCanvas;
