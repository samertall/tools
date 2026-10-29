/** AquaShift's transparent, illustrative water-use model. Units are liters unless stated. */
export const DAYS_PER_MONTH = 30.44;
const FIELDS = {
  people:[2,1,12], showers:[7,0,21], minutes:[8,1,45],
  showerFlow:[9,1,30], faucetFlow:[6,0.5,25], drips:[10,0,240],
  shorterBy:[2,0,30], targetFlow:[6,1,30]
};

export function sanitizeInputs(data = {}) {
 const output = {};
 for (const [key,[fallback,min,max]] of Object.entries(FIELDS)) {
  const n = Number(data[key]);
  output[key] = data[key] === undefined || data[key] === '' ? fallback : !Number.isFinite(n) ? (key === 'drips' ? 0 : fallback) : Math.min(max, Math.max(min, n));
 }
 for (const key of ['shorter','lowFlow','tapOff','repair']) output[key] = data[key] === true;
 return output;
}

export function calculateModel(data = {}) {
 const v = sanitizeInputs(data);
 const weeks = DAYS_PER_MONTH / 7;
 const showerBase = v.people * v.showers * v.minutes * v.showerFlow * weeks;
 const minutesAfter = v.shorter ? Math.max(1, v.minutes - v.shorterBy) : v.minutes;
 const flowAfter = v.lowFlow ? Math.min(v.showerFlow, v.targetFlow) : v.showerFlow;
 const showerAfter = v.people * v.showers * minutesAfter * flowAfter * weeks;
 const brushBase = v.people * 2 * 2 * v.faucetFlow * DAYS_PER_MONTH;
 const brushAfter = v.people * 2 * (v.tapOff ? 0.3 : 2) * v.faucetFlow * DAYS_PER_MONTH;
 const leakBase = v.drips * 0.25 / 1000 * 60 * 24 * DAYS_PER_MONTH;
 const leakAfter = v.repair ? 0 : leakBase;
 const breakdown = [
  { key:'showers', label:'Showers', baseline:showerBase, optimized:showerAfter, savings:Math.max(0,showerBase-showerAfter) },
  { key:'brushing', label:'Brushing teeth', baseline:brushBase, optimized:brushAfter, savings:Math.max(0,brushBase-brushAfter) },
  { key:'leaks', label:'Dripping tap', baseline:leakBase, optimized:leakAfter, savings:Math.max(0,leakBase-leakAfter) }
 ];
 const baselineMonthly = breakdown.reduce((sum,row)=>sum+row.baseline,0);
 const optimizedMonthly = breakdown.reduce((sum,row)=>sum+row.optimized,0);
 const savingsMonthly = Math.max(0, baselineMonthly - optimizedMonthly);
 return { assumptions:v, baselineMonthly, optimizedMonthly, savingsMonthly, annualSavings:savingsMonthly * 12, savingsPct:baselineMonthly > 0 ? 100*savingsMonthly/baselineMonthly:0, breakdown };
}

/** Readings [{date:'YYYY-MM-DD',m3:meter's cumulative cubic meters}]. No causality inferred. */
export function meterSummary(readings = []) {
 if (!Array.isArray(readings) || readings.length < 2) return null;
 const valid = readings.map(r=>({date:String(r.date),m3:Number(r.m3)}))
  .filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.m3) && r.m3>=0)
  .sort((a,b)=>a.date.localeCompare(b.date));
 if (valid.length < 2) return null;
 const earliest = valid[0], latest = valid[valid.length-1];
 const days = Math.round((Date.parse(latest.date+'T12:00:00Z') - Date.parse(earliest.date+'T12:00:00Z'))/86400000);
 if (days <= 0 || latest.m3 < earliest.m3) return null;
 for (let i=1;i<valid.length;i++) if (valid[i].m3 < valid[i-1].m3) return null;
 const liters = Math.round((latest.m3-earliest.m3)*1000*1000)/1000;
 return {days,liters,litersPerDay:liters/days,start:earliest.date,end:latest.date};
}