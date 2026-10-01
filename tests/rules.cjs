const assert=require('node:assert/strict'),E=require('../engine.js');
let assertions=0;const test=(condition)=>{assert.ok(condition);assertions++;};
assert.deepEqual(Object.values(E.generate()).map(s=>s.length),[1,1,1,3,4]);
const all=Object.values(E.pieces);
test(new Set(all.map(p=>E.canonical(p.cells))).size===10);
for(const {cells} of all){let r=cells;for(let i=0;i<6;i++)r=E.rotate(r);assert.deepEqual(r,E.normalize(cells));assert.deepEqual(E.flip(E.flip(cells)),E.normalize(cells));assert.deepEqual(E.rotate(E.rotate(cells),-1),E.normalize(cells));
 for(const v of E.variants(cells)){test(v.length===cells.length);test(E.canonical(v)===E.canonical(cells));const seen=new Set([E.ck(v[0])]);let old;do{old=seen.size;for(const a of v)if(v.some(b=>seen.has(E.ck(b))&&E.shared(a,b)===2))seen.add(E.ck(a));}while(old!==seen.size);test(seen.size===cells.length);}
}
// Independent Euclidean check: all edges have unit length, transforms preserve every vertex distance.
const xy=([x,y])=>[x+y/2,y*Math.sqrt(3)/2];
function distances(s){const vs=[...new Map(s.flatMap(E.vertices).map(v=>[v.join(','),v])).values()].map(xy),out=[];for(let i=0;i<vs.length;i++)for(let j=i+1;j<vs.length;j++)out.push(Math.round(((vs[i][0]-vs[j][0])**2+(vs[i][1]-vs[j][1])**2)*1e6));return out.sort((a,b)=>a-b);}
for(const {cells} of all)for(const s of E.variants(cells))assert.deepEqual(distances(s),distances(cells));
const c=[2,2,0],near=[];for(let x=0;x<5;x++)for(let y=0;y<5;y++)for(let t=0;t<2;t++)near.push([x,y,t]);
test(near.filter(d=>E.shared(c,d)===2).length===3);test(near.filter(d=>E.shared(c,d)===1).length===9);
assert.deepEqual(near.filter(d=>E.shared(c,d)===2).map(E.ck).sort(),E.neighbors(c).map(E.ck).sort());
const p={width:5,height:5,start:c,pieces:['1-1']};test(E.check(p,[],[c]).ok);test(!E.check(p,[],[[0,0,0]]).ok);test(!E.check(p,[],[[-1,2,0]]).ok);test(!E.check(p,[],null).ok);
for(const d of near)if(E.ck(c)!==E.ck(d))for(const transform of [E.rotate,E.flip]){const pair=transform([c,d]);test(E.shared(pair[0],pair[1])===E.shared(c,d));}
for(const {cells} of all)assert.deepEqual(E.flip(E.rotate(E.flip(cells))),E.rotate(cells,-1));
const placed=[{id:'a',cells:[c]}];for(const d of near)test(E.check(p,placed,[d]).ok===(E.shared(c,d)===1));
test(!E.check(p,placed,[[2,2,1],[1,2,0]]).ok); // vertex contact never overrides a shared edge
for(const {cells} of all)test(E.position(cells,0,0,1-cells[0][2])===null);
const chain=[{id:'a',cells:[[0,0,0]]},{id:'b',cells:[[1,0,1]]},{id:'c',cells:[[2,1,0]]}];
assert.deepEqual(E.remove({...p,start:[0,0,0]},chain,'b').map(a=>a.id),['a']);assert.deepEqual(E.remove({...p,start:[0,0,0]},chain,'a'),[]);
const puzzles=require('../puzzles.js'),solutions=require('../solutions.js'),report=require('../analysis/verified.json');
test(puzzles.length===25);for(let d=1;d<=5;d++)test(puzzles.filter(p=>p.difficulty===d).length===5);
for(const p of puzzles){test(E.verify(p,solutions[p.number]));assert.deepEqual(solutions[p.number],report[p.number-1].solution);test(!E.verify(p,solutions[p.number].slice(1)));}
console.log(`Rules, geometry, enumeration and 25 solutions passed (${assertions} checks plus deep comparisons).`);
