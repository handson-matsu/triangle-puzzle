const fs=require('node:fs'),E=require('../engine.js'),{solve,randomRate}=require('./solver.cjs');
let seed=20261001;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const candidates=[],ids=Object.keys(E.pieces);
for(let i=0;i<60;i++){
 const count=3+Math.floor(i/12),width=count<=4?4:5,height=count===3?3:4;
 const shuffled=ids.map(id=>({id,r:rand()})).sort((a,b)=>a.r-b.r).map(a=>a.id);
 const p={width,height,start:[Math.floor(rand()*width),Math.floor(rand()*height),Math.floor(rand()*2)],pieces:shuffled.slice(0,count)};
 const r=solve(p,12000);if(r.solution&&E.verify(p,r.solution)){const successRate=randomRate(p,60,i+1);candidates.push({p,solution:r.solution,nodes:r.nodes,successRate,score:count*10+(1-successRate)*30});}
}
candidates.sort((a,b)=>a.score-b.score);if(candidates.length<25)throw Error('Insufficient verified candidates');
const chosen=[];for(let count=3;count<=7;count++){const group=candidates.filter(c=>c.p.pieces.length===count);if(group.length<5)throw Error("Insufficient candidates for level");for(let i=0;i<5;i++)chosen.push(group[Math.round(i*(group.length-1)/4)]);}
const puzzles=[],solutions={},report=[];chosen.forEach((c,i)=>{const difficulty=Math.floor(i/5)+1,p={number:i+1,title:['頂点をつなごう','かたちを見つけよう','向きを見きわめよう','すき間を読もう','三角の達人'][difficulty-1],difficulty,...c.p};puzzles.push(p);solutions[p.number]=c.solution;report.push({...p,nodes:c.nodes,randomSuccessRate:c.successRate,trials:60,score:c.score,verified:E.verify(p,c.solution),solution:c.solution});});
fs.writeFileSync('puzzles.js','const PUZZLES='+JSON.stringify(puzzles,null,2)+';\nif(typeof module!=="undefined")module.exports=PUZZLES;\n');
fs.writeFileSync('solutions.js','const SOLUTIONS='+JSON.stringify(solutions,null,2)+';\nif(typeof module!=="undefined")module.exports=SOLUTIONS;\n');
fs.writeFileSync('analysis/verified.json',JSON.stringify(report,null,2));fs.writeFileSync('analysis/candidates.json',JSON.stringify(candidates,null,2));console.log(`Verified ${puzzles.length} puzzles from ${candidates.length}/60 candidates`);

const lines=['# 25問の生成・検証レポート','','固定seed: 20261001。60候補中'+candidates.length+'候補で解を確認。各60回の無作為合法手プレイを評価。星はピース数を基準にした推定難易度で、人による校正・解の一意性評価は未実施です。','','| 問題 | 難易度 | ピース数 | 三角マス数 | 無作為成功率 | 探索ノード | 解検証 |','|---|---|---:|---:|---:|---:|---|'];
for(const p of report)lines.push(`| ${p.number} | ${'★'.repeat(p.difficulty)} | ${p.pieces.length} | ${p.width*p.height*2} | ${(p.randomSuccessRate*100).toFixed(1)}% | ${p.nodes} | OK |`);
lines.push('','探索ノードは最初の解までの値で解数ではありません。成功率0%も解なしではありません。保存解は verified.json と solutions.js を参照。');
fs.writeFileSync('analysis/REPORT.md',lines.join('\n')+'\n');
