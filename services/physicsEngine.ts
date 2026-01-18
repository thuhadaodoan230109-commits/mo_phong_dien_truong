
import { Vector2D, Charge, Wire } from '../types';

const K = 9e3; // Hằng số Coulomb đã scale
const MU0_2PI = 2; // µ0 / 2π
const FRICTION = 0.98; // Tăng lực cản một chút để chuyển động chậm và ổn định hơn

export const getElectricFieldAt = (point: Vector2D, charges: Charge[]): Vector2D => {
  let totalE: Vector2D = { x: 0, y: 0 };
  for (const charge of charges) {
    const dx = point.x - charge.x;
    const dy = point.y - charge.y;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2);
    if (r < 15) continue; 
    const mag = (K * charge.q) / r2;
    totalE.x += mag * (dx / r);
    totalE.y += mag * (dy / r);
  }
  return totalE;
};

export const getMagneticFieldAt = (point: Vector2D, wires: Wire[]): Vector2D => {
  let totalB: Vector2D = { x: 0, y: 0 };
  for (const wire of wires) {
    const dx = point.x - wire.x;
    const dy = point.y - wire.y;
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2);
    if (r < 10) continue;
    const mag = (MU0_2PI * wire.i) / r;
    totalB.x += mag * (-dy / r);
    totalB.y += mag * (dx / r);
  }
  return totalB;
};

/**
 * Tính toán tổng lực Coulomb tác động lên từng điện tích (Cập nhật chậm hơn)
 */
export const calculateCoulombDynamics = (charges: Charge[], width: number, height: number): Charge[] => {
  const dt = 0.08; // Giảm dt từ 0.15 xuống 0.08 để chuyển động chậm lại
  const updatedCharges = charges.map(c => ({ ...c }));

  for (let i = 0; i < updatedCharges.length; i++) {
    let fx = 0;
    let fy = 0;
    const c1 = updatedCharges[i];

    for (let j = 0; j < updatedCharges.length; j++) {
      if (i === j) continue;
      const c2 = updatedCharges[j];

      const dx = c1.x - c2.x;
      const dy = c1.y - c2.y;
      const r2 = Math.max(dx * dx + dy * dy, 625); // Giới hạn khoảng cách tối thiểu r=25px để tránh lực quá mạnh
      const r = Math.sqrt(r2);

      // F = k * q1 * q2 / r^2
      const fMag = (K * c1.q * c2.q) / r2;
      
      fx += fMag * (dx / r);
      fy += fMag * (dy / r);
    }

    // Cập nhật vận tốc
    c1.vx = (c1.vx + (fx / 12) * dt) * FRICTION;
    c1.vy = (c1.vy + (fy / 12) * dt) * FRICTION;

    // Cập nhật vị trí
    c1.x += c1.vx * dt;
    c1.y += c1.vy * dt;

    // Va chạm biên mượt mà
    if (c1.x < 30) { c1.x = 30; c1.vx *= -0.5; }
    if (c1.x > width - 30) { c1.x = width - 30; c1.vx *= -0.5; }
    if (c1.y < 30) { c1.y = 30; c1.vy *= -0.5; }
    if (c1.y > height - 30) { c1.y = height - 30; c1.vy *= -0.5; }
  }

  return updatedCharges;
};

export const normalize = (v: Vector2D): Vector2D => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};

export const magnitude = (v: Vector2D): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};
