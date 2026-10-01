const E=require('../engine.js');
function placements(p){return Object.fromEntries(p.pieces.map(id=>[id,E.variants(E.pieces[id].cells).flatMap(s=>E.boardCells(p).map(([x,y,t])=>E.position(s,x,y,t)).filter(c=>c&&c.every(([x,y])=>x>=0&&y>=0&&x<p.width&&y<p.height)))]));}
function solve(p,limit=100000){const options=placements(p),seen=new Set();let nodes=0,cutoff=false;
 function dfs(placed){if(placed.length===p.pieces.length)return placed;if(++nodes>limit){cutoff=true;return null;}const k=placed.map(a=>a.id+':'+JSON.stringify(a.cells)).sort().join('|');if(seen.has(k))return null;seen.add(k);
 for(const id of p.pieces.filter(id=>!placed.some(a=>a.id===id)))for(const cells of options[id])if(E.check(p,placed,cells).ok){const result=dfs([...placed,{id,cells}]);if(result)return result;if(cutoff)return null;}return null;}
 const solution=dfs([]);return {solution,nodes,status:solution?'solved':cutoff?'limit':'unsatisfiable'};}
function randomRate(p,trials=100,seed=123){const opts=placements(p);let successes=0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<trials;i++){const placed=[];while(placed.length<p.pieces.length){const legal=[];for(const id of p.pieces.filter(id=>!placed.some(a=>a.id===id)))for(const cells of opts[id])if(E.check(p,placed,cells).ok)legal.push({id,cells});if(!legal.length)break;placed.push(legal[Math.floor(rand()*legal.length)]);}if(placed.length===p.pieces.length)successes++;}return successes/trials;}
module.exports={solve,placements,randomRate};
if(require.main===module){const ps=require('../puzzles.js');console.log(solve(ps[Number(process.argv[2]||1)-1]));}
