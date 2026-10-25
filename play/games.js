export const normalize = (value='') => value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-ZÑ]/g,'');

export function calculatePoints(maxPoints, elapsed, limit, correct=true) {
  if (!correct || elapsed >= limit) return 0;
  return Math.max(0, Math.round(maxPoints * Math.max(0, 1 - elapsed / limit)));
}

const seededLetters = 'EQUIPOCOLABORARRETOIDEAAULAPARTICIPACION';
export function createWordSearch(words, size=9) {
  const clean = words.map(normalize).filter(Boolean);
  if (!clean.length || clean.some((word) => word.length > size)) return {error:'size'};
  const grid = Array.from({length:size},()=>Array(size).fill(''));
  const placements=[];
  const dirs=[[0,1],[1,0],[1,1],[-1,1]];
  const canPlace=(word,row,col,dr,dc)=>{
    const endR=row+dr*(word.length-1),endC=col+dc*(word.length-1);
    if(endR<0||endR>=size||endC<0||endC>=size)return false;
    return [...word].every((ch,i)=>!grid[row+dr*i][col+dc*i]||grid[row+dr*i][col+dc*i]===ch);
  };
  clean.forEach((word,wi)=>{
    let placed=false;
    for(let attempt=0;attempt<size*size*dirs.length&&!placed;attempt++){
      const dir=dirs[(wi+attempt)%dirs.length];
      const row=(wi*2+Math.floor(attempt/dirs.length))%size;
      const col=(wi*3+attempt)%size;
      if(canPlace(word,row,col,dir[0],dir[1])){
        const cells=[];[...word].forEach((ch,i)=>{const r=row+dir[0]*i,c=col+dir[1]*i;grid[r][c]=ch;cells.push({r,c});});
        placements.push({word,cells});placed=true;
      }
    }
    if(!placed){
      for(let row=0;row<size&&!placed;row++)for(let col=0;col<size&&!placed;col++)for(const [dr,dc] of dirs){if(canPlace(word,row,col,dr,dc)){const cells=[];[...word].forEach((ch,i)=>{const r=row+dr*i,c=col+dc*i;grid[r][c]=ch;cells.push({r,c});});placements.push({word,cells});placed=true;break;}}
    }
  });
  if(placements.length!==clean.length)return {error:'placement'};
  let cursor=0;for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!grid[r][c])grid[r][c]=seededLetters[cursor++%seededLetters.length];
  return {grid,placements,size};
}

export function cellsBetween(a,b) {
  const dr=Math.sign(b.r-a.r),dc=Math.sign(b.c-a.c);
  const distance=Math.max(Math.abs(b.r-a.r),Math.abs(b.c-a.c));
  if(!distance||(!((a.r===b.r)||(a.c===b.c)||(Math.abs(b.r-a.r)===Math.abs(b.c-a.c)))))return [];
  return Array.from({length:distance+1},(_,i)=>({r:a.r+dr*i,c:a.c+dc*i}));
}

export function createCrossword(entries) {
  const source=entries.map((entry,index)=>({answer:normalize(entry.answer),clue:entry.clue,index})).filter(x=>x.answer.length>1);
  if(!source.length)return {error:'empty'};
  const size=Math.max(11,Math.min(17,Math.max(...source.map(x=>x.answer.length))+6));
  const center=Math.floor(size/2);const placed=[];const occupied=new Map();
  const key=(r,c)=>`${r},${c}`;
  const tryPlace=(item,row,col,dir)=>{
    const dr=dir==='down'?1:0,dc=dir==='across'?1:0;
    if(row<0||col<0||row+dr*(item.answer.length-1)>=size||col+dc*(item.answer.length-1)>=size)return false;
    let crosses=0;
    for(let i=0;i<item.answer.length;i++){
      const r=row+dr*i,c=col+dc*i,existing=occupied.get(key(r,c));
      if(existing&&existing!==item.answer[i])return false;
      if(existing===item.answer[i])crosses++;
      if(!existing){
        const before=dir==='across'?occupied.get(key(r-1,c)):occupied.get(key(r,c-1));
        const after=dir==='across'?occupied.get(key(r+1,c)):occupied.get(key(r,c+1));
        if(before||after)return false;
      }
    }
    return placed.length===0||crosses>0;
  };
  const commit=(item,row,col,dir)=>{const dr=dir==='down'?1:0,dc=dir==='across'?1:0,cells=[];[...item.answer].forEach((ch,i)=>{const r=row+dr*i,c=col+dc*i;occupied.set(key(r,c),ch);cells.push({r,c});});placed.push({...item,row,col,dir,cells});};
  const first=source[0];commit(first,center,Math.max(1,center-Math.floor(first.answer.length/2)),'across');
  for(const item of source.slice(1)){
    let done=false;
    for(const base of placed){
      for(let i=0;i<item.answer.length&&!done;i++)for(let j=0;j<base.answer.length&&!done;j++)if(item.answer[i]===base.answer[j]){
        const dir=base.dir==='across'?'down':'across';const cross=base.cells[j];const row=cross.r-(dir==='down'?i:0),col=cross.c-(dir==='across'?i:0);
        if(tryPlace(item,row,col,dir)){commit(item,row,col,dir);done=true;}
      }
    }
    if(!done)return {error:'disconnected'};
  }
  const starts=[...new Set(placed.map(p=>key(p.row,p.col)))].sort((a,b)=>{const [ar,ac]=a.split(',').map(Number),[br,bc]=b.split(',').map(Number);return ar-br||ac-bc;});
  const numberMap=new Map(starts.map((k,i)=>[k,i+1]));placed.forEach(p=>p.number=numberMap.get(key(p.row,p.col)));
  const rows=[...occupied.keys()].map(k=>+k.split(',')[0]),cols=[...occupied.keys()].map(k=>+k.split(',')[1]);
  const minR=Math.max(0,Math.min(...rows)-1),maxR=Math.min(size-1,Math.max(...rows)+1),minC=Math.max(0,Math.min(...cols)-1),maxC=Math.min(size-1,Math.max(...cols)+1);
  return {size,placed,occupied,numberMap,bounds:{minR,maxR,minC,maxC}};
}

export function hangmanParts(errors) {
  const parts=['<circle cx="83" cy="39" r="12"/>','<path d="M83 51v22"/>','<path d="M83 58L67 70"/>','<path d="M83 58l16 12"/>','<path d="M83 73L70 91"/>','<path d="M83 73l13 18"/>'];
  return `<path d="M16 91h88M35 91V12h48M83 12v15"/>${parts.slice(0,errors).join('')}`;
}
