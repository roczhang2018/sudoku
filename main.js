'use strict';
const boardEl=document.getElementById('board');
const statusEl=document.getElementById('status');
const countsEl=document.getElementById('counts');
let sidebarSelectedDigit=0; // 0 means none
const SIZE=9;
let grid=createEmptyGrid();
let fixedMask=createEmptyGrid(false);
function createEmptyGrid(fill=0){return Array.from({length:SIZE},()=>Array(SIZE).fill(fill));}
function renderBoard(){boardEl.innerHTML='';for(let r=0;r<SIZE;r++){for(let c=0;c<SIZE;c++){const cell=document.createElement('div');cell.className='cell';if(fixedMask[r][c]) cell.classList.add('fixed');const input=document.createElement('input');input.inputMode='numeric';input.maxLength=1;input.value=grid[r][c]||'';input.disabled=!!fixedMask[r][c];input.addEventListener('input',e=>{const v=e.target.value.replace(/[^1-9]/g,'');e.target.value=v;grid[r][c]=v?parseInt(v,10):0;validateAndMark();
  // refresh same-number highlight while focused
  if(document.activeElement===e.target){highlightPeers(r,c,true);} renderCounts();});
 input.addEventListener('focus',()=>{sidebarSelectedDigit=0;clearCountsActive();highlightPeers(r,c,true);});input.addEventListener('blur',()=>{highlightPeers(r,c,false);if(sidebarSelectedDigit){highlightByDigit(sidebarSelectedDigit,true);}});
 // allow clicking fixed clue cells to trigger same-number highlight
 cell.addEventListener('mousedown',e=>{if(fixedMask[r][c]){e.preventDefault();sidebarSelectedDigit=0;clearCountsActive();highlightByDigit(grid[r][c],true);}});
 cell.appendChild(input);boardEl.appendChild(cell);}}}
