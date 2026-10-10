import { formatVnd } from '@6pm/domain';

import { chipFlights } from '../data/flights';
import { odoStepAt, odoSteps } from '../data/odometer';
import { clamp01, ease } from '../data/seeded';

const flights = chipFlights();

/**
 * The leak: spends fly out of the dark towards the viewer while the month's total counts up, then
 * everything collapses into the centre for the "Stop.".
 */
export function drawLeak(scene: HTMLElement, k: number): void {
  const scale = Math.min(innerWidth, innerHeight) / 900;
  const fly = k < 0.62 ? 0.3 + (k / 0.62) * 0.7 : 1 + (Math.min(k, 0.72) - 0.62) * 0.2;
  const merge = ease(clamp01((k - 0.72) / 0.1));
  const fade = 1 - clamp01((k - 0.8) * 20);
  scene.querySelectorAll<HTMLElement>('[data-chip]').forEach((chip, i) => {
    const flight = flights[i];
    if (!flight) return;
    const u = (fly - flight.d) / 0.45;
    if (u <= 0 || u >= 1.1 || fade <= 0) {
      if (chip.style.opacity !== '0') chip.style.opacity = '0';
      return;
    }
    const spread = 1 - merge;
    const z = (-2800 + u * 3400) * spread;
    const x = Math.cos(flight.a) * flight.r * scale * spread;
    const y = Math.sin(flight.a) * flight.r * scale * 0.72 * spread;
    chip.style.opacity = (clamp01(u * 6) * clamp01((900 - z) / 300) * fade).toFixed(3);
    chip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(0)}px) rotate(${flight.ro * spread}deg) scale(${(1 - merge * 0.9).toFixed(3)})`;
  });
  const total = scene.querySelector('[data-leak-number]');
  if (total) {
    const text = formatVnd(Math.round((4217000 * ease(clamp01(k / 0.62))) / 1000) * 1000);
    if (total.textContent !== text) total.textContent = text;
  }
}

/** One number: the odometer rolls down through each line of the sum. */
export function drawOdometer(scene: HTMLElement, k: number): void {
  let value: number = odoSteps[0];
  odoStepAt.forEach((at, i) => {
    const next = odoSteps[i + 1] ?? value;
    value += (next - value) * ease(clamp01((k - at) / 0.1));
  });
  value = Math.round(value / 1000) * 1000;
  const digits = String(value).padStart(8, '0');
  const lead = digits.search(/[1-9]/);
  scene.querySelectorAll<HTMLElement>('[data-digit]').forEach((reel) => {
    const i = Number(reel.dataset['digit']);
    reel.style.transform = `translateY(${-Number(digits[i]) * 1.04}em)`;
    if (reel.parentElement) reel.parentElement.style.opacity = i < lead ? '0' : '1';
  });
  const millions = scene.querySelector<HTMLElement>('[data-dot="0"]');
  if (millions) millions.style.opacity = value >= 1e6 ? '1' : '0';
}

/** Thirty days stamp CLOSED one by one while Future you fills up. */
export function drawDiary(scene: HTMLElement, k: number): void {
  const stamps = scene.querySelectorAll<HTMLElement>('[data-stamp]');
  const progress = clamp01((k - 0.08) / 0.68);
  const stamped = Math.floor(progress * stamps.length + 0.001);
  stamps.forEach((stamp, i) => stamp.toggleAttribute('data-on', i < stamped));
  const saved = scene.querySelector('[data-saved]');
  if (saved) {
    const text = '+' + formatVnd(Math.round((2000000 * progress) / 1000) * 1000);
    if (saved.textContent !== text) saved.textContent = text;
  }
}
