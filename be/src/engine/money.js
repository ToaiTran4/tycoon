export const rnd = (x) => (x == null || Number.isNaN(x) ? 0 : Math.round(Number(x)));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const money = {
  add: (a, b) => rnd(Number(a) + Number(b)),
  sum: (arr) => arr.reduce((s, v) => s + rnd(v), 0),
};