function highlightPeers(row,col,on){const cells=[...boardEl.querySelectorAll('.cell')];
  // clear previous same-number marks
  cells.forEach(cell=>cell.classList.remove('same'));
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const idx=r*SIZE+c;
      const sameRow=r===row;
      const sameCol=c===col;
      const sameBox=Math.floor(r/3)===Math.floor(row/3)&&Math.floor(c/3)===Math.floor(col/3);
      cells[idx].style.background=on&&(sameRow||sameCol||sameBox)?'#f0fbff':'';
      if(fixedMask[r][c])cells[idx].classList.toggle('fixed',true);
    }
  }
  // add same-number highlight based on value in focused cell
  if(on){
    const focusedVal=grid[row][col];
    if(focusedVal){
      for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++){
          if(grid[r][c]===focusedVal){
            cells[r*SIZE+c].classList.add('same');
          }
        }
      }
    }
  }
}
function highlightByDigit(digit,on){const cells=[...boardEl.querySelectorAll('.cell')];
  // clear previous backgrounds and same marks
  cells.forEach(cell=>{cell.style.background='';cell.classList.remove('same');});
  if(!on){return;}
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      if(grid[r][c]===digit){
        cells[r*SIZE+c].classList.add('same');
      }
    }
  }
}
function isValidPlacement(g,row,col,val){for(let i=0;i<SIZE;i++){if(g[row][i]===val&&i!==col)return false;if(g[i][col]===val&&i!==row)return false;}const br=Math.floor(row/3)*3,bc=Math.floor(col/3)*3;for(let r=br;r<br+3;r++){for(let c=bc;c<bc+3;c++){if((r!==row||c!==col)&&g[r][c]===val)return false;}}return true;}
function validateAndMark(){const cells=[...boardEl.querySelectorAll('.cell')];cells.forEach(c=>c.classList.remove('invalid'));let ok=true;for(let r=0;r<SIZE;r++){for(let c=0;c<SIZE;c++){const v=grid[r][c];if(!v) continue;if(!isValidPlacement(grid,r,c,v)){cells[r*SIZE+c].classList.add('invalid');ok=false;}}}statusEl.textContent=ok?'':'存在冲突，请检查。';return ok;}
function countDigits(){const counts=Array(10).fill(0);for(let r=0;r<SIZE;r++){for(let c=0;c<SIZE;c++){const v=grid[r][c];if(v) counts[v]++;}}return counts;}
function renderCounts(){if(!countsEl) return;const counts=countDigits();let html='';for(let n=1;n<=9;n++){const remaining=9-counts[n];const classes=[remaining===0?'zero':'',sidebarSelectedDigit===n?'active':''].filter(Boolean).join(' ');const classAttr=classes?` class="${classes}"`:'';html+=`<li data-digit="${n}"${classAttr}><span>${n}</span><span>${remaining}</span></li>`;}countsEl.innerHTML=html;}
function clearCountsActive(){if(!countsEl) return;countsEl.querySelectorAll('li.active').forEach(li=>li.classList.remove('active'));}
function findEmpty(g){for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(g[r][c]===0)return[r,c];return null;}
function solveBacktrack(g){const spot=findEmpty(g);if(!spot)return true;const [r,c]=spot;const nums=[1,2,3,4,5,6,7,8,9];for(const n of nums){if(isValidPlacement(g,r,c,n)){g[r][c]=n;if(solveBacktrack(g))return true;g[r][c]=0;}}return false;}
function copyGrid(g){return g.map(row=>row.slice());}
function generateCompleted(){const g=createEmptyGrid(0);function fillCell(idx=0){if(idx===81) return true;const r=Math.floor(idx/9),c=idx%9;const nums=[1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-0.5);for(const n of nums){if(isValidPlacement(g,r,c,n)){g[r][c]=n;if(fillCell(idx+1))return true;g[r][c]=0;}}return false;}fillCell();return g;}
function hasUniqueSolution(puzzle){let count=0;const g=copyGrid(puzzle);function backtrack(){const spot=findEmpty(g);if(!spot){count++;return count<2;}const [r,c]=spot;for(let n=1;n<=9;n++){if(isValidPlacement(g,r,c,n)){g[r][c]=n;if(!backtrack())return false;g[r][c]=0;}}return true;}backtrack();return count===1;}
function generatePuzzle(difficulty='easy'){const full=generateCompleted();const puzzle=copyGrid(full);let clues;switch(difficulty){case 'hard': clues=24; break;case 'medium': clues=32; break;default: clues=40;}let cells=[...Array(81).keys()].sort(()=>Math.random()-0.5);let removed=0;while(cells.length>0 && 81-removed>clues){const idx=cells.pop();const r=Math.floor(idx/9),c=idx%9;const backup=puzzle[r][c];puzzle[r][c]=0;if(!hasUniqueSolution(puzzle)){puzzle[r][c]=backup;}else{removed++;}}return puzzle;}
function loadPuzzle(p){grid=copyGrid(p);fixedMask=createEmptyGrid(false);for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(p[r][c])fixedMask[r][c]=true;renderBoard();validateAndMark();renderCounts();}
function clearBoard(){for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!fixedMask[r][c])grid[r][c]=0;renderBoard();renderCounts();}
function checkBoard(){if(!validateAndMark())return;for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(grid[r][c]===0){statusEl.textContent='尚未完成';return;}statusEl.textContent='恭喜，完成！';}
function solveBoard(){const temp=copyGrid(grid);if(solveBacktrack(temp)){grid=temp;renderBoard();statusEl.textContent='已自动求解';renderCounts();}else{statusEl.textContent='无解';}}
function bindControls(){document.getElementById('new-easy').addEventListener('click',()=>{statusEl.textContent='';loadPuzzle(generatePuzzle('easy'));});document.getElementById('new-medium').addEventListener('click',()=>{statusEl.textContent='';loadPuzzle(generatePuzzle('medium'));});document.getElementById('new-hard').addEventListener('click',()=>{statusEl.textContent='';loadPuzzle(generatePuzzle('hard'));});document.getElementById('solve').addEventListener('click',solveBoard);document.getElementById('check').addEventListener('click',checkBoard);document.getElementById('clear').addEventListener('click',()=>{statusEl.textContent='';clearBoard();});}
function bindControls(){document.getElementById('new-easy').addEventListener('click',()=>{statusEl.textContent='';sidebarSelectedDigit=0;loadPuzzle(generatePuzzle('easy'));});document.getElementById('new-medium').addEventListener('click',()=>{statusEl.textContent='';sidebarSelectedDigit=0;loadPuzzle(generatePuzzle('medium'));});document.getElementById('new-hard').addEventListener('click',()=>{statusEl.textContent='';sidebarSelectedDigit=0;loadPuzzle(generatePuzzle('hard'));});document.getElementById('solve').addEventListener('click',()=>{sidebarSelectedDigit=0;solveBoard();});document.getElementById('check').addEventListener('click',checkBoard);document.getElementById('clear').addEventListener('click',()=>{statusEl.textContent='';sidebarSelectedDigit=0;clearBoard();});
  if(countsEl){countsEl.addEventListener('click',e=>{const li=e.target.closest('li[data-digit]');if(!li) return;const d=parseInt(li.getAttribute('data-digit'),10);if(sidebarSelectedDigit===d){sidebarSelectedDigit=0;clearCountsActive();highlightByDigit(d,false);}else{sidebarSelectedDigit=d;clearCountsActive();li.classList.add('active');highlightByDigit(d,true);}const activeInput=document.activeElement; if(activeInput && activeInput.tagName==='INPUT'){activeInput.blur();}});
  }
}
function init(){renderBoard();bindControls();renderCounts();statusEl.textContent='点击“新局”开始';}
init();
