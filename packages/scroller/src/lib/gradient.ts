const GRADIENTS = [
  "linear-gradient(135deg,#0f766e 0%,#0f172a 100%)",
  "linear-gradient(135deg,#1e40af 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#7c2d12 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#701a75 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#065f46 0%,#0a0a0a 100%)",
  "linear-gradient(135deg,#3730a3 0%,#0a0a0a 100%)",
];

export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}
