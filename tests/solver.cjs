const assert=require('node:assert/strict'),E=require('../engine'),{solve,placements}=require('../tools/solver.cjs');
// Independent legality oracle using explicit vertex-set intersections, with no engine check().
function legal(p,placed,cells){const k=c=>c.join(','),verts=([x,y,t])=>new Set((t?[[x+1,y],[x,y+1],[x+1,y+1]]:[[x,y],[x+1,y],[x,y+1]]).map(k));let contact=false;
 for(const c of cells){if(c[0]<0||c[1]<0||c[0]>=p.width||c[1]>=p.height)return false;for(const d of placed.flatMap(a=>a.cells)){const a=verts(c),n=[...verts(d)].filter(v=>a.has(v)).length;if(n>=2)return false;if(n===1)contact=true;}}
 return placed.length?contact:cells.some(c=>k(c)===k(p.start));}
function brute(p){const opts=placements(p);function walk(placed){if(placed.length===p.pieces.length)return true;for(const id of p.pieces)if(!placed.some(a=>a.id===id))for(const cells of opts[id])if(legal(p,placed,cells)&&walk([...placed,{id,cells}]))return true;return false;}return walk([]);}
let total=0;for(let width=1;width<=3;width++)for(let height=1;height<=2;height++)for(const ids of [['1-1'],['1-1','2-1'],['2-1','3-1'],['1-1','2-1','3-1']])for(let t=0;t<2;t++){const p={width,height,start:[0,0,t],pieces:ids},r=solve(p);assert.equal(r.status==='solved',brute(p));if(r.solution)assert.ok(E.verify(p,r.solution));total++;}
assert.equal(solve({width:3,height:3,start:[0,0,0],pieces:['1-1']},0).status,'limit');assert.equal(solve({width:1,height:1,start:[0,0,0],pieces:['3-1']}).status,'unsatisfiable');
for(const p of require('../puzzles')){const r=solve(p);assert.equal(r.status,'solved');const placed=[];for(const a of r.solution){assert.ok(legal(p,placed,a.cells));placed.push(a);}assert.ok(E.verify(p,r.solution));}
console.log(`PASS: ${total} small solver/oracle comparisons, limit vs unsatisfiable, and independent validation of 25 solutions.`);
