(function(root){
'use strict';
const ck=c=>c.join(','), vk=v=>v.join(',');
const vertices=([x,y,t])=>t?[[x+1,y],[x,y+1],[x+1,y+1]]:[[x,y],[x+1,y],[x,y+1]];
function fromVertices(v){const x=Math.min(...v.map(p=>p[0])),y=Math.min(...v.map(p=>p[1]));return [x,y,v.some(p=>p[0]===x&&p[1]===y)?0:1];}
const normalize=c=>{const x=Math.min(...c.map(p=>p[0])),y=Math.min(...c.map(p=>p[1]));return c.map(([a,b,t])=>[a-x,b-y,t]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]||a[2]-b[2]);};
const key=c=>JSON.stringify(normalize(c));
const transform=(c,f)=>normalize(c.map(t=>fromVertices(vertices(t).map(f))));
const rotate=(c,d=1)=>transform(c,([x,y])=>d===1?[-y,x+y]:[x+y,-x]);
const flip=c=>transform(c,([x,y])=>[y,x]);
function variants(c){const m=new Map();for(let s of [c,flip(c)])for(let i=0;i<6;i++){m.set(key(s),normalize(s));s=rotate(s);}return [...m.values()];}
const canonical=c=>variants(c).map(key).sort()[0];
const neighbors=([x,y,t])=>t?[[x,y,0],[x+1,y,0],[x,y+1,0]]:[[x,y,1],[x-1,y,1],[x,y-1,1]];
function generate(max=5){let shapes=[[[0,0,0]]];const result={1:shapes};for(let n=2;n<=max;n++){const m=new Map();for(const s of shapes)for(const c of s)for(const a of neighbors(c))if(!s.some(b=>ck(a)===ck(b))){const k=canonical([...s,a]);m.set(k,JSON.parse(k));}shapes=[...m.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v);result[n]=shapes;}return result;}
const families=generate(),pieces={};for(const [n,ss] of Object.entries(families))ss.forEach((cells,i)=>{const id=`${n}-${i+1}`;pieces[id]={id,cells};});
const shared=(a,b)=>{const s=new Set(vertices(a).map(vk));return vertices(b).filter(v=>s.has(vk(v))).length;};
const touch=(a,b)=>a.some(c=>b.some(d=>shared(c,d)===1));
const boardCells=p=>Array.from({length:p.height},(_,y)=>Array.from({length:p.width},(_,x)=>[[x,y,0],[x,y,1]])).flat(2);
const position=(s,x,y,t=s[0][2])=>t!==s[0][2]?null:s.map(([a,b,u])=>[a-s[0][0]+x,b-s[0][1]+y,u]);
function check(p,placed,cells){
 const fail=reason=>({ok:false,reason});
 if(!cells)return fail('● と同じ向きの三角形を選ぶか、60°回転してください。');
 if(!cells.length||new Set(cells.map(ck)).size!==cells.length||cells.some(([x,y,t])=>!Number.isInteger(x)||!Number.isInteger(y)||(t!==0&&t!==1)||x<0||y<0||x>=p.width||y>=p.height))return fail('盤面からはみ出しています。');
 const all=placed.flatMap(p=>p.cells),occupied=new Set(all.map(ck));
 if(cells.some(c=>occupied.has(ck(c))))return fail('ほかのピースと重なっています。');
 if(cells.some(c=>all.some(d=>shared(c,d)===2)))return fail('ほかのピースと辺が接しています。頂点だけでつなげましょう。');
 if(!placed.length)return cells.some(c=>ck(c)===ck(p.start))?{ok:true}:fail('最初のピースは ★ を含めてください。');
 return touch(cells,all)?{ok:true}:fail('配置済みのピースと頂点だけでつなげてください。');
}
function remove(p,placed,id){const rest=placed.filter(a=>a.id!==id),first=rest.find(a=>a.cells.some(c=>ck(c)===ck(p.start)));if(!first)return [];const seen=new Set([first.id]);let change=true;while(change){change=false;for(const a of rest)if(!seen.has(a.id)&&rest.some(b=>seen.has(b.id)&&touch(a.cells,b.cells))){seen.add(a.id);change=true;}}return rest.filter(a=>seen.has(a.id));}
function verify(p,solution){const placed=[];for(const a of solution){if(!p.pieces.includes(a.id)||placed.some(b=>b.id===a.id)||!pieces[a.id]||canonical(a.cells)!==canonical(pieces[a.id].cells)||!check(p,placed,a.cells).ok)return false;placed.push(a);}return placed.length===p.pieces.length;}
const api={ck,vertices,fromVertices,normalize,key,rotate,flip,variants,canonical,neighbors,generate,pieces,shared,touch,boardCells,position,check,remove,verify};
if(typeof module!=='undefined')module.exports=api;else root.PuzzleEngine=api;
})(globalThis);
