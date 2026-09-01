// "Nice numbers" axis-tick algorithm (Heckbert): ticks land on 1/2/5 × 10^n steps
// (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, ...) instead of arbitrary data-derived values.
function niceNum(range, round) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  return niceFraction * Math.pow(10, exponent);
}

// Returns nice-rounded axis bounds and a tick array, given a raw data range.
export function niceTicks(min, max, targetCount = 5) {
  if (min === max) { min -= 1; max += 1; }
  const range = niceNum(max - min, false);
  const step = niceNum(range / (targetCount - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(parseFloat(v.toFixed(decimals + 6)));
  }
  return { ticks, min: niceMin, max: niceMax, step };
}

// Formats a numeric axis value, scaling the unit (k / M / B) as magnitude grows,
// and using compact scientific notation for very small values.
export function fmtAxisValue(v) {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  const scaled = (n, suffix) => {
    const r = Math.round((v / n) * 100) / 100;
    return (Number.isInteger(r) ? r : r.toFixed(1)) + suffix;
  };
  if (abs >= 1e9) return scaled(1e9, "B");
  if (abs >= 1e6) return scaled(1e6, "M");
  if (abs >= 1e3) return scaled(1e3, "k");
  if (abs < 0.01) return v.toExponential(1);
  if (abs < 1) return v.toPrecision(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(abs >= 10 ? 1 : 2);
}

// Integer powers-of-ten ticks spanning a log10-space domain [minLog, maxLog].
export function logTicks(minLog, maxLog) {
  const start = Math.floor(minLog);
  const end = Math.ceil(maxLog);
  const ticks = [];
  for (let n = start; n <= end; n++) ticks.push(n);
  return ticks;
}
