const assert = require('node:assert/strict');
const test = require('node:test');
const M = require('../src/model.js');
const m = (date,home,away,hg,ag,season='2025-26') => ({date,home,away,hg,ag,season,round:'R',id:`${season}-${date}-${home}`,played: hg !== null});
test('raw data normalizes scored vs unscheduled fixtures',()=>{
 const r=M.parseSeason({matches:[{date:'2025-08-17',team1:'A',team2:'B',score:{ft:[2,0]}},{date:'2025-08-20',team1:'B',team2:'A',score:null}]},'2025-26');
 assert.deepEqual([r.length,r[0].hg,r[0].ag,r[1].played],[2,2,0,false]);
});
test('1X2 probabilities are valid',()=>{
 const p=M.predict(M.createState(),'A','B');
 assert.ok(Math.abs(p.H+p.D+p.A-1)<1e-10);
 assert.ok([p.H,p.D,p.A,p.homeXG,p.awayXG].every(Number.isFinite));
 assert.ok(p.H>p.A);
});
test('home strength influences goal estimates',()=>{
 const s=M.createState();for(let i=1;i<=12;i++) M.updateState(s,m('2024-08-'+String(i).padStart(2,'0'),'A','B',4,0));
 assert.ok(M.predict(s,'A','B').homeXG>M.predict(M.createState(),'A','B').homeXG);
});
test('scenario adjustment is immutable',()=>{
 const s=M.createState(),b=JSON.stringify(s),p=M.predict(s,'A','B'),q=M.predict(s,'A','B',1.3);
 assert.ok(q.homeXG>p.homeXG && q.H>p.H); assert.equal(JSON.stringify(s),b);
});
test('same-day matches never leak scores',()=>{
 const run=M.evaluate([m('2025-08-17','A','B',3,0),m('2025-08-17','A','C',0,5)],'2025-26');
 assert.ok(Math.abs(run.chosen[0].p.H-run.chosen[1].p.H)<1e-10);
});
test('evaluation is chronological',()=>{
 const run=M.evaluate([m('2024-07-10','A','B',2,0,'2024-25'),m('2025-09-11','B','A',1,1),m('2025-11-21','A','B',1,0)],'2025-26');
 assert.equal(run.total,2);assert.equal(run.state.matches,3);assert.equal(run.currentState.matches,2);
 assert.ok(run.chosen.every(r=>r.brier>=0&&r.brier<=1));
});
test('future/scheduled matches do not train',()=>{
 const run=M.evaluate([m('2027-09-01','A','B',2,0),m('2025-12-01','B','A',null,null)],'2025-26');
 assert.equal(run.state.matches,0);
});
test('CSV escapes quotes',()=>{
 const run=M.evaluate([m('2025-12-01','AC "United"','B',1,0)],'2025-26');
 assert.ok(M.csv(run.chosen).includes('AC ""United""'));
});
test('standings points are correct',()=>{
 const s=M.createState();M.updateState(s,m('2025-12-01','A','B',1,0));assert.equal(M.standings(s)[0].points,3);
});
test('invalid fixtures and teams are rejected',()=>{
 assert.throws(()=>M.predict(M.createState(),'A','A'));
 const r=M.parseSeason({matches:[{date:'2024-01-01',team1:'A',team2:'A',score:{ft:[1,2]}},{date:'bad',team1:'A',team2:'B'}]},'2024-25');
 assert.equal(r.length,0);
});