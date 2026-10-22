(function(root){
'use strict';
const catalog=[
 {id:'m1',type:'film',title:'白日梦想家',sub:'电影 · 冒险 / 温暖',minutes:115,moods:['想放松','想出走'],desc:'跟着一个爱做白日梦的人，走进冰岛的风与山。适合想给生活留一点勇气的晚上。',art:'mountain',color:'sage'},
 {id:'m2',type:'film',title:'心灵奇旅',sub:'电影 · 动画 / 治愈',minutes:101,moods:['有点累','想放松'],desc:'把目光从宏大目标移回一片落叶、一顿饭和一段旋律。适合给自己松松绑。',art:'soul',color:'blue'},
 {id:'m3',type:'film',title:'布达佩斯大饭店',sub:'电影 · 喜剧 / 冒险',minutes:99,moods:['想开心','想探索'],desc:'对称构图、粉色旅馆与一场荒诞冒险。适合想看一点奇妙东西的你。',art:'hotel',color:'pink'},
 {id:'m4',type:'film',title:'完美的日子',sub:'电影 · 剧情 / 日常',minutes:124,moods:['有点累','想放松'],desc:'在重复的日常里，看见光、树影与小小的满足。适合不着急的周末。',art:'tree',color:'sage'},
 {id:'s1',type:'music',title:'晴天',sub:'周杰伦 · 流行',minutes:5,moods:['想开心','想放松'],desc:'给耳机里的五分钟留一点青春气息。搜索歌名即可前往你常用的音乐平台。',art:'record',color:'peach'},
 {id:'s2',type:'music',title:'Clair de lune',sub:'德彪西 · 古典 / 钢琴',minutes:5,moods:['有点累','想放松'],desc:'安静的钢琴旋律，适合靠窗坐一会儿。挑选喜欢的演奏版本听听。',art:'moon',color:'blue'},
 {id:'s3',type:'music',title:'Here Comes the Sun',sub:'The Beatles · 流行摇滚',minutes:4,moods:['想开心','想出走'],desc:'一首带着阳光感的歌，为下班后的散步开个头。',art:'sun',color:'yellow'},
 {id:'g1',type:'game',title:'星露谷物语',sub:'游戏 · 经营 / 慢生活',minutes:30,moods:['想放松','想探索'],desc:'种菜、钓鱼和认识小镇邻居。一次只做一两件小事，也能获得轻轻的满足。',art:'farm',color:'sage'},
 {id:'g2',type:'game',title:'纪念碑谷',sub:'游戏 · 空间解谜',minutes:15,moods:['想探索','有点累'],desc:'用视角改变道路，在安静的几何建筑中走一小段。平台与价格请在商店确认。',art:'stairs',color:'pink'},
 {id:'g3',type:'game',title:'A Short Hike',sub:'游戏 · 探索 / 冒险',minutes:45,moods:['想出走','想探索'],desc:'在像素山野间走走停停，聊聊天、捡捡东西。适合暂时离开任务清单。',art:'mountain',color:'yellow'}
];
const moods=['想放松','想开心','有点累','想探索','想出走'];
const types={all:'全部',film:'影视',music:'音乐',game:'游戏',idea:'灵感'};
const defaults=()=>({version:1,app:'wanban',prefs:{mood:'想放松',minutes:120,provider:'deepseek',theme:'system',share:false,genres:[]},saved:[],sessions:[],stats:{quiz:0}});
function validate(x){
 if(!x||x.app!=='wanban'||x.version!==1||!x.prefs||!Array.isArray(x.saved)||!Array.isArray(x.sessions)||x.saved.length>1000||x.sessions.length>30)throw Error('不是有效的玩伴备份，或超过容量限制');
 const p=x.prefs;if(!moods.includes(p.mood)||![15,30,60,120].includes(p.minutes)||!['deepseek','kimi','glm','custom'].includes(p.provider)||!['system','light','dark'].includes(p.theme)||typeof p.share!=='boolean'||!Array.isArray(p.genres)||p.genres.length>10||p.genres.some(s=>typeof s!=='string'||s.length>20))throw Error('偏好数据格式不正确');
 const ids=new Set();for(const a of x.saved){if(!a||typeof a.id!=='string'||a.id.length>100||ids.has(a.id)||!['film','music','game','idea'].includes(a.type)||!['later','done'].includes(a.status))throw Error('收藏数据格式不正确');ids.add(a.id);for(const f of ['title','sub','desc'])if(typeof a[f]!=='string'||a[f].length>(f==='desc'?1500:200))throw Error('收藏内容过长或不完整');}
 const sessions=new Set();for(const s of x.sessions){if(!s||typeof s.id!=='string'||s.id.length>100||sessions.has(s.id)||typeof s.title!=='string'||s.title.length>100||!Array.isArray(s.messages)||s.messages.length>40||!['deepseek','kimi','glm','custom'].includes(s.provider))throw Error('对话数据格式不正确');sessions.add(s.id);for(const m of s.messages){if(!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>180000||!['complete','error','cancelled','pending'].includes(m.status)||typeof m.reasoning!=='string'||m.reasoning.length>180000||!Array.isArray(m.sources)||m.sources.length>8)throw Error('消息数据格式不正确');for(const a of m.sources){if(!a||typeof a.title!=='string'||a.title.length>300||!safeUrl(a.url)||typeof a.site!=='string'||a.site.length>100)throw Error('来源数据格式不正确');}}}
 if(JSON.stringify(x).length>5000000)throw Error('备份超过5百万字符');
 return {version:1,app:'wanban',prefs:{mood:p.mood,minutes:p.minutes,provider:p.provider,theme:p.theme,share:p.share,genres:p.genres.slice()},saved:x.saved.map(a=>({id:a.id,type:a.type,title:a.title,sub:a.sub,desc:a.desc,status:a.status,art:catalog.find(c=>c.id===a.id)?.art||'spark',color:catalog.find(c=>c.id===a.id)?.color||'peach'})),sessions:x.sessions.map(s=>({id:s.id,title:s.title,provider:s.provider,messages:s.messages.map(m=>({role:m.role,content:m.content,reasoning:m.reasoning,status:m.status==='pending'?'cancelled':m.status,sources:m.sources.map(a=>({title:a.title,url:a.url,site:a.site}))}))})),stats:{quiz:Math.max(0,Math.min(8,Number(x.stats?.quiz)||0))}};
}
function safeUrl(x){try{const u=new URL(x);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&x.length<4097;}catch{return false;}}
function recommend(p,type='all',offset=0){let a=catalog.filter(c=>type==='all'||c.type===type);a.sort((a,b)=>score(b,p)-score(a,p));if(!a.length)return [];const shift=offset%a.length;return a.slice(shift).concat(a.slice(0,shift)).slice(0,4);}
function score(c,p){return (c.moods.includes(p.mood)?4:0)+(c.minutes<=p.minutes?3:0)+(p.genres.includes(types[c.type])?2:0);}
function extract(text){const r=/```wanban\s*([\s\S]*?)```/g;const found=[];let m;while((m=r.exec(text))){try{const x=JSON.parse(m[1]);if(Array.isArray(x))for(const a of x.slice(0,6)){if(!a||!['film','music','game','idea'].includes(a.type)||typeof a.title!=='string'||!a.title.trim()||a.title.length>100)continue;found.push({id:'ai-'+a.type+'-'+a.title.trim(),type:a.type,title:a.title.trim(),sub:String(a.sub||types[a.type]).slice(0,200),desc:String(a.reason||'').slice(0,1500),art:'spark',color:'peach'});}}catch{}}
return {text:text.replace(/```wanban[\s\S]*?```/g,'').replace(/```wanban[\s\S]*$/g,'').trim(),cards:found.slice(0,6)};}
const quiz=[{q:'哪种乐器通常有 88 个琴键？',a:['钢琴','小提琴','长笛','手风琴'],n:0,why:'标准现代钢琴通常有 88 个琴键。'}, {q:'电影《千与千寻》的导演是谁？',a:['新海诚','宫崎骏','今敏','细田守'],n:1,why:'《千与千寻》由宫崎骏执导。'}, {q:'国际象棋中，哪枚棋子走“日”字形？',a:['象','后','车','马'],n:3,why:'马走 L 形，也常被称作“日”字形。'}, {q:'古典音乐中，四重奏通常有几位演奏者？',a:['两位','三位','四位','五位'],n:2,why:'四重奏通常由四位演奏者组成。'}, {q:'《小王子》中，小王子来自哪颗小行星？',a:['B-612','C-137','A-113','R-2'],n:0,why:'故事中，小王子来自 B-612 小行星。'}, {q:'哪部电影出现了机器人瓦力？',a:['超能陆战队','机器人总动员','玩具总动员','头脑特工队'],n:1,why:'瓦力是《机器人总动员》的主角。'}, {q:'游戏《俄罗斯方块》的标准方块每块由几个小方格组成？',a:['3','5','4','6'],n:2,why:'标准俄罗斯方块的每个方块由四个小方格组成。'}, {q:'尤克里里最常见的版本有几根弦？',a:['3','6','5','4'],n:3,why:'最常见的尤克里里有四根弦。'}];
const either=[['住进海边的小屋','住进森林的木屋'],['拥有一张无限次电影票','拥有一张无限次演唱会票'],['和过去的自己吃顿饭','和未来的自己散个步'],['走进最爱的电影一天','走进最爱的游戏一天'],['随时听懂动物说话','随时演奏任何乐器'],['去没有计划的旅行','过完全随心的周末']];
const api={catalog,moods,types,defaults,validate,safeUrl,recommend,extract,quiz,either};if(typeof module!=='undefined')module.exports=api;root.Wanban=api;
})(typeof globalThis!=='undefined'?globalThis:this);
