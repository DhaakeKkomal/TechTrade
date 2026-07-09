export interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export function calculateSMA(data: Candle[], window: number) {
  const result: { time: string | number; value: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) continue;
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / window,
    });
  }
  return result;
}

export function calculateEMA(data: Candle[], window: number) {
  const result: { time: string | number; value: number }[] = [];
  if (data.length === 0) return result;
  
  const k = 2 / (window + 1);
  let ema = data[0].close; // Initial EMA as first close
  
  result.push({
    time: data[0].time,
    value: ema
  });
  
  for (let i = 1; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({
      time: data[i].time,
      value: ema
    });
  }
  return result;
}

export function calculateBollingerBands(data: Candle[], window = 20, numStd = 2) {
  const upper: { time: string | number; value: number }[] = [];
  const middle: { time: string | number; value: number }[] = [];
  const lower: { time: string | number; value: number }[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) continue;
    
    // Middle Band (SMA 20)
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / window;
    
    // Standard Deviation
    let variance = 0;
    for (let j = 0; j < window; j++) {
      variance += Math.pow(data[i - j].close - sma, 2);
    }
    const stdDev = Math.sqrt(variance / window);
    
    middle.push({ time: data[i].time, value: sma });
    upper.push({ time: data[i].time, value: sma + stdDev * numStd });
    lower.push({ time: data[i].time, value: sma - stdDev * numStd });
  }
  
  return { upper, middle, lower };
}
