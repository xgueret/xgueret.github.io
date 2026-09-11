function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function n1(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

/** Three-octave value-noise fBm in [-1, 1], used for organic camera drift. */
export function fbm(x: number): number {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 3; i++) {
    v += a * (n1(x * f) - 0.5) * 2;
    f *= 2.03;
    a *= 0.5;
  }
  return v;
}
