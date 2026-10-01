'use strict';
const E=PuzzleEngine,$=id=>document.getElementById(id);
const palette=['#4a8b79','#d28d48','#638ec2','#ae749e','#8c9950','#bf7263','#7586ae'];
let puzzleIndex=0,placed=[],history=[],selected=null,shape=null,selectedPlaced=null;
let adminMode=false,answerVisible=false,savedMessage=null,titleTaps=[];
const puzzle=()=>PUZZLES[puzzleIndex];
const color=id=>palette[puzzle().pieces.indexOf(id)%palette.length];
function say(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function remember(){history.push(placed.map(p=>({...p,cells:p.cells.map(c=>[...c])})));}
function start(index){answerVisible=false;savedMessage=null;puzzleIndex=index;placed=[];history=[];selected=null;shape=null;selectedPlaced=null;$('problem').value=String(index);render();say('未使用ピースから1つ選びましょう。');}
function selectPiece(id){if(answerVisible)return;selected=id;shape=E.pieces[id].cells.map(c=>[...c]);selectedPlaced=null;render();say('● のマスを目印に、盤面の緑の点をタップして置きましょう。');}
const NS='http://www.w3.org/2000/svg';
const point=([x,y])=>[(x+y/2)*40,y*Math.sqrt(3)*20];
function svgNode(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
function triangle(cell){return E.vertices(cell).map(v=>point(v).join(',')).join(' ');}
function center(cell){const vs=E.vertices(cell).map(point);return [vs.reduce((s,v)=>s+v[0],0)/3,vs.reduce((s,v)=>s+v[1],0)/3];}
function miniature(cells){
 const vs=cells.flatMap(E.vertices).map(point),xs=vs.map(v=>v[0]),ys=vs.map(v=>v[1]);
 const mini=svgNode('svg',{viewBox:`${Math.min(...xs)-3} ${Math.min(...ys)-3} ${Math.max(...xs)-Math.min(...xs)+6} ${Math.max(...ys)-Math.min(...ys)+6}`,class:'mini','aria-hidden':'true'});
 cells.forEach(c=>mini.append(svgNode('polygon',{points:triangle(c),class:'mini-cell'})));
 const [x,y]=center(cells[0]);const dot=svgNode('circle',{cx:x,cy:y,r:3,fill:'white'});mini.append(dot);return mini;
}
function render(){
 const p=puzzle(),displayed=answerVisible?SOLUTIONS[p.number]:placed,complete=!answerVisible&&placed.length===p.pieces.length;
 $('admin-tools').hidden=!adminMode;$('show-answer').hidden=answerVisible;$('close-answer').hidden=!answerVisible;
 $('problem').disabled=answerVisible;
 $('problem-title').textContent=p.title;
 $('difficulty').textContent='★'.repeat(p.difficulty);
 $('difficulty').setAttribute('aria-label',`難易度 ${p.difficulty} / 5`);$('progress').textContent=`${displayed.length} / ${p.pieces.length} 配置`;
 $('remaining').textContent=`あと ${p.pieces.length-displayed.length} 個`;
 const board=$('board');board.replaceChildren();board.setAttribute('viewBox',`-3 -3 ${(p.width+p.height/2)*40+6} ${p.height*Math.sqrt(3)*20+6}`);
 const occupied=new Map(displayed.flatMap(piece=>piece.cells.map(c=>[E.ck(c),piece.id])));
 for(const c of E.boardCells(p)){
  const [x,y,t]=c,id=occupied.get(E.ck(c)),isStart=E.ck(c)===E.ck(p.start);
  const cell=svgNode('g',{class:'cell',role:'button',tabindex:answerVisible?-1:0,'data-x':x,'data-y':y,'data-t':t,'aria-disabled':String(answerVisible)});
  cell.append(svgNode('polygon',{points:triangle(c)}));
  const [cx,cy]=center(c);
  if(isStart){cell.classList.add('start');const star=svgNode('text',{x:cx,y:cy+4,'text-anchor':'middle'});star.textContent='★';cell.append(star);}
  if(id){cell.classList.add('occupied');cell.style.setProperty('--piece-color',color(id));if(!answerVisible&&id===selectedPlaced)cell.classList.add('chosen');}
  const valid=!answerVisible&&selected&&E.check(p,placed,E.position(shape,x,y,t)).ok;
  if(valid){cell.classList.add('legal');cell.append(svgNode('circle',{cx,cy,r:2.6,class:'legal-dot'}));}
  cell.setAttribute('aria-label',`${y+1}行 ${x+1}列 ${t?'上向き':'下向き'}${isStart?' スタート':''}${id?` 配置済み ${id}`:valid?' 配置できます':''}`);
  cell.addEventListener('click',()=>activate(x,y,t,id));
  cell.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate(x,y,t,id);}});
  cell.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')preview(x,y,t);});
  cell.addEventListener('focus',()=>preview(x,y,t));board.append(cell);
 }
 $('pieces').replaceChildren();
 for(const id of p.pieces.filter(id=>!displayed.some(t=>t.id===id))){
  const button=document.createElement('button');button.className='piece';button.style.setProperty('--piece-color',color(id));button.setAttribute('aria-pressed',String(id===selected));
  button.setAttribute('aria-label',`${id}、${E.pieces[id].cells.length}マスのピース`);
  button.append(miniature(id===selected?shape:E.pieces[id].cells));const label=document.createElement('span');label.className='piece-name';label.textContent=`${id} · ${E.pieces[id].cells.length}マス`;button.append(label);button.onclick=()=>selectPiece(id);$('pieces').append(button);
 }
 for(const id of ['left','right','flip'])$(id).disabled=answerVisible||!selected;
 $('remove').disabled=answerVisible||!selectedPlaced;$('undo').disabled=answerVisible||!history.length;$('restart').disabled=answerVisible||!placed.length;
 $('clear').hidden=!complete;$('next').hidden=puzzleIndex===PUZZLES.length-1;$('last').hidden=puzzleIndex!==PUZZLES.length-1;
}
function clearPreview(){document.querySelectorAll('.preview-ok,.preview-no').forEach(c=>c.classList.remove('preview-ok','preview-no'));}
function preview(x,y,t){clearPreview();if(answerVisible||!selected)return;const cells=E.position(shape,x,y,t),valid=E.check(puzzle(),placed,cells).ok;
 for(const [cx,cy,ct] of cells||[]){const cell=$('board').querySelector(`[data-x="${cx}"][data-y="${cy}"][data-t="${ct}"]`);if(cell)cell.classList.add(valid?'preview-ok':'preview-no');}
}
function activate(x,y,t,occupiedId){
 if(answerVisible)return;
 if(occupiedId){selected=null;shape=null;selectedPlaced=occupiedId;render();say('「選択した配置を取り消す」で戻せます。つながりが切れるピースも戻ります。');return;}
 if(!selected){selectedPlaced=null;render();say('未使用ピースから1つ選びましょう。');return;}
 const cells=E.position(shape,x,y,t),result=E.check(puzzle(),placed,cells);
 if(!result.ok){say(result.reason,true);preview(x,y,t);return;}
 remember();placed.push({id:selected,cells});selected=null;shape=null;selectedPlaced=null;render();
 say(placed.length===puzzle().pieces.length?'クリア！ すべてのピースを正しく置けました。':'置けました。次のピースを選びましょう。');
}
function orient(fn){if(answerVisible||!selected)return;shape=fn(shape);render();say('向きを変えました。● の位置を確認して置きましょう。');}
$('left').onclick=()=>orient(c=>E.rotate(c,-1));$('right').onclick=()=>orient(E.rotate);$('flip').onclick=()=>orient(E.flip);
$('remove').onclick=()=>{if(answerVisible||!selectedPlaced)return;remember();const before=placed.length;placed=E.remove(puzzle(),placed,selectedPlaced);selectedPlaced=null;render();say(`${before-placed.length}個のピースを未使用に戻しました。`);};
$('undo').onclick=()=>{if(answerVisible||!history.length)return;placed=history.pop();selected=null;shape=null;selectedPlaced=null;render();say('1手戻しました。');};
$('restart').onclick=()=>{if(!answerVisible&&placed.length&&confirm('この問題を最初からやり直しますか？'))start(puzzleIndex);};
$('next').onclick=()=>{if(!answerVisible&&placed.length===puzzle().pieces.length&&puzzleIndex+1<PUZZLES.length)start(puzzleIndex+1);};
PUZZLES.forEach((p,i)=>{const option=document.createElement('option');option.value=i;option.textContent=`問題 ${p.number} ${'★'.repeat(p.difficulty)}`;$('problem').append(option);});
$('problem').onchange=event=>{const index=Number(event.target.value);if(placed.length&&placed.length!==puzzle().pieces.length&&!confirm('配置をリセットして、別の問題へ進みますか？')){$('problem').value=puzzleIndex;return;}start(index);};
$('board').addEventListener('pointerleave',clearPreview);
// Five clicks within two seconds; click also handles touch without double-counting.
$('game-title').addEventListener('click',()=>{
 const now=performance.now();titleTaps=titleTaps.filter(t=>now-t<=2000);titleTaps.push(now);
 if(titleTaps.length<5)return;
 titleTaps=[];adminMode=!adminMode;
 if(!adminMode&&answerVisible)closeAnswer();else render();
});
function closeAnswer(){
 if(!answerVisible)return;
 answerVisible=false;render();say(savedMessage.text,savedMessage.error);savedMessage=null;
}
$('show-answer').onclick=()=>{
 if(!adminMode||answerVisible)return;
 savedMessage={text:$('message').textContent,error:$('message').classList.contains('error')};
 answerVisible=true;render();say('管理者用：正解例を表示しています。「解答を閉じる」でプレイに戻ります。');
 $('close-answer').focus();
};
$('close-answer').onclick=()=>{closeAnswer();$('show-answer').focus();};
start(0);

// Record one visit per page load without waiting for the response or retrying.
try {
  fetch('https://script.google.com/macros/s/AKfycbxssCIHsD-N97SHxNC_GN0ihYeC0qy-lb-EY0KmSs6Gnztaph1sITMerLVEnNWOGkYc/exec?app=triangle-puzzle', {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    keepalive: true,
  }).catch(() => {});
} catch {
  // Access logging must never interrupt the game.
}
