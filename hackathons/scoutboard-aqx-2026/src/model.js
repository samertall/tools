
/* ScoutBoard forecasting core.
 * An interpretable, sequential independent-Poisson model. Every historical
 * prediction is calculated BEFORE its match score is used for an update.
 * OpenFootball source data: public domain, https://github.com/openfootball/football.json
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.ScoutModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_HOME_GOALS = 1.53;
  const DEFAULT_AWAY_GOALS = 1.22;
  const PRIOR_MATCHES = 6;
  const MAX_GOALS = 9;
  const SEASON_KEYS = ['2023-24', '2024-25', '2025-26', '2026-27'];
  const TODAY_LIMIT = '2026-10-29';
  const SOURCE_ROOT = 'https://raw.githubusercontent.com/openfootball/football.json/master/';

  const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
  const round = (x, n = 2) => Number(x.toFixed(n));

  function parseSeason(raw, season) {
    if (!raw || !Array.isArray(raw.matches)) throw new Error(`Missing matches in ${season}`);
    return raw.matches.map((m, i) => {
      const score = m.score && Array.isArray(m.score.ft) && m.score.ft.length === 2
        && m.score.ft.every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0)
        ? m.score.ft : null;
      return {
        id: `${season}:${i}`, season, round: m.round || 'Matchday',
        date: String(m.date || ''), time: m.time || '',
        home: String(m.team1 || '').trim(), away: String(m.team2 || '').trim(),
        hg: score ? score[0] : null, ag: score ? score[1] : null,
        played: !!score,
      };
    }).filter(m => /^20\d{2}-\d{2}-\d{2}$/.test(m.date) && m.home && m.away && m.home !== m.away);
  }

  function createTeam() {
    return { name: '', homeN: 0, awayN: 0, homeGF: 0, homeGA: 0, awayGF: 0, awayGA: 0,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, last: [] };
  }
  function createState() { return { teams: {}, matches: 0, homeGoals: 0, awayGoals: 0, hWins: 0, draws: 0, aWins: 0 }; }
  function ensureTeam(state, name) { return state.teams[name] || (state.teams[name] = { ...createTeam(), name }); }
  function copyState(state) { return JSON.parse(JSON.stringify(state)); }
  function updateState(state, m) {
    if (!m.played) return;
    const h = ensureTeam(state, m.home), a = ensureTeam(state, m.away);
    h.homeN++; a.awayN++;
    h.homeGF += m.hg; h.homeGA += m.ag; a.awayGF += m.ag; a.awayGA += m.hg;
    h.played++; a.played++;
    h.gf += m.hg; h.ga += m.ag; a.gf += m.ag; a.ga += m.hg;
    state.matches++; state.homeGoals += m.hg; state.awayGoals += m.ag;
    const outcome = m.hg > m.ag ? 'H' : (m.hg < m.ag ? 'A' : 'D');
    state[outcome === 'H' ? 'hWins' : outcome === 'D' ? 'draws' : 'aWins']++;
    h.won += outcome === 'H' ? 1 : 0;
    a.won += outcome === 'A' ? 1 : 0;
    h.drawn += outcome === 'D' ? 1 : 0;
    a.drawn += outcome === 'D' ? 1 : 0;
    h.lost += outcome === 'A' ? 1 : 0;
    a.lost += outcome === 'H' ? 1 : 0;
    h.points += outcome === 'H' ? 3 : (outcome === 'D' ? 1 : 0);
    a.points += outcome === 'A' ? 3 : (outcome === 'D' ? 1 : 0);
    h.last.push({ date: m.date, result: outcome === 'H' ? 'W' : (outcome === 'D' ? 'D' : 'L'), goals: m.hg, against: m.ag });
    a.last.push({ date: m.date, result: outcome === 'A' ? 'W' : (outcome === 'D' ? 'D' : 'L'), goals: m.ag, against: m.hg });
    if (h.last.length > 10) h.last.shift();
    if (a.last.length > 10) a.last.shift();
  }

  function poissonDist(lambda) {
    lambda = clamp(lambda, 0.15, 5);
    const arr = new Array(MAX_GOALS + 1);
    arr[0] = Math.exp(-lambda);
    let sum = arr[0];
    for (let g = 1; g < MAX_GOALS; g++) {
      arr[g] = arr[g - 1] * lambda / g;
      sum += arr[g];
    }
    arr[MAX_GOALS] = Math.max(0, 1 - sum); // tail bucket >= MAX_GOALS
    return arr;
  }

  function predict(state, homeName, awayName, boost = 1) {
    if (!homeName || !awayName || homeName === awayName) throw new Error('Choose two different teams');
    const h = state.teams[homeName] || createTeam();
    const a = state.teams[awayName] || createTeam();
    // Shrink all team rates towards fixed, published priors to reduce early-season volatility.
    const hAtk = (h.homeGF + PRIOR_MATCHES * DEFAULT_HOME_GOALS) / (h.homeN + PRIOR_MATCHES) / DEFAULT_HOME_GOALS;
    const hDef = (h.homeGA + PRIOR_MATCHES * DEFAULT_AWAY_GOALS) / (h.homeN + PRIOR_MATCHES) / DEFAULT_AWAY_GOALS;
    const aAtk = (a.awayGF + PRIOR_MATCHES * DEFAULT_AWAY_GOALS) / (a.awayN + PRIOR_MATCHES) / DEFAULT_AWAY_GOALS;
    const aDef = (a.awayGA + PRIOR_MATCHES * DEFAULT_HOME_GOALS) / (a.awayN + PRIOR_MATCHES) / DEFAULT_HOME_GOALS;
    const homeXG = clamp(DEFAULT_HOME_GOALS * hAtk * aDef * clamp(boost, 0.65, 1.5), 0.2, 4.5);
    const awayXG = clamp(DEFAULT_AWAY_GOALS * aAtk * hDef, 0.2, 4.5);
    const hp = poissonDist(homeXG), ap = poissonDist(awayXG);
    let H = 0, D = 0, A = 0, btts = 0, over25 = 0;
    const scorelines = [];
    for (let i = 0; i < hp.length; i++) {
      for (let j = 0; j < ap.length; j++) {
        const p = hp[i] * ap[j];
        if (i > j) H += p;
        else if (i === j) D += p;
        else A += p;
        if (i > 0 && j > 0) btts += p;
        if (i + j > 2) over25 += p;
        scorelines.push({ home: i, away: j, p });
      }
    }
    scorelines.sort((x, y) => y.p - x.p);
    return { H, D, A, homeXG, awayXG, btts, over25, likely: scorelines.slice(0, 3),
      uncertainty: -(H * Math.log(H) + D * Math.log(D) + A * Math.log(A)) / Math.log(3),
      homeMatches: h.homeN, awayMatches: a.awayN };
  }

  function baseline(state) {
    const priorN = 48;
    const n = state.matches + priorN;
    return { H: (state.hWins + priorN * 0.45) / n, D: (state.draws + priorN * 0.26) / n, A: (state.aWins + priorN * 0.29) / n };
  }
  function outcome(m) { return m.hg > m.ag ? 'H' : m.hg === m.ag ? 'D' : 'A'; }
  function brier(p, actual) { return (['H','D','A'].reduce((sum, k) => sum + (p[k] - (k === actual ? 1 : 0)) ** 2, 0)) / 2; }
  function logloss(p, actual) { return -Math.log(Math.max(1e-10, p[actual])); }

  function evaluate(matches, season, today = TODAY_LIMIT) {
    const ordered = matches.filter(m => m.date <= today).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    const state = createState(), records = [], seasonStates = {};
    for (let i = 0; i < ordered.length;) {
      const date = ordered[i].date, batch = [];
      while (i < ordered.length && ordered[i].date === date) batch.push(ordered[i++]);
      // Everyone playing on this date shares yesterday's information set.
      const scored = batch.filter(m => m.played);
      for (const m of scored) {
        const p = predict(state, m.home, m.away);
        const base = baseline(state), result = outcome(m);
        records.push({ ...m, p, base, actual: result,
          brier: brier(p, result), baselineBrier: brier(base, result),
          loss: logloss(p, result), baselineLoss: logloss(base, result) });
      }
      for (const m of scored) {
        updateState(state, m);
        if (!seasonStates[m.season]) seasonStates[m.season] = createState();
        updateState(seasonStates[m.season], m);
      }
    }
    const chosen = records.filter(r => r.season === season);
    const avg = (rows, key) => rows.length ? rows.reduce((s, x) => s + x[key], 0) / rows.length : null;
    const modelBrier = avg(chosen, 'brier'), baselineBrier = avg(chosen, 'baselineBrier');
    const modelLoss = avg(chosen, 'loss'), baselineLoss = avg(chosen, 'baselineLoss');
    const currentState = seasonStates[season] || createState();
    const calibration = Array.from({ length: 5 }, (_, idx) => {
      const members = chosen.filter(r => {
        const conf = Math.max(r.p.H, r.p.D, r.p.A);
        return Math.min(4, Math.floor(conf * 5)) === idx;
      });
      return { label: `${idx * 20}–${(idx + 1) * 20}%`, n: members.length,
        forecast: members.length ? members.reduce((s, r) => s + Math.max(r.p.H, r.p.D, r.p.A), 0) / members.length : null,
        observed: members.length ? members.filter(r => Object.entries({ H:r.p.H,D:r.p.D,A:r.p.A }).sort((a,b)=>b[1]-a[1])[0][0] === r.actual).length / members.length : null };
    });
    return { records, chosen, state, currentState, seasonStates,
      modelBrier, baselineBrier, modelLoss, baselineLoss,
      improvement: baselineBrier === null ? null : (baselineBrier - modelBrier) / baselineBrier,
      calibration, total: chosen.length };
  }

  function standings(state) {
    return Object.values(state.teams).map(t => ({ ...t, diff: t.gf - t.ga, ppg: t.played ? t.points / t.played : 0,
      form: t.last.slice(-5).map(x => x.result) })).sort((a,b) => b.points-a.points || b.gf-b.ga - (a.gf-a.ga) || b.gf-a.gf || a.name.localeCompare(b.name));
  }

  function priorities(matches, state, today = TODAY_LIMIT) {
    return matches.filter(m => !m.played && m.date >= today)
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(m => ({ ...m, prediction: predict(state,m.home,m.away) }))
      .sort((a,b) => b.prediction.uncertainty - a.prediction.uncertainty).slice(0, 8);
  }

  function csv(records) {
    const header = 'season,date,home,away,home_goals,away_goals,p_home,p_draw,p_away,actual,brier,baseline_brier';
    const enc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [header, ...records.map(r => [r.season,r.date,r.home,r.away,r.hg,r.ag,
      round(r.p.H,4),round(r.p.D,4),round(r.p.A,4),r.actual,round(r.brier,4),round(r.baselineBrier,4)]
      .map(enc).join(','))].join('\n');
  }

  return { SEASON_KEYS, SOURCE_ROOT, TODAY_LIMIT, parseSeason, createState, updateState,
    predict, evaluate, standings, priorities, csv, brier, logloss, baseline, round, copyState };
});

