(() => {
"use strict";
const density = [[0.016, 0.015, 0.01, 0.009, 0.008, 0.008, 0.007, 0.006, 0.007, 0.004, 0.005, 0.002, 0.003, 0.01, 0.021, 0.016, 0.015, 0.021, 0.031, 0.03, 0.03, 0.041, 0.059, 0.048], [0.026, 0.013, 0.006, 0.006, 0.01, 0.015, 0.011, 0.004, 0.005, 0.004, 0, 0, 0.008, 0.016, 0.023, 0.021, 0.021, 0.027, 0.023, 0.026, 0.016, 0.024, 0.042, 0.036], [0.036, 0.02, 0.013, 0.018, 0.029, 0.03, 0.019, 0.009, 0.008, 0.005, 0.01, 0.022, 0.042, 0.049, 0.057, 0.056, 0.064, 0.045, 0.031, 0.018, 0.017, 0.032, 0.021, 0.028], [0.028, 0.032, 0.035, 0.045, 0.04, 0.033, 0.026, 0.02, 0.021, 0.04, 0.074, 0.124, 0.172, 0.185, 0.175, 0.168, 0.142, 0.114, 0.065, 0.04, 0.029, 0.024, 0.025, 0.029], [0.02, 0.032, 0.038, 0.016, 0.026, 0.014, 0.015, 0.042, 0.064, 0.101, 0.18, 0.286, 0.382, 0.463, 0.436, 0.361, 0.268, 0.183, 0.127, 0.069, 0.043, 0.039, 0.044, 0.031], [0.015, 0.021, 0.021, 0.029, 0.031, 0.015, 0.036, 0.132, 0.204, 0.261, 0.408, 0.6, 0.732, 0.752, 0.654, 0.583, 0.44, 0.33, 0.215, 0.116, 0.064, 0.053, 0.038, 0.026], [0.018, 0.02, 0.024, 0.038, 0.058, 0.097, 0.164, 0.299, 0.46, 0.61, 0.793, 0.942, 1, 0.887, 0.786, 0.688, 0.613, 0.461, 0.311, 0.163, 0.096, 0.045, 0.024, 0.016], [0.01, 0.014, 0.004, 0.008, 0.053, 0.11, 0.215, 0.403, 0.631, 0.806, 0.971, 0.974, 0.943, 0.883, 0.744, 0.655, 0.534, 0.462, 0.305, 0.185, 0.089, 0.038, 0.02, 0.014], [0.015, 0.016, 0.009, 0.022, 0.052, 0.146, 0.246, 0.391, 0.646, 0.835, 0.849, 0.754, 0.823, 0.791, 0.656, 0.472, 0.249, 0.243, 0.179, 0.132, 0.068, 0.031, 0.021, 0.018], [0.018, 0.017, 0.024, 0.033, 0.074, 0.138, 0.181, 0.356, 0.533, 0.637, 0.656, 0.635, 0.603, 0.527, 0.434, 0.301, 0.166, 0.074, 0.048, 0.037, 0.045, 0.029, 0.028, 0.025], [0.025, 0.032, 0.043, 0.058, 0.093, 0.141, 0.176, 0.278, 0.369, 0.411, 0.48, 0.47, 0.383, 0.311, 0.219, 0.141, 0.06, 0.026, 0.023, 0.031, 0.041, 0.043, 0.037, 0.044], [0.034, 0.045, 0.061, 0.097, 0.127, 0.13, 0.124, 0.191, 0.147, 0.162, 0.366, 0.376, 0.258, 0.186, 0.118, 0.067, 0.033, 0.022, 0.019, 0.027, 0.041, 0.04, 0.051, 0.059], [0.028, 0.015, 0.019, 0.046, 0.089, 0.133, 0.134, 0.154, 0.184, 0.242, 0.223, 0.222, 0.171, 0.142, 0.091, 0.056, 0.029, 0.015, 0.012, 0.012, 0.016, 0.019, 0.021, 0.025], [0.017, 0.006, 0.002, 0.026, 0.066, 0.081, 0.097, 0.087, 0.115, 0.14, 0.126, 0.101, 0.061, 0.037, 0.022, 0.021, 0.012, 0.008, 0.007, 0.003, 0.007, 0.008, 0.008, 0.012], [0.008, 0.007, 0.018, 0.028, 0.039, 0.036, 0.037, 0.059, 0.094, 0.085, 0.073, 0.038, 0.007, 0.003, 0.009, 0.01, 0.009, 0.008, 0.009, 0.002, 0.003, 0.004, 0.008, 0.008]];
const reveal = document.querySelector('[data-matter-reveal]');
if (!reveal) return;
const frame = reveal.querySelector('.matter-frame');
const x = { value: 50 };
const y = { value: 55 };
const full = reveal.querySelector('[data-matter-full]');
const sound = reveal.querySelector('[data-matter-sound]');
let audio, enabled = false, engaged = false;
function intensity() {
  const row = Math.min(density.length - 1, Math.round(Number(y.value) / 100 * (density.length - 1)));
  const col = Math.min(density[0].length - 1, Math.round(Number(x.value) / 100 * (density[0].length - 1)));
  return Math.pow(density[row][col], .58);
}
function updateSound() {
  if (!audio) return;
  const strength = intensity();
  audio.gain.gain.setTargetAtTime(enabled && engaged && !document.hidden ? .018 + strength * .16 : 0, audio.context.currentTime, .12);
  audio.osc.frequency.setTargetAtTime(95 + strength * 1050, audio.context.currentTime, .055);
}
function update() {
  frame.style.setProperty('--matter-x', `${x.value}%`);
  frame.style.setProperty('--matter-y', `${y.value}%`);
  updateSound();
}
function move(event) {
  if (event.pointerType === 'touch' && !frame.hasPointerCapture(event.pointerId)) return;
  const box = frame.getBoundingClientRect();
  x.value = String(Math.max(0, Math.min(100, (event.clientX - box.left) / box.width * 100)));
  y.value = String(Math.max(0, Math.min(100, (event.clientY - box.top) / box.height * 100)));
  engaged = true; update();
}
frame.addEventListener('pointerdown', event => { frame.setPointerCapture(event.pointerId); move(event); });
frame.addEventListener('pointermove', move);
for (const name of ['pointerleave', 'pointerup', 'pointercancel']) frame.addEventListener(name, () => { engaged = false; updateSound(); });
frame.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[event.key]) {
    const step = event.shiftKey ? 5 : 1;
    x.value = Math.max(0, Math.min(100, Number(x.value) + moves[event.key][0] * step));
    y.value = Math.max(0, Math.min(100, Number(y.value) + moves[event.key][1] * step));
  } else if (event.key === 'Home') { x.value = 50; y.value = 55; }
  else return;
  event.preventDefault(); engaged = true; update();
});
frame.addEventListener('click', event => { if (event.detail === 0) full.click(); });
frame.addEventListener('focus', () => { engaged = true; updateSound(); });
frame.addEventListener('blur', () => { engaged = false; updateSound(); });
full.addEventListener('click', () => {
  const selected = full.getAttribute('aria-pressed') !== 'true';
  full.setAttribute('aria-pressed', String(selected));
  frame.setAttribute('aria-pressed', String(selected));
  const label = selected ? 'Hide full dark matter map' : 'Show full dark matter map';
  full.setAttribute('aria-label', label); full.title = label;
  reveal.classList.toggle('is-full', selected);
});
sound.addEventListener('click', async () => {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) { sound.setAttribute('aria-label', 'Sound unavailable'); sound.title = 'Sound unavailable'; sound.disabled = true; return; }
  if (!audio) {
    const context = new AudioEngine(); const osc = context.createOscillator(); const gain = context.createGain();
    gain.gain.value = 0; osc.type = 'sine'; osc.connect(gain); gain.connect(context.destination); osc.start();
    audio = { context, osc, gain };
  }
  enabled = !enabled;
  sound.setAttribute('aria-pressed', String(enabled));
  const label = enabled ? 'Disable sound' : 'Enable sound';
  sound.setAttribute('aria-label', label); sound.title = label;
  if (enabled) await audio.context.resume();
  updateSound();
});
document.addEventListener('visibilitychange', () => { engaged = false; updateSound(); });
window.addEventListener('pagehide', () => { enabled = false; updateSound(); audio?.context.close(); });
new IntersectionObserver(entries => { if (!entries[0].isIntersecting) { engaged = false; updateSound(); } }).observe(frame);
new ResizeObserver(update).observe(frame);
reveal.querySelector('.matter-controls').hidden = false;
reveal.querySelector('.matter-glass').hidden = false;
reveal.classList.add('is-ready');
update();
})();
