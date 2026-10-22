const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),assets=path.join(root,'app/src/main/assets'),out=path.join(root,'outputs');fs.mkdirSync(out,{recursive:true});
const css=fs.readFileSync(path.join(assets,'app.css'),'utf8'),scripts=['core.js','board_games.js','board_ui.js','app.js'].map(x=>fs.readFileSync(path.join(assets,x),'utf8'));
const hash=s=>`'sha256-${crypto.createHash('sha256').update(s).digest('base64')}'`;
let html=fs.readFileSync(path.join(assets,'index.html'),'utf8');html=html.replace(/content="default-src[^\"]*"/,`content="default-src 'none'; script-src ${scripts.map(hash).join(' ')}; style-src ${hash(css)}; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"`).replace('<link rel="stylesheet" href="app.css">',()=>'<style>'+css+'</style>').replace('<script src="core.js"></script><script src="board_games.js"></script><script src="board_ui.js"></script><script src="app.js"></script>',()=>scripts.map(s=>'<script>'+s+'</script>').join(''));
fs.writeFileSync(path.join(out,'玩伴_界面预览_v2.html'),html);
console.log('Single-file preview generated; native model keys remain disabled.');
