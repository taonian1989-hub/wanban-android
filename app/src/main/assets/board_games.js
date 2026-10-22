(function(root){
'use strict';
const inside=(r,c,h,w)=>Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&r<h&&c>=0&&c<w;
const directions=[[1,0],[0,1],[1,1],[1,-1]];
function gNew(){return {board:Array(225).fill(0),turn:1,winner:0,line:[],history:[]};}
function gLine(board,r,c){const side=board[r*15+c];if(!side)return [];for(const [dr,dc] of directions){const a=[[r,c]];for(const sign of [-1,1])for(let n=1;n<15;n++){const y=r+dr*n*sign,x=c+dc*n*sign;if(!inside(y,x,15,15)||board[y*15+x]!==side)break;a.push([y,x]);}if(a.length>=5)return a.map(([y,x])=>y*15+x);}return [];}
function gMove(s,r,c){if(s.winner||!inside(r,c,15,15)||s.board[r*15+c])return false;const i=r*15+c;s.board[i]=s.turn;s.history.push(i);s.line=gLine(s.board,r,c);if(s.line.length)s.winner=s.turn;else if(s.history.length===225)s.winner=3;else s.turn=3-s.turn;return true;}
function gUndo(s,count=1){while(count--&&s.history.length){const i=s.history.pop();s.turn=s.board[i];s.board[i]=0;}s.winner=0;s.line=[];}
function gScore(board,r,c,side){let total=0;for(const [dr,dc] of directions){let n=1,open=0;for(const sign of [-1,1]){let k=1;for(;k<6;k++){const y=r+dr*k*sign,x=c+dc*k*sign;if(!inside(y,x,15,15))break;if(board[y*15+x]!==side){if(!board[y*15+x])open++;break;}n++;}}total+=n>=5?10000000:n===4?(open===2?150000:30000):n===3?(open===2?8000:900):n===2?(open===2?450:80):open*8;}return total;}
function gAI(s){if(s.winner)return null;if(!s.history.length)return [7,7];let best=null,value=-Infinity;for(let r=0;r<15;r++)for(let c=0;c<15;c++){if(s.board[r*15+c])continue;let near=false;for(let y=Math.max(0,r-2);y<=Math.min(14,r+2)&&!near;y++)for(let x=Math.max(0,c-2);x<=Math.min(14,c+2);x++)if(s.board[y*15+x]){near=true;break;}if(!near)continue;const attack=gScore(s.board,r,c,s.turn),defend=gScore(s.board,r,c,3-s.turn);const v=attack>=10000000?1e12:defend>=10000000?1e11:attack+defend*1.08-(Math.abs(r-7)+Math.abs(c-7));if(v>value){value=v;best=[r,c];}}return best;}
// Xiangqi: uppercase is red, lowercase is black; row 0 is the black home rank.
const red=p=>!!p&&p===p.toUpperCase(),side=p=>red(p)?1:-1;
function xNew(){const b=Array(90).fill('');'rheakaehr'.split('').forEach((p,c)=>{b[c]=p;b[81+c]=p.toUpperCase();});for(const c of [1,7]){b[18+c]='c';b[63+c]='C';}for(const c of [0,2,4,6,8]){b[27+c]='p';b[54+c]='P';}const s={board:b,turn:1,winner:0,reason:'',history:[],quiet:0,positions:[]};s.positions=[xKey(s)];return s;}
const palace=(r,c,t)=>c>=3&&c<=5&&(t===1?r>=7&&r<=9:r>=0&&r<=2);
function between(b,from,to){const r=Math.floor(from/9),c=from%9,y=Math.floor(to/9),x=to%9;if(r!==y&&c!==x)return -1;const dr=Math.sign(y-r),dc=Math.sign(x-c);let count=0;for(let a=r+dr,d=c+dc;a!==y||d!==x;a+=dr,d+=dc)if(b[a*9+d])count++;return count;}
function xPseudo(b,from,to){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>=90||to<0||to>=90||from===to||!b[from])return false;const p=b[from],target=b[to],t=side(p);if(target&&side(target)===t)return false;const r=Math.floor(from/9),c=from%9,y=Math.floor(to/9),x=to%9,dr=y-r,dc=x-c,a=Math.abs(dr),d=Math.abs(dc);switch(p.toLowerCase()){
 case 'r':return (dr===0||dc===0)&&between(b,from,to)===0;
 case 'c':return (dr===0||dc===0)&&between(b,from,to)===(target?1:0);
 case 'h':return a===2&&d===1?!b[(r+Math.sign(dr))*9+c]:a===1&&d===2?!b[r*9+c+Math.sign(dc)]:false;
 case 'e':return a===2&&d===2&&(t===1?y>=5:y<=4)&&!b[(r+dr/2)*9+c+dc/2];
 case 'a':return a===1&&d===1&&palace(y,x,t);
 case 'k':return target?.toLowerCase()==='k'&&dc===0&&between(b,from,to)===0||a+d===1&&palace(y,x,t);
 case 'p':return dc===0&&dr===-t||dr===0&&d===1&&(t===1?r<=4:r>=5);
 default:return false;
}}
function xCheck(b,t){const k=b.indexOf(t===1?'K':'k');if(k<0)return true;for(let i=0;i<90;i++)if(b[i]&&side(b[i])!==t&&xPseudo(b,i,k))return true;return false;}
function xLegal(b,from,to,t){if(!b[from]||side(b[from])!==t||!xPseudo(b,from,to))return false;const p=b[from],captured=b[to];b[to]=p;b[from]='';const valid=!xCheck(b,t);b[from]=p;b[to]=captured;return valid;}
function xMoves(b,t){const moves=[];for(let i=0;i<90;i++)if(b[i]&&side(b[i])===t)for(let j=0;j<90;j++)if(xLegal(b,i,j,t))moves.push([i,j]);return moves;}
function xKey(s){return s.board.map(x=>x||'.').join('')+s.turn;}
function xOutcome(s){if(!s.board.includes(s.turn===1?'K':'k'))return {winner:-s.turn,reason:'将帅被吃'};if(xMoves(s.board,s.turn).length===0)return {winner:-s.turn,reason:xCheck(s.board,s.turn)?'将死':'困毙'};if(s.positions.filter(k=>k===xKey(s)).length>=3)return {winner:2,reason:'同一局面出现三次'};if(s.quiet>=120)return {winner:2,reason:'连续120步无吃子且无兵卒移动'};return {winner:0,reason:''};}
function xMove(s,from,to){if(s.winner||!xLegal(s.board,from,to,s.turn))return false;const piece=s.board[from],captured=s.board[to];s.history.push({from,to,piece,captured,quiet:s.quiet});s.board[to]=piece;s.board[from]='';s.quiet=captured||piece.toLowerCase()==='p'?0:s.quiet+1;s.turn=-s.turn;s.positions.push(xKey(s));Object.assign(s,xOutcome(s));return true;}
function xUndo(s,count=1){while(count--&&s.history.length){const m=s.history.pop();s.board[m.from]=m.piece;s.board[m.to]=m.captured;s.turn=side(m.piece);s.quiet=m.quiet;s.positions.pop();}s.winner=0;s.reason='';}
const values={k:20000,r:900,c:440,h:400,e:200,a:200,p:100};
function xEval(b,t){let total=0;for(let i=0;i<90;i++)if(b[i]){const p=b[i],k=p.toLowerCase(),s=side(p),r=Math.floor(i/9),c=i%9;let v=values[k];if(k==='p')v+=(s===1?r<=4:r>=5)?110:0;if(k==='h'||k==='c')v+=(4-Math.abs(4-c))*5;if(k==='p')v+=(s===1?9-r:r)*3;total+=v*s*t;}return total;}
function xAI(s,budget=300){if(s.winner)return null;const b=s.board.slice(),t=s.turn,moves=xMoves(b,t);if(!moves.length)return null;const rank=m=>(b[m[1]]?values[b[m[1]].toLowerCase()]*10:0)+(4-Math.abs(4-m[1]%9));moves.sort((a,b)=>rank(b)-rank(a));const deadline=Date.now()+Math.max(20,Math.min(800,budget));let best=moves[0],score=-Infinity;
 for(const m of moves){const p=b[m[0]],cap=b[m[1]];b[m[1]]=p;b[m[0]]='';let v;if(!b.includes(t===1?'k':'K'))v=1e7;else{const reply=xMoves(b,-t);if(!reply.length)v=1e7;else{v=Infinity;for(const n of reply){const q=b[n[0]],hit=b[n[1]];b[n[1]]=q;b[n[0]]='';v=Math.min(v,b.includes(t===1?'K':'k')?xEval(b,t):-1e7);b[n[0]]=q;b[n[1]]=hit;}if(xCheck(b,-t))v+=12;}}b[m[0]]=p;b[m[1]]=cap;if(v>score){score=v;best=m;}if(score>=1e7||Date.now()>deadline)break;}return best;
}
const api={gomoku:{create:gNew,move:gMove,undo:gUndo,line:gLine,ai:gAI},xiangqi:{create:xNew,move:xMove,undo:xUndo,pseudo:xPseudo,legal:xLegal,moves:xMoves,check:xCheck,outcome:xOutcome,key:xKey,ai:xAI,side}};
if(typeof module!=='undefined')module.exports=api;root.BoardGames=api;
})(typeof globalThis!=='undefined'?globalThis:this);
