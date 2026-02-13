document.addEventListener("DOMContentLoaded", function() {
var EX={Chest:["Bench Press","Incline Bench Press","Decline Bench Press","Dumbbell Bench Press","Incline Dumbbell Press","Dumbbell Flyes","Incline Dumbbell Flyes","Cable Crossover","Cable Flyes (Low)","Cable Flyes (High)","Push-Ups","Diamond Push-Ups","Chest Dips","Machine Chest Press","Pec Deck","Svend Press","Landmine Press","Floor Press"],Back:["Deadlift","Barbell Row","Pendlay Row","Pull-Ups","Chin-Ups","Lat Pulldown","Close-Grip Pulldown","Seated Cable Row","T-Bar Row","Single Arm Dumbbell Row","Chest-Supported Row","Face Pulls","Meadows Row","Rack Pull","Straight Arm Pulldown","Inverted Row","Good Morning","Hyperextension"],Legs:["Squat","Front Squat","Goblet Squat","Leg Press","Hack Squat","Romanian Deadlift","Stiff Leg Deadlift","Sumo Deadlift","Walking Lunges","Reverse Lunges","Bulgarian Split Squat","Leg Extension","Leg Curl","Seated Leg Curl","Calf Raises","Seated Calf Raise","Hip Thrust","Glute Bridge","Step-Ups","Box Squat","Sissy Squat"],Shoulders:["Overhead Press","Seated Dumbbell Press","Arnold Press","Lateral Raise","Cable Lateral Raise","Front Raise","Rear Delt Fly","Reverse Pec Deck","Upright Row","Barbell Shrugs","Dumbbell Shrugs","Face Pulls","Lu Raise","Z Press","Behind the Neck Press"],Arms:["Barbell Curl","EZ Bar Curl","Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl","Preacher Curl","Concentration Curl","Cable Curl","Spider Curl","Bayesian Curl","Tricep Pushdown","Rope Pushdown","Skull Crushers","Overhead Tricep Extension","Close-Grip Bench Press","Tricep Dips","Tricep Kickback","Wrist Curl","Reverse Wrist Curl"],Core:["Plank","Side Plank","Crunches","Sit-Ups","Russian Twist","Leg Raises","Hanging Leg Raise","Hanging Knee Raise","Ab Rollout","Cable Crunch","Bicycle Crunch","Woodchoppers","Dead Bug","Pallof Press","Dragon Flag","V-Ups","Mountain Climbers","Flutter Kicks"],Cardio:["Treadmill","Elliptical","Rowing Machine","Cycling","Assault Bike","Jump Rope","Stair Climber","Swimming","Sprints","Sled Push","Battle Ropes","Box Jumps","Burpees","Farmer Walk","Hiking","HIIT Circuit"]};
var ICO={Chest:"🏋️",Back:"🔙",Legs:"🦵",Shoulders:"🫁",Arms:"💪",Core:"🧘",Cardio:"🏃"};
var QUOTES=[
{t:"The last three or four reps is what makes the muscle grow.",a:"Arnold Schwarzenegger"},
{t:"The only bad workout is the one that didn't happen.",a:"Unknown"},
{t:"Success isn't always about greatness. It's about consistency.",a:"Dwayne Johnson"},
{t:"The pain you feel today will be the strength you feel tomorrow.",a:"Arnold Schwarzenegger"},
{t:"Don't count the days, make the days count.",a:"Muhammad Ali"},
{t:"The body achieves what the mind believes.",a:"Napoleon Hill"},
{t:"Strength does not come from winning. Your struggles develop your strengths.",a:"Arnold Schwarzenegger"},
{t:"No matter how slow you go, you are still lapping everybody on the couch.",a:"Unknown"},
{t:"You don't have to be extreme, just consistent.",a:"Unknown"},
{t:"The difference between try and triumph is a little umph.",a:"Marvin Phillips"},
{t:"What seems impossible today will one day become your warmup.",a:"Unknown"},
{t:"Discipline is choosing what you want most over what you want now.",a:"Abraham Lincoln"},
{t:"Your body can stand almost anything. It's your mind you have to convince.",a:"Unknown"},
{t:"The iron never lies to you. Two hundred pounds is always two hundred pounds.",a:"Henry Rollins"},
{t:"Champions aren't made in gyms. Champions are made from something deep inside.",a:"Muhammad Ali"}
];
var PLATE_COLORS={"45":"#ef4444","35":"#3b82f6","25":"#22c55e","10":"#facc15","5":"#c084fc","2.5":"#ec4899"};
var PLATE_W=[45,35,25,10,5,2.5];
var MEAS_FIELDS=["Chest","Left Arm","Right Arm","Waist","Hips","Left Thigh","Right Thigh","Neck"];
var ACH_LIST=[
{id:"first",name:"First Rep",desc:"Log your first workout",icon:"🎯",check:function(){return Object.keys(W).length>=1}},
{id:"s3",name:"3 Day Streak",desc:"Work out 3 days in a row",icon:"🔥",check:function(){return getStreak()>=3||bestStreak()>=3}},
{id:"s7",name:"Week Warrior",desc:"7 day streak",icon:"⚡",check:function(){return getStreak()>=7||bestStreak()>=7}},
{id:"s30",name:"Iron Will",desc:"30 day streak",icon:"🏆",check:function(){return getStreak()>=30||bestStreak()>=30}},
{id:"w10",name:"Getting Started",desc:"Complete 10 workouts",icon:"💪",check:function(){return Object.keys(W).filter(function(d){return W[d].length>0}).length>=10}},
{id:"w50",name:"Dedicated",desc:"Complete 50 workouts",icon:"🦾",check:function(){return Object.keys(W).filter(function(d){return W[d].length>0}).length>=50}},
{id:"w100",name:"Centurion",desc:"Complete 100 workouts",icon:"👑",check:function(){return Object.keys(W).filter(function(d){return W[d].length>0}).length>=100}},
{id:"pr5",name:"PR Machine",desc:"Set 5 personal records",icon:"📈",check:function(){return Object.keys(PR).length>=5}},
{id:"pr15",name:"Record Breaker",desc:"Set 15 personal records",icon:"💎",check:function(){return Object.keys(PR).length>=15}},
{id:"v100k",name:"Volume King",desc:"Accumulate 100,000 lbs total volume",icon:"🏔️",check:function(){var t=0;Object.keys(W).forEach(function(d){W[d].forEach(function(e){e.sets.forEach(function(s){t+=s.r*s.w})})});return t>=100000}},
{id:"v500k",name:"Half Ton Club",desc:"500,000 lbs total volume",icon:"🌋",check:function(){var t=0;Object.keys(W).forEach(function(d){W[d].forEach(function(e){e.sets.forEach(function(s){t+=s.r*s.w})})});return t>=500000}},
{id:"allgrp",name:"Well Rounded",desc:"Train all 7 muscle groups",icon:"🎯",check:function(){var g={};Object.keys(W).forEach(function(d){W[d].forEach(function(e){g[e.group]=1})});return Object.keys(g).length>=7}},
{id:"bw14",name:"Weight Watcher",desc:"Log body weight 14 days",icon:"⚖️",check:function(){return Object.keys(BW).length>=14}},
{id:"tpl3",name:"Planner",desc:"Create 3 templates",icon:"📋",check:function(){return TPL.length>=3}}
];
 
function ld(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function sv(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var W=ld("il_w",{}),BW=ld("il_bw",{}),TPL=ld("il_tpl",[]),PR=ld("il_pr",{}),CX=ld("il_cx",{}),TH=ld("il_th","dark");
var FAVS=ld("il_fav",{}),HIDDEN=ld("il_hid",{}),RATINGS=ld("il_rat",{}),GOALS=ld("il_goals",{});
var MEAS=ld("il_meas",{}); // {date:{field:value}}
var ACHV=ld("il_achv",{}); // {id:date}
var WTARGETS=ld("il_wt",{}); // {group:targetSetsPerWeek}
 
 // =====================
// NUTRITION (DATA MODEL)
// =====================
// NLOG: { "YYYY-MM-DD": [ { id, name, grams, servings, cal, p, c, f, at } ] }
// NFOODS: { "<nameLower>": { name, per100: { cal, p, c, f }, serving: { label, grams } } }
// NGOALS: { cal, p, c, f }
var NLOG = ld("il_nlog", {});
var NFOODS = ld("il_nfoods", {
  "chicken breast cooked": { name:"Chicken Breast (cooked)", per100:{cal:165,p:31,c:0,f:3.6}, serving:{label:"6 oz", grams:170} },
  "white rice cooked":     { name:"White Rice (cooked)",     per100:{cal:130,p:2.7,c:28.2,f:0.3}, serving:{label:"150 g", grams:150} },
  "egg":                   { name:"Whole Egg",               per100:{cal:143,p:13,c:1.1,f:9.5}, serving:{label:"1 large", grams:50} },
  "oats":                  { name:"Oats (dry)",              per100:{cal:389,p:16.9,c:66.3,f:6.9}, serving:{label:"40 g", grams:40} },
  "banana":                { name:"Banana",                  per100:{cal:89,p:1.1,c:23,f:0.3}, serving:{label:"1 medium", grams:118} },
  "olive oil":             { name:"Olive Oil",               per100:{cal:884,p:0,c:0,f:100}, serving:{label:"1 tbsp", grams:13.5} },
  "greek yogurt nonfat":   { name:"Greek Yogurt (nonfat)",   per100:{cal:59,p:10.3,c:3.6,f:0.4}, serving:{label:"170 g cup", grams:170} }
});
var NGOALS = ld("il_ngoals", { cal: 2200, p: 175, c: 220, f: 65 });

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function r1(n){ return Math.round((n+Number.EPSILON)*10)/10; }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

function foodKey(name){ return (name||"").trim().toLowerCase(); }

function calcItemFromFood(food, grams, servings){
  grams = Math.max(0, grams||0);
  servings = Math.max(0, servings||0);
  var g = grams>0 ? grams : (food.serving && food.serving.grams ? food.serving.grams*servings : 0);
  if(!g && servings && food.serving && food.serving.grams) g = food.serving.grams*servings;
  var mul = g/100;
  return {
    grams: g,
    cal: r1(food.per100.cal*mul),
    p: r1(food.per100.p*mul),
    c: r1(food.per100.c*mul),
    f: r1(food.per100.f*mul)
  };
}

function dayNutrition(date){
  var items = NLOG[date] || [];
  var t={cal:0,p:0,c:0,f:0};
  items.forEach(function(it){
    t.cal += (it.cal||0);
    t.p += (it.p||0);
    t.c += (it.c||0);
    t.f += (it.f||0);
  });
  return { items: items, totals: { cal:r1(t.cal), p:r1(t.p), c:r1(t.c), f:r1(t.f) } };
}

function goalPct(val, goal){ if(!goal || goal<=0) return 0; return clamp((val/goal)*100, 0, 150); }

function macroColor(pct){
  // simple: under = blue/purple, hit = green, over = orange/red
  if(pct >= 100 && pct <= 115) return "var(--gn)";
  if(pct > 115) return "var(--or)";
  return "linear-gradient(to right,var(--bl),var(--pu))";
}

 
 
function saveAll(){sv("il_w",W);sv("il_bw",BW);sv("il_tpl",TPL);sv("il_pr",PR);sv("il_cx",CX);sv("il_th",TH);sv("il_fav",FAVS);sv("il_hid",HIDDEN);sv("il_rat",RATINGS);sv("il_goals",GOALS); sv("il_nlog",NLOG);
  sv("il_nfoods",NFOODS);
  sv("il_ngoals",NGOALS);sv("il_meas",MEAS);sv("il_achv",ACHV);sv("il_wt",WTARGETS)}
 
var view="log",selDate=tod(),step=0,selGrp="",selEx="",sets=[{r:10,w:0}],note="",isSuper=false,selLift="",calM=new Date().getMonth(),calY=new Date().getFullYear(),wStart=null,exSearch="",showManage=false,moreTab="prs";
var timerOn=false,timerSec=0,timerInt=null;
 
function tod(){return new Date().toISOString().split("T")[0]}
function fmtD(d){return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
function fmtS(d){return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
function gc(g){return g.toLowerCase()}
function e1rm(w,r){return r<=0||w<=0?0:r===1?w:Math.round(w*(1+r/30))}
 
function getExList(grp){var c=CX[grp]||[],b=EX[grp]||[],h=HIDDEN[grp]||[],f=FAVS[grp]||[],all=c.concat(b);if(!showManage)all=all.filter(function(e){return h.indexOf(e)<0});if(exSearch){var s=exSearch.toLowerCase();all=all.filter(function(e){return e.toLowerCase().indexOf(s)>=0})}all.sort(function(a,b){return(f.indexOf(a)>=0?0:1)-(f.indexOf(b)>=0?0:1)});return all}
function isFav(g,e){return(FAVS[g]||[]).indexOf(e)>=0}
function isHidden(g,e){return(HIDDEN[g]||[]).indexOf(e)>=0}
function isCustom(g,e){return(CX[g]||[]).indexOf(e)>=0}
function toggleFav(g,e){if(!FAVS[g])FAVS[g]=[];var i=FAVS[g].indexOf(e);if(i>=0)FAVS[g].splice(i,1);else FAVS[g].push(e);saveAll();render()}
function toggleHide(g,e){if(!HIDDEN[g])HIDDEN[g]=[];var i=HIDDEN[g].indexOf(e);if(i>=0)HIDDEN[g].splice(i,1);else HIDDEN[g].push(e);saveAll();render()}
function checkPR(ex,w,r){if(w<=0)return false;var est=e1rm(w,r);var prev=PR[ex];if(!prev||est>prev.e1rm){PR[ex]={w:w,r:r,e1rm:est,date:selDate};return true}return false}
function getStreak(){var s=0,d=new Date();var ds=d.toISOString().split("T")[0];if(!W[ds]||!W[ds].length)d.setDate(d.getDate()-1);while(true){var k=d.toISOString().split("T")[0];if(W[k]&&W[k].length>0){s++;d.setDate(d.getDate()-1)}else break}return s}
function bestStreak(){var dates=Object.keys(W).filter(function(d){return W[d].length>0}).sort();if(!dates.length)return 0;var mx=1,c=1;for(var i=1;i<dates.length;i++){var diff=(new Date(dates[i]+"T12:00:00")-new Date(dates[i-1]+"T12:00:00"))/86400000;if(diff===1){c++;if(c>mx)mx=c}else c=1}return mx}
function getPrevPerf(n){var dates=Object.keys(W).sort().reverse();for(var i=0;i<dates.length;i++){if(dates[i]===selDate)continue;var day=W[dates[i]];for(var j=0;j<day.length;j++){if(day[j].exercise===n)return{date:dates[i],sets:day[j].sets}}}return null}
function getAllEx(){var s={};Object.keys(W).forEach(function(d){W[d].forEach(function(e){s[e.exercise]=1})});return Object.keys(s).sort()}
function liftHist(n){var data=[];Object.keys(W).sort().forEach(function(d){W[d].forEach(function(e){if(e.exercise===n){var mx=0;e.sets.forEach(function(s){if(s.w>mx)mx=s.w});data.push({date:d,max:mx})}})});return data}
function getOverloadSuggestion(n){var p=getPrevPerf(n);if(!p)return null;var best=p.sets[0];p.sets.forEach(function(s){if(s.w>best.w||(s.w===best.w&&s.r>best.r))best=s});return{w1:best.w,r1:best.r,opt1:{w:Math.ceil((best.w+5)/5)*5,r:best.r},opt2:{w:best.w,r:best.r+1}}}
function calcPlates(total){var perSide=(total-45)/2;if(perSide<=0)return[];var plates=[];PLATE_W.forEach(function(p){while(perSide>=p){plates.push(p);perSide-=p}});return plates}
function calcWarmup(working){if(working<=45)return[];var wu=[];var pcts=[.4,.55,.7,.85];pcts.forEach(function(p,i){var w=Math.round(working*p/5)*5;if(w<45)w=45;wu.push({w:w,r:i<2?8:i<3?5:3})});return wu}
function estCalories(day){var totalSets=0,totalReps=0;day.forEach(function(e){e.sets.forEach(function(s){totalSets++;totalReps+=s.r})});return Math.round(totalSets*8+totalReps*0.5+totalSets*2)}
function getRecovery(){var rec={};var now=new Date();Object.keys(EX).forEach(function(g){var lastDate=null;Object.keys(W).sort().reverse().forEach(function(d){if(!lastDate){W[d].forEach(function(e){if(e.group===g&&!lastDate)lastDate=d})}});if(lastDate){var diff=Math.floor((now-new Date(lastDate+"T12:00:00"))/86400000);rec[g]={days:diff,status:diff>=3?"fresh":diff>=2?"ready":diff>=1?"recovering":"sore"}}else{rec[g]={days:99,status:"fresh"}}});return rec}
function getWeekSets(){var counts={};var now=new Date(),dow=now.getDay();for(var i=0;i<7;i++){var d=new Date(now);d.setDate(d.getDate()-dow+i);var dk=d.toISOString().split("T")[0];if(W[dk])W[dk].forEach(function(e){counts[e.group]=(counts[e.group]||0)+e.sets.length})}return counts}
function checkAchievements(){var newOnes=[];ACH_LIST.forEach(function(a){if(!ACHV[a.id]&&a.check()){ACHV[a.id]=tod();newOnes.push(a)}});if(newOnes.length){saveAll()}return newOnes}
function confetti(){var el=document.getElementById("confetti-mount");var colors=["#ef4444","#3b82f6","#22c55e","#facc15","#a855f7","#ec4899","#fb923c","#22d3ee"];var h='<div class="confetti-wrap">';for(var i=0;i<60;i++){var c=colors[Math.floor(Math.random()*colors.length)];var l=Math.random()*100;var d=Math.random()*2+1;var sz=Math.random()*8+6;var rot=Math.random()*360;h+='<div class="confetti-piece" style="left:'+l+'%;animation-delay:'+d*0.3+'s;animation-duration:'+(d+1.5)+'s;width:'+sz+'px;height:'+sz+'px;background:'+c+';border-radius:'+(Math.random()>.5?'50%':'2px')+';transform:rotate('+rot+'deg)"></div>'}
h+='</div>';el.innerHTML=h;setTimeout(function(){el.innerHTML=""},4000)}
function todayQuote(){var idx=Math.floor(new Date().getTime()/86400000)%QUOTES.length;return QUOTES[idx]}
 
// Timer
function startRest(sec){clearInterval(timerInt);timerSec=sec;timerOn=true;updTimer();timerInt=setInterval(function(){timerSec--;updTimer();if(timerSec<=0){clearInterval(timerInt);timerOn=false;try{if(navigator.vibrate)navigator.vibrate([200,100,200,100,200])}catch(e){}updTimer()}},1000)}
function stopRest(){clearInterval(timerInt);timerOn=false;timerSec=0;updTimer()}
function updTimer(){var el=document.getElementById("tbar"),tt=document.getElementById("ttime"),tg=document.getElementById("tgo");if(!timerOn&&timerSec<=0){el.classList.remove("on");return}el.classList.add("on");var m=Math.floor(Math.max(timerSec,0)/60),s=Math.max(timerSec,0)%60;tt.textContent=m+":"+(s<10?"0":"")+s;tt.style.color=timerSec<=5&&timerSec>0?"var(--rd)":"var(--tx)";tg.style.display=timerSec<=0?"inline":"none"}
var tstop = document.getElementById("tstop");
if (tstop) {
  tstop.addEventListener("click", stopRest);
}
 
function applyTheme() {
  document.body.setAttribute("data-theme", TH === "light" ? "light" : "");
  var b = document.getElementById("thm-btn");
  if (b) b.textContent = TH === "dark" ? "🌙" : "☀️";
}
var themeBtn = document.getElementById("thm-btn");
if (themeBtn) {
  themeBtn.addEventListener("click", function () {
    TH = TH === "dark" ? "light" : "dark";
    applyTheme();
    sv("il_th", TH);
  });
}

applyTheme();

document.querySelectorAll(".nb").forEach(function(btn){
  btn.addEventListener("click", function(){
    view = this.getAttribute("data-v");
    document.querySelectorAll(".nb").forEach(function(b){ b.classList.remove("on"); });
    this.classList.add("on");
    render();
  });
});
 
function showModal(html){var el=document.getElementById("mover");el.style.display="flex";el.innerHTML='<div class="mover-bg"><div class="modal">'+html+'</div></div>';el.querySelector(".mover-bg").addEventListener("click",function(e){if(e.target===this)closeModal()})}
function closeModal(){var el=document.getElementById("mover");el.style.display="none";el.innerHTML=""}
 
function drawChart(id,labels,datasets){setTimeout(function(){var cv=document.getElementById(id);if(!cv)return;var ctx=cv.getContext("2d"),dpr=window.devicePixelRatio||1,r=cv.getBoundingClientRect();cv.width=r.width*dpr;cv.height=r.height*dpr;ctx.scale(dpr,dpr);var Cw=r.width,Ch=r.height,p={t:16,r:12,b:34,l:44},cW=Cw-p.l-p.r,cH=Ch-p.t-p.b;var all=[];datasets.forEach(function(d){all=all.concat(d.data)});var mn=Math.min.apply(null,all),mx=Math.max.apply(null,all);if(mn===mx){mn-=10;mx+=10}var rng=mx-mn;mn-=rng*.08;mx+=rng*.08;ctx.fillStyle=TH==="dark"?"#0a0f1a":"#f9fafb";ctx.fillRect(0,0,Cw,Ch);ctx.strokeStyle=TH==="dark"?"#1f2937":"#d1d5db";ctx.lineWidth=1;for(var i=0;i<=4;i++){var y=p.t+cH-(i/4)*cH;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(Cw-p.r,y);ctx.stroke();ctx.fillStyle=TH==="dark"?"#6b7280":"#9ca3af";ctx.font="10px -apple-system,sans-serif";ctx.textAlign="right";ctx.fillText(Math.round(mn+((mx-mn)*i/4)),p.l-6,y+3)}ctx.fillStyle=TH==="dark"?"#6b7280":"#9ca3af";ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";var stp=Math.max(1,Math.floor(labels.length/6));for(var i=0;i<labels.length;i+=stp){var x=p.l+(i/Math.max(labels.length-1,1))*cW;ctx.save();ctx.translate(x,Ch-p.b+12);ctx.rotate(-.35);ctx.fillText(labels[i],0,0);ctx.restore()}datasets.forEach(function(ds){if(ds.data.length<2)return;var n=ds.data.length;var grd=ctx.createLinearGradient(0,p.t,0,p.t+cH);grd.addColorStop(0,ds.color+"35");grd.addColorStop(1,ds.color+"00");ctx.beginPath();ds.data.forEach(function(v,i){var x=p.l+(i/Math.max(n-1,1))*cW,y=p.t+cH-((v-mn)/(mx-mn))*cH;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.lineTo(p.l+((n-1)/Math.max(n-1,1))*cW,p.t+cH);ctx.lineTo(p.l,p.t+cH);ctx.closePath();ctx.fillStyle=grd;ctx.fill();ctx.beginPath();ctx.strokeStyle=ds.color;ctx.lineWidth=2.5;ctx.lineJoin="round";ds.data.forEach(function(v,i){var x=p.l+(i/Math.max(n-1,1))*cW,y=p.t+cH-((v-mn)/(mx-mn))*cH;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ds.data.forEach(function(v,i){var x=p.l+(i/Math.max(n-1,1))*cW,y=p.t+cH-((v-mn)/(mx-mn))*cH;ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=ds.color;ctx.fill();ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fillStyle=TH==="dark"?"#0a0f1a":"#f9fafb";ctx.fill()})})},60)}
 
function exCard(ex,date,idx){var g2=gc(ex.group);var h='<div class="exc '+g2+'-bd"><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px 6px"><div class="row" style="flex-wrap:wrap;gap:4px"><span class="badge '+g2+'-l '+g2+'-t">'+ex.group+'</span><span style="font-weight:700;font-size:12px">'+ex.exercise+'</span>';if(ex.superset)h+='<span class="ss-tag">⚡SS</span>';if(PR[ex.exercise]&&PR[ex.exercise].date===date)h+='<span class="pr-flash">🏆 PR</span>';h+='</div><button class="del rm-ex" data-date="'+date+'" data-i="'+idx+'">×</button></div><div style="padding:0 12px 10px"><div style="display:grid;grid-template-columns:1fr 1fr 1fr;font-size:10px;color:var(--mt);margin-bottom:2px;padding:0 4px"><span>Set</span><span style="text-align:center">Reps</span><span style="text-align:right">Weight</span></div>';ex.sets.forEach(function(s,j){h+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;font-size:12px;padding:3px 4px;border-radius:4px"><span style="color:var(--mt)">'+(j+1)+'</span><span style="text-align:center;font-weight:600">'+s.r+'</span><span style="text-align:right;font-weight:600">'+(s.w>0?s.w+' lbs':'BW')+'</span></div>'});h+='</div>';if(ex.note)h+='<div style="font-size:11px;color:var(--mt);padding:0 12px 10px;font-style:italic">📝 '+ex.note+'</div>';h+='</div>';return h}
 
function plateViz(total){if(total<=45)return'<div style="text-align:center;font-size:11px;color:var(--mt)">Just the bar (45 lbs)</div>';var plates=calcPlates(total);if(!plates.length)return'';var h='<div class="plate-bar">';plates.slice().reverse().forEach(function(p){var ht=p>=45?60:p>=25?48:p>=10?36:24;var wd=p>=25?16:12;h+='<div class="plate" style="height:'+ht+'px;width:'+wd+'px;background:'+(PLATE_COLORS[String(p)]||"#888")+'">'+p+'</div>'});h+='<div class="bar-center"></div>';plates.forEach(function(p){var ht=p>=45?60:p>=25?48:p>=10?36:24;var wd=p>=25?16:12;h+='<div class="plate" style="height:'+ht+'px;width:'+wd+'px;background:'+(PLATE_COLORS[String(p)]||"#888")+'">'+p+'</div>'});h+='</div><div style="text-align:center;font-size:10px;color:var(--mt)">Each side: '+plates.join(" + ")+'</div>';return h}
 
// ═══ RENDER ═══
function render(){
var app=document.getElementById("app"),day=W[selDate]||[],h="";
 
if(view==="log"){
  // Quote
  var q=todayQuote();
  h+='<div class="quote-box"><div class="quote-text">"'+q.t+'"</div><div class="quote-author">— '+q.a+'</div></div>';
  // Date
  h+='<div class="card" style="padding:8px"><div class="row" style="justify-content:space-between"><button class="pm" id="d-prev">←</button><div style="text-align:center"><div style="font-size:15px;font-weight:700">'+fmtD(selDate)+'</div><div style="font-size:10px;color:var(--mt)">'+(selDate===tod()?"Today":selDate)+'</div></div><button class="pm" id="d-next">→</button></div></div>';
  // Body weight
  var bw=BW[selDate];
  h+='<div class="card"><div class="row" style="justify-content:space-between"><div><div style="font-size:10px;color:var(--mt);text-transform:uppercase;font-weight:600">⚖️ Body Weight</div>';
  h+=bw?'<div style="font-size:20px;font-weight:800;color:var(--pk)">'+bw+' lbs</div>':'<div style="font-size:11px;color:var(--mt)">Not logged</div>';
  h+='</div><div class="row"><input type="number" class="inp" id="bw-inp" style="width:75px" placeholder="'+(bw||"lbs")+'" value="'+(bw||"")+'"><button class="btn bs" id="bw-btn" style="padding:8px 12px">'+(bw?"✓":"Log")+'</button></div></div></div>';
  // Recovery
  var rec=getRecovery();
  h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px">🧘 Muscle Recovery</div><div class="rec-grid">';
  Object.keys(rec).forEach(function(g){var r=rec[g];var col=r.status==="fresh"?"var(--gn)":r.status==="ready"?"var(--yl)":r.status==="recovering"?"var(--or)":"var(--rd)";var lbl=r.days>=99?"No data":r.days+"d ago";h+='<div class="rec-item"><span>'+ICO[g]+' '+g+'</span><div class="row" style="gap:4px"><span style="font-size:9px;color:var(--mt)">'+lbl+'</span><div class="rec-dot" style="background:'+col+'"></div></div></div>'});
  h+='</div></div>';
  // Weekly targets
  var wSets=getWeekSets(),hasTargets=false;Object.keys(WTARGETS).forEach(function(g){if(WTARGETS[g]>0)hasTargets=true});
  if(hasTargets){
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px">🎯 Weekly Volume Targets</div>';
    Object.keys(WTARGETS).forEach(function(g){if(WTARGETS[g]<=0)return;var done=wSets[g]||0,target=WTARGETS[g],pct=Math.min(100,Math.round(done/target*100));
    h+='<div class="wt-row"><div class="wt-head"><span class="wt-name">'+g+'</span><span class="wt-nums">'+done+'/'+target+' sets</span></div><div class="wt-bar"><div class="wt-fill" style="width:'+pct+'%;background:'+(pct>=100?'var(--gn)':'linear-gradient(to right,var(--bl),var(--pu))')+'"></div></div></div>'});
    h+='</div>';
  }
  // Duration & stats
  if(day.length>0&&!wStart)wStart=new Date();
  if(day.length){
    var vol=0,ts=0;day.forEach(function(e){e.sets.forEach(function(s){vol+=s.r*s.w;ts++})});var cal=estCalories(day);
    var dur=wStart?Math.round((new Date()-wStart)/60000):0;
    h+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">';
    h+='<div class="card" style="text-align:center;padding:8px;margin:0"><div style="font-size:18px;font-weight:800;color:#60a5fa">'+day.length+'</div><div style="font-size:8px;color:var(--mt);text-transform:uppercase">Exercises</div></div>';
    h+='<div class="card" style="text-align:center;padding:8px;margin:0"><div style="font-size:18px;font-weight:800;color:#c084fc">'+ts+'</div><div style="font-size:8px;color:var(--mt);text-transform:uppercase">Sets</div></div>';
    h+='<div class="card" style="text-align:center;padding:8px;margin:0"><div style="font-size:18px;font-weight:800;color:#4ade80">'+vol.toLocaleString()+'</div><div style="font-size:8px;color:var(--mt);text-transform:uppercase">Volume</div></div>';
    h+='<div class="card" style="text-align:center;padding:8px;margin:0"><div style="font-size:18px;font-weight:800;color:var(--or)">~'+cal+'</div><div style="font-size:8px;color:var(--mt);text-transform:uppercase">Calories</div></div></div>';
    if(dur>0)h+='<div style="text-align:center;font-size:10px;color:var(--mt);margin-bottom:8px">⏱ '+dur+' min</div>';
  }
  // Rest timer
  h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px">⏱️ Rest Timer</div><div class="row" style="gap:6px;flex-wrap:wrap">';
  [30,60,90,120,180].forEach(function(s){h+='<button class="btn bs rest-btn" data-sec="'+s+'" style="flex:1;min-width:50px;padding:8px 4px;font-size:12px">'+(s<60?s+'s':(s/60)+'m')+'</button>'});
  h+='</div></div>';
  // Logged
  if(day.length){
    h+='<div class="row" style="justify-content:space-between;margin-top:4px"><div class="sect" style="margin:0">Today\'s Workout</div><button class="btn bs" id="save-tpl" style="padding:5px 10px;font-size:10px">💾 Template</button></div><div style="height:8px"></div>';
    var i=0;while(i<day.length){var ex=day[i];if(ex.superset&&i+1<day.length&&day[i+1].superset){h+='<div class="ss-wrap"><div class="ss-lbl">⚡ SUPERSET</div>';while(i<day.length&&day[i].superset){h+=exCard(day[i],selDate,i);i++}h+='</div>'}else{h+=exCard(ex,selDate,i);i++}}
    // Rating
    var rating=RATINGS[selDate]||0;
    h+='<div class="card" style="text-align:center"><div style="font-size:12px;font-weight:600;color:var(--mt);margin-bottom:6px">How was this workout?</div><div class="rating">';
    for(var s=1;s<=5;s++)h+='<button class="rating-star rate-btn'+(s<=rating?' on':'')+'" data-r="'+s+'">⭐</button>';
    h+='</div></div>';
  }
  // Add exercise
  h+='<div class="card" style="margin-top:8px"><div style="font-size:13px;font-weight:700;margin-bottom:10px">➕ Add Exercise</div>';
  if(step===0){
    h+='<div class="mgrid">';Object.keys(EX).forEach(function(gr){var cnt=getExList(gr).length;h+='<button class="mb grp-btn '+gc(gr)+'-bg" data-grp="'+gr+'"><div style="font-size:18px;margin-bottom:2px">'+ICO[gr]+'</div><div style="font-weight:700;font-size:12px">'+gr+'</div><div style="font-size:9px;opacity:.75">'+cnt+' exercises</div></button>'});h+='</div>';
  } else if(step===1){
    h+='<button class="btn bs back-btn" style="padding:6px 12px;font-size:12px;margin-bottom:8px">← Back</button>';
    h+='<div class="row" style="margin-bottom:8px;justify-content:space-between"><div class="row"><span style="font-size:18px">'+ICO[selGrp]+'</span><span style="font-weight:800;font-size:14px">'+selGrp+'</span></div><button class="manage-ex" id="toggle-manage">'+(showManage?'✓ Done':'⚙️ Manage')+'</button></div>';
    h+='<input type="text" class="search-inp" id="ex-search" placeholder="🔍 Search exercises// ..." value="'+exSearch+'">';
    h+='<div class="row" style="margin-bottom:8px;gap:6px"><input type="text" class="inp" id="cx-inp" style="flex:1;text-align:left;padding:0 12px;font-size:12px" placeholder="Add custom exercise// ..."><button class="btn bp" id="cx-add" style="padding:8px 14px;font-size:12px">+</button></div>';
    getExList(selGrp).forEach(function(name){
      if(showManage){
        var fav=isFav(selGrp,name),hid=isHidden(selGrp,name),cust=isCustom(selGrp,name);
        h+='<div class="row" style="margin-bottom:4px;gap:4px"><button class="fav-star fav-btn" data-ex="'+name+'">'+(fav?'⭐':'☆')+'</button><div style="flex:1;font-size:12px;font-weight:600;opacity:'+(hid ? 0.4 : 1)+'">'+name+(cust?' <span style="font-size:9px;color:var(--pu)">★</span>':'')+'</div><button class="btn bs hide-toggle" data-ex="'+name+'" style="padding:3px 8px;font-size:9px">'+(hid?'Show':'Hide')+'</button>';
        if(cust)h+='<button class="del cx-del" data-ex="'+name+'">🗑</button>';
        h+='</div>';
      } else {
        h+='<button class="exb ex-pick" data-ex="'+name+'">'+(isFav(selGrp,name)?'⭐ ':'')+name+(isCustom(selGrp,name)?' <span style="font-size:9px;color:var(--pu)">★</span>':'')+'</button>';
      }
    });
  } else if(step===2){
    h+='<button class="btn bs back-btn" style="padding:6px 12px;font-size:12px;margin-bottom:8px">← Back</button>';
    h+='<div class="row" style="padding:10px;border-radius:10px;margin-bottom:10px;background:var(--c2)"><span class="badge '+gc(selGrp)+'-l '+gc(selGrp)+'-t">'+selGrp+'</span><span style="font-weight:700;font-size:13px;margin-left:4px">'+selEx+'</span>';
    if(PR[selEx])h+='<span style="font-size:10px;color:var(--mt);margin-left:auto">PR: '+PR[selEx].e1rm+'</span>';
    h+='</div>';
    // Goal
    var goal=GOALS[selEx];if(goal){var b2=PR[selEx]?PR[selEx].e1rm:0,pct=Math.min(100,Math.round(b2/goal*100));h+='<div style="font-size:10px;color:var(--mt);margin-bottom:4px">🎯 Goal: '+goal+' lbs ('+pct+'%)</div><div class="goal-bar"><div class="goal-fill" style="width:'+pct+'%;background:'+(pct>=100?'var(--gn)':'linear-gradient(to right,var(--bl),var(--pu))')+'"></div></div><div style="height:6px"></div>'}
    h+='<div class="row" style="margin-bottom:8px;gap:6px"><input type="number" class="inp" id="goal-inp" style="width:80px;font-size:11px" placeholder="Goal lbs" value="'+(goal||'')+'"><button class="btn bs" id="goal-btn" style="padding:5px 8px;font-size:10px">🎯 Set</button></div>';
    // Overload suggestion
    var ol=getOverloadSuggestion(selEx);
    if(ol){h+='<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:10px;padding:10px;margin-bottom:10px;font-size:11px"><div style="font-weight:700;color:var(--gn);margin-bottom:4px">📈 Progressive Overload</div><div style="color:var(--mt)">Last: '+ol.w1+' × '+ol.r1+'</div><div style="margin-top:4px">Try: <strong style="color:var(--tx)">'+ol.opt1.w+' × '+ol.opt1.r+'</strong> or <strong style="color:var(--tx)">'+ol.opt2.w+' × '+ol.opt2.r+'</strong></div></div>'}
    // Prev
    var prev=getPrevPerf(selEx);if(prev){h+='<div class="prev-perf">📊 Last ('+fmtS(prev.date)+'): '+prev.sets.map(function(s){return s.r+'×'+(s.w>0?s.w:'BW')}).join(', ')+'</div>'}
    // Sets
    h+='<div style="display:grid;grid-template-columns:32px 1fr 1fr 24px;gap:6px;font-size:10px;color:var(--mt);margin-bottom:4px;padding:0 2px"><span>Set</span><span style="text-align:center">Reps</span><span style="text-align:center">Weight</span><span></span></div>';
    sets.forEach(function(s,i){h+='<div style="display:grid;grid-template-columns:32px 1fr 1fr 24px;gap:6px;align-items:center;margin-bottom:5px"><div style="text-align:center;color:var(--mt);font-weight:600;font-size:12px">'+(i+1)+'</div><div class="row" style="gap:2px"><button class="pm set-pm" data-i="'+i+'" data-f="r" data-d="-1">-</button><input class="inp set-inp" data-i="'+i+'" data-f="r" type="number" value="'+s.r+'" style="flex:1;min-width:0;height:34px;font-size:13px"><button class="pm set-pm" data-i="'+i+'" data-f="r" data-d="1">+</button></div><div class="row" style="gap:2px"><button class="pm set-pm" data-i="'+i+'" data-f="w" data-d="-5">-</button><input class="inp set-inp" data-i="'+i+'" data-f="w" type="number" value="'+s.w+'" style="flex:1;min-width:0;height:34px;font-size:13px"><button class="pm set-pm" data-i="'+i+'" data-f="w" data-d="5">+</button></div><button class="del set-rm" data-i="'+i+'">'+(sets.length>1?'×':'')+'</button></div>';if(s.w>0&&s.r>0)h+='<div style="text-align:right;font-size:9px;color:var(--mt);margin:-2px 30px 4px 0">Est 1RM: '+e1rm(s.w,s.r)+'</div>'});
    h+='<button class="btn bs bf" id="add-set" style="margin-bottom:10px;border:2px dashed var(--c3);background:none;color:var(--mt)">+ Add Set</button>';
    // Warmup
    var topW=Math.max.apply(null,sets.map(function(s){return s.w}));
    if(topW>=95){var wu=calcWarmup(topW);if(wu.length){h+='<div style="background:var(--c2);border-radius:10px;padding:10px;margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--or);margin-bottom:6px">🔥 Suggested Warmup</div>';wu.forEach(function(s){h+='<div class="wu-row"><span style="color:var(--mt)">'+s.r+' reps</span><span style="font-weight:700">'+s.w+' lbs</span></div>'});h+='</div>'}}
    // Plate calc
    if(topW>=50){h+='<div style="background:var(--c2);border-radius:10px;padding:10px;margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:var(--bl);margin-bottom:4px">🔢 Plate Calculator ('+topW+' lbs)</div>'+plateViz(topW)+'</div>'}
    h+='<textarea class="txta" id="ex-note" placeholder="Notes (optional)// ..." style="margin-bottom:10px">'+note+'</textarea>';
    h+='<div class="row" style="margin-bottom:12px"><span id="ss-toggle" style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer"><span style="width:20px;height:20px;border-radius:6px;border:2px solid '+(isSuper?'var(--pu)':'var(--c3)')+';background:'+(isSuper?'var(--pu)':'none')+';display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff">'+(isSuper?'✓':'')+'</span>⚡ Superset</span></div>';
    h+='<button class="btn bp bf" id="log-ex" style="padding:14px">Log Exercise</button>';
  }
  h+='</div>';
 
} else if(view==="templates"){
  h+='<div class="sect">Workout Templates</div>';
  if(!TPL.length)h+='<div class="empty"><div style="font-size:36px;margin-bottom:8px">📁</div>No templates yet.</div>';
  else TPL.forEach(function(t,i){var grps=[];t.exercises.forEach(function(e){if(grps.indexOf(e.group)<0)grps.push(e.group)});h+='<div class="card" style="margin-bottom:8px"><div class="row" style="justify-content:space-between"><div><div style="font-size:13px;font-weight:700">'+t.name+'</div><div style="font-size:10px;color:var(--mt)">'+t.exercises.length+' ex · '+grps.join(", ")+'</div></div><div class="row" style="gap:6px"><button class="btn bp tpl-load" data-i="'+i+'" style="padding:6px 12px;font-size:11px">Load</button><button class="btn bs tpl-del" data-i="'+i+'" style="padding:6px 10px;font-size:11px">🗑</button></div></div></div>'});
  // Weekly volume targets
  h+='<div class="sect">🎯 Weekly Volume Targets (sets/week)</div><div class="card">';
  Object.keys(EX).forEach(function(g){var v=WTARGETS[g]||0;h+='<div class="row" style="justify-content:space-between;margin-bottom:6px"><span style="font-size:12px;font-weight:600">'+ICO[g]+' '+g+'</span><div class="row" style="gap:4px"><button class="pm wt-pm" data-g="'+g+'" data-d="-2" style="width:26px;height:28px;font-size:12px">-</button><span style="font-size:13px;font-weight:700;width:24px;text-align:center">'+v+'</span><button class="pm wt-pm" data-g="'+g+'" data-d="2" style="width:26px;height:28px;font-size:12px">+</button></div></div>'});
  h+='</div>';
 
} else if(view==="history"){
  var mn2=["January","February","March","April","May","June","July","August","September","October","November","December"];
  h+='<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><button class="pm" id="cal-prev">←</button><div style="font-weight:700;font-size:14px">'+mn2[calM]+' '+calY+'</div><button class="pm" id="cal-next">→</button></div><div class="cal">';["S","M","T","W","T","F","S"].forEach(function(d){h+='<div class="cal-h">'+d+'</div>'});var fd=new Date(calY,calM,1).getDay(),dim=new Date(calY,calM+1,0).getDate();for(var i=0;i<fd;i++)h+='<div class="cal-d"></div>';for(var d=1;d<=dim;d++){var ds=calY+'-'+String(calM+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');h+='<div class="cal-d'+(W[ds]&&W[ds].length?' has':'')+(ds===tod()?' today':'')+'">'+d+'</div>'}h+='</div></div>';
  var sk=getStreak(),bk=bestStreak(),tw=Object.keys(W).filter(function(d){return W[d].length>0}).length;
  h+='<div class="streak"><div style="font-size:32px;font-weight:900;color:var(--or)">🔥 '+sk+'</div><div><div style="font-size:11px;color:var(--mt)">Current Streak</div><div style="font-size:14px;font-weight:700">'+sk+' day'+(sk!==1?'s':'')+'</div><div style="font-size:11px;color:var(--mt);margin-top:2px">Best: '+bk+' · Total: '+tw+'</div></div></div>';
  // Weekly
  var wV=0,wS2=0,wE=0,now=new Date(),dow=now.getDay();for(var i=0;i<7;i++){var d2=new Date(now);d2.setDate(d2.getDate()-dow+i);var dk=d2.toISOString().split("T")[0];if(W[dk]){wE+=W[dk].length;W[dk].forEach(function(e){e.sets.forEach(function(s){wV+=s.r*s.w;wS2++})})}}
  h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px">📅 This Week</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center"><div><div style="font-size:18px;font-weight:800;color:#60a5fa">'+wE+'</div><div style="font-size:9px;color:var(--mt)">Exercises</div></div><div><div style="font-size:18px;font-weight:800;color:#c084fc">'+wS2+'</div><div style="font-size:9px;color:var(--mt)">Sets</div></div><div><div style="font-size:18px;font-weight:800;color:#4ade80">'+wV.toLocaleString()+'</div><div style="font-size:9px;color:var(--mt)">Volume</div></div></div></div>';
  // Muscle split
  var gc2={},tE2=0;Object.keys(W).forEach(function(d){W[d].forEach(function(e){gc2[e.group]=(gc2[e.group]||0)+1;tE2++})});
  if(tE2){h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">🎯 Muscle Split</div>';Object.keys(gc2).sort(function(a,b){return gc2[b]-gc2[a]}).forEach(function(gr){var pct=Math.round(gc2[gr]/tE2*100);h+='<div style="margin-bottom:6px"><div class="row" style="justify-content:space-between;font-size:11px;margin-bottom:2px"><span style="font-weight:600">'+gr+'</span><span style="color:var(--mt)">'+pct+'%</span></div><div style="height:6px;background:var(--c2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(to right,var(--bl),var(--pu));border-radius:3px"></div></div></div>'});h+='</div>'}
  // History list
  h+='<div class="sect">All Workouts</div>';var dates=Object.keys(W).sort(function(a,b){return b.localeCompare(a)});
  if(!dates.length)h+='<div class="empty">No workouts yet.</div>';
  else dates.forEach(function(date){var entries=W[date],vol=0,ts=0,groups=[];entries.forEach(function(e){if(groups.indexOf(e.group)<0)groups.push(e.group);e.sets.forEach(function(s){vol+=s.r*s.w;ts++})});var bw2=BW[date],rat=RATINGS[date];
  h+='<div class="hc"><div style="padding:12px;border-bottom:1px solid rgba(128,128,128,.1)"><div class="row" style="justify-content:space-between;margin-bottom:6px"><div class="row" style="gap:6px"><span style="font-weight:800;font-size:14px">'+fmtD(date)+'</span>'+(rat?'<span style="font-size:10px">'+('⭐'.repeat(rat))+'</span>':'')+'</div><div class="row" style="gap:6px">'+(bw2?'<span style="font-size:10px;color:var(--mt)">⚖️'+bw2+'</span>':'')+'<button class="btn bs copy-day" data-date="'+date+'" style="padding:3px 8px;font-size:9px">📋Copy</button></div></div><div class="row" style="gap:4px;flex-wrap:wrap;margin-bottom:6px">';groups.forEach(function(gr){h+='<span class="badge '+gc(gr)+'-l '+gc(gr)+'-t">'+gr+'</span>'});h+='</div><div style="display:flex;gap:12px;font-size:10px;color:var(--mt)"><span>'+entries.length+' ex</span><span>'+ts+' sets</span><span>'+vol.toLocaleString()+' lbs</span></div></div>';
  entries.forEach(function(ex,i){h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-top:1px solid rgba(128,128,128,.05)"><div><div style="font-size:12px;font-weight:600">'+(ex.superset?'<span class="ss-tag">SS</span> ':'')+ex.exercise+'</div><div style="font-size:10px;color:var(--mt)">'+ex.sets.map(function(s){return s.r+'×'+(s.w>0?s.w:'BW')}).join(', ')+'</div></div><button class="del rm-ex" data-date="'+date+'" data-i="'+i+'">×</button></div>'});h+='</div>'});
 
} else if(view==="progress"){
  var bwD=Object.keys(BW).sort();
  h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:2px">⚖️ Body Weight</div>';
  if(bwD.length>=2){var f=BW[bwD[0]],l=BW[bwD[bwD.length-1]],df=l-f;h+='<div style="font-size:10px;color:var(--mt);margin-bottom:10px">Current: <strong style="color:var(--pk)">'+l+'</strong> <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;background:'+(df>0?'rgba(239,68,68,.15)':'rgba(34,197,94,.15)')+';color:'+(df>0?'#f87171':'#4ade80')+'">'+(df>0?'+':'')+df.toFixed(1)+'</span></div><canvas id="bw-ch"></canvas>'}else h+='<div style="font-size:10px;color:var(--mt)">Log weight 2+ days.</div>';h+='</div>';
  // Body measurements
  h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px">📏 Body Measurements (inches)</div>';
  var curM=MEAS[selDate]||{};
  h+='<div class="meas-grid">';
  MEAS_FIELDS.forEach(function(f){
    var v=curM[f]||"";
    // Find last measurement for comparison
    var lastV=null;var mdates=Object.keys(MEAS).sort().reverse();for(var i=0;i<mdates.length;i++){if(mdates[i]!==selDate&&MEAS[mdates[i]][f]){lastV=MEAS[mdates[i]][f];break}}
    h+='<div class="meas-item">';
    if(v){h+='<div class="meas-val">'+v+'"</div>';if(lastV){var d3=v-lastV;if(d3!==0)h+='<div class="meas-change" style="background:'+(d3>0?'rgba(59,130,246,.15);color:#60a5fa':'rgba(34,197,94,.15);color:#4ade80')+'">'+(d3>0?'+':'')+d3.toFixed(1)+'"</div>'}}
    else h+='<div class="meas-val" style="font-size:12px;color:var(--mt)">—</div>';
    h+='<div class="meas-lbl">'+f+'</div></div>'});
  h+='</div><div style="height:8px"></div><button class="btn bs bf" id="meas-btn">📏 Log Measurements</button></div>';
  // Strength
  var allE=getAllEx();h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:2px">💪 Strength</div><div style="font-size:10px;color:var(--mt);margin-bottom:8px">Max weight per session</div>';
  if(allE.length){if(!selLift||allE.indexOf(selLift)<0)selLift=allE[0];h+='<div class="pills">';allE.forEach(function(e){h+='<button class="pill lift-pill'+(e===selLift?' on':'')+'" data-ex="'+e+'">'+e+'</button>'});h+='</div>';var ld2=liftHist(selLift);if(ld2.length>=2){var df2=ld2[ld2.length-1].max-ld2[0].max;h+='<div style="font-size:11px;color:var(--mt);margin-bottom:8px">Latest: <strong style="color:var(--yl)">'+ld2[ld2.length-1].max+'</strong> <span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px;background:'+(df2>=0?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)')+';color:'+(df2>=0?'#4ade80':'#f87171')+'">'+(df2>0?'+':'')+df2+'</span></div><canvas id="lift-ch"></canvas>'}else h+='<div style="font-size:11px;color:var(--mt);padding:16px;text-align:center">Need 2+ sessions.</div>'}else h+='<div style="padding:16px;text-align:center;font-size:11px;color:var(--mt)">No data.</div>';h+='</div>';
  var wD=Object.keys(W).sort();if(wD.length>=2){h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:2px">📊 Volume</div><div style="font-size:10px;color:var(--mt);margin-bottom:10px">Per session</div><canvas id="vol-ch"></canvas></div>'}
 
} else if (view === "nutrition") {
  var dayData = dayNutrition(selDate);
  var totals = dayData.totals;

 h += '<div class="sect">🍽️ Nutrition</div>';
// Add Food Form
h += '<div class="card">';
h += '<div style="font-size:13px;font-weight:700;margin-bottom:10px">➕ Log Food</div>';

h += '<div class="row" style="gap:8px;margin-bottom:8px">';
h += '<input type="text" id="food-name" class="inp" placeholder="Food name" style="flex:1">';
h += '</div>';

h += '<div class="row" style="gap:8px;margin-bottom:8px">';
h += '<input type="number" id="food-grams" class="inp" placeholder="Grams" style="flex:1">';
h += '<input type="number" id="food-serv" class="inp" placeholder="Servings" style="flex:1">';
h += '</div>';

h += '<button class="btn bp" id="add-food-btn" style="width:100%">Add Food</button>';
h += '</div>';



  h += '<div class="sect">🍽️ Nutrition</div>';

  h += '<div class="card">';
  h += '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Daily Totals</div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">';
  h += '<div><div style="font-size:16px;font-weight:800">'+totals.cal+'</div><div style="font-size:10px;color:var(--mt)">Calories</div></div>';
  h += '<div><div style="font-size:16px;font-weight:800">'+totals.p+'g</div><div style="font-size:10px;color:var(--mt)">Protein</div></div>';
  h += '<div><div style="font-size:16px;font-weight:800">'+totals.c+'g</div><div style="font-size:10px;color:var(--mt)">Carbs</div></div>';
  h += '<div><div style="font-size:16px;font-weight:800">'+totals.f+'g</div><div style="font-size:10px;color:var(--mt)">Fat</div></div>';
  h += '</div>';
  h += '</div>';

  h += '<div class="card">';
  h += '<div style="font-size:13px;font-weight:700;margin-bottom:8px">Food Log</div>';

  if (!dayData.items.length) {
    h += '<div style="font-size:11px;color:var(--mt)">No food logged today.</div>';
  } else {
    dayData.items.forEach(function(it){
      h += '<div style="display:flex;justify-content:space-between;margin-bottom:6px">';
      h += '<div style="font-size:12px;font-weight:600">'+it.name+'</div>';
      h += '<div style="font-size:11px;color:var(--mt)">'+it.cal+' cal</div>';
      h += '</div>';
    });
  }

  h += '</div>';
 } else if (view === "more") {
  // Sub tabs
  h+='<div class="pills" style="margin-bottom:12px">';
  ["prs","achievements","tools","data"].forEach(function(t){var labels={prs:"🏆 PRs",achievements:"🏅 Achievements",tools:"🔧 Tools",data:"💾 Data"};h+='<button class="pill more-tab'+(moreTab===t?' on':'')+'" data-t="'+t+'">'+labels[t]+'</button>'});
  h+='</div>';
  if(moreTab==="prs"){
    var prList=Object.keys(PR).sort();if(!prList.length)h+='<div class="empty"><div style="font-size:36px;margin-bottom:8px">🏆</div>No PRs yet.</div>';
    else{h+='<div class="card">';prList.forEach(function(name){var pr=PR[name],goal=GOALS[name];h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--c2)"><div><div style="font-size:13px;font-weight:600">'+name+'</div><div style="font-size:11px;color:var(--mt)">'+pr.w+' × '+pr.r+' · '+fmtS(pr.date)+'</div>';if(goal){var pct=Math.min(100,Math.round(pr.e1rm/goal*100));h+='<div style="font-size:9px;color:var(--mt)">🎯 '+pct+'% of '+goal+'</div><div class="goal-bar" style="width:100px"><div class="goal-fill" style="width:'+pct+'%;background:'+(pct>=100?'var(--gn)':'linear-gradient(to right,var(--bl),var(--pu))')+'"></div></div>'}h+='</div><div style="text-align:right"><div style="font-size:16px;font-weight:800;color:var(--yl)">'+pr.e1rm+'</div><div style="font-size:9px;color:var(--mt)">Est 1RM</div></div></div>'});h+='</div>'}
  } else if(moreTab==="achievements"){
    var unlocked=0;ACH_LIST.forEach(function(a){if(ACHV[a.id])unlocked++});
    h+='<div style="text-align:center;margin-bottom:12px;font-size:13px;font-weight:700">'+unlocked+' / '+ACH_LIST.length+' Unlocked</div>';
    ACH_LIST.forEach(function(a){var done=!!ACHV[a.id];h+='<div class="ach-item'+(done?'':' locked')+'" style="background:var(--c'+(done?'1':'2')+')"><div class="ach-icon">'+a.icon+'</div><div class="ach-info"><div class="ach-name">'+a.name+'</div><div class="ach-desc">'+a.desc+(done?' · '+ACHV[a.id]:'')+'</div></div><div class="ach-check">'+(done?'✅':'🔒')+'</div></div>'});
  } else if(moreTab==="tools"){
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">🧮 1RM Calculator</div><div class="row" style="gap:8px;flex-wrap:wrap"><div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Weight</div><input type="number" class="inp" id="calc-w" style="width:80px"></div><div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Reps</div><input type="number" class="inp" id="calc-r" style="width:60px"></div><button class="btn bp" id="calc-btn" style="margin-top:14px">Calc</button></div><div id="calc-out" style="margin-top:10px"></div></div>';
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">🔢 Plate Calculator</div><div class="row" style="gap:8px"><div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Total Weight</div><input type="number" class="inp" id="plate-w" style="width:100px" placeholder="lbs"></div><button class="btn bp" id="plate-btn" style="margin-top:14px">Calculate</button></div><div id="plate-out" style="margin-top:10px"></div></div>';
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">🔥 Warmup Generator</div><div class="row" style="gap:8px"><div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Working Weight</div><input type="number" class="inp" id="wu-w" style="width:100px" placeholder="lbs"></div><button class="btn bp" id="wu-btn" style="margin-top:14px">Generate</button></div><div id="wu-out" style="margin-top:10px"></div></div>';
  } else if(moreTab==="data"){
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px">💾 Export / Import</div><div class="row" style="gap:8px"><button class="btn bs" id="export-btn" style="flex:1">📤 Export</button><button class="btn bs" id="import-btn" style="flex:1">📥 Import</button></div><input type="file" id="import-file" accept=".json" style="display:none"></div>';
    // Stats
    var tVol=0,tSets=0,tW2=Object.keys(W).filter(function(d){return W[d].length>0}).length;
    Object.keys(W).forEach(function(d){W[d].forEach(function(e){e.sets.forEach(function(s){tVol+=s.r*s.w;tSets++})})});
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:10px">📊 All-Time Stats</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
    h+='<div style="background:var(--c2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#60a5fa">'+tW2+'</div><div style="font-size:9px;color:var(--mt)">Workouts</div></div>';
    h+='<div style="background:var(--c2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#c084fc">'+tSets.toLocaleString()+'</div><div style="font-size:9px;color:var(--mt)">Total Sets</div></div>';
    h+='<div style="background:var(--c2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:#4ade80">'+tVol.toLocaleString()+'</div><div style="font-size:9px;color:var(--mt)">Total Volume</div></div>';
    h+='<div style="background:var(--c2);border-radius:10px;padding:10px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--yl)">'+Object.keys(PR).length+'</div><div style="font-size:9px;color:var(--mt)">PRs Set</div></div></div></div>';
    h+='<div class="card"><div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--rd)">🗑 Reset Data</div><button class="btn" id="reset-btn" style="background:var(--rd);color:#fff;width:100%">Reset All Data</button></div>';
  }
}
 
app.innerHTML=h;bindEvents();
// Check achievements
var newAch=checkAchievements();
if(newAch.length){setTimeout(function(){confetti();showModal('<div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:8px">🏅</div><div style="font-size:18px;font-weight:800;margin-bottom:4px">Achievement Unlocked!</div>'+newAch.map(function(a){return'<div style="font-size:14px;margin-top:8px">'+a.icon+' <strong>'+a.name+'</strong><br><span style="font-size:11px;color:var(--mt)">'+a.desc+'</span></div>'}).join('')+'<div style="margin-top:16px"><button class="btn bp" id="ach-close">Awesome!</button></div></div>');setTimeout(function(){var c=document.getElementById("ach-close");if(c)c.addEventListener("click",closeModal)},50)},300)}
// Charts
if(view==="progress"){var bwD2=Object.keys(BW).sort();if(bwD2.length>=2)drawChart("bw-ch",bwD2.map(fmtS),[{data:bwD2.map(function(d){return BW[d]}),color:"#ec4899"}]);if(getAllEx().length){var ld3=liftHist(selLift);if(ld3.length>=2)drawChart("lift-ch",ld3.map(function(d){return fmtS(d.date)}),[{data:ld3.map(function(d){return d.max}),color:"#facc15"}])}var wD2=Object.keys(W).sort();if(wD2.length>=2){var vd=wD2.map(function(d){var v=0;W[d].forEach(function(e){e.sets.forEach(function(s){v+=s.r*s.w})});return v});drawChart("vol-ch",wD2.map(fmtS),[{data:vd,color:"#8b5cf6"}])}}
}
 
function bindEvents(){
  var dp=document.getElementById("d-prev"),dn=document.getElementById("d-next");
  if(dp)dp.addEventListener("click",function(){var d=new Date(selDate+"T12:00:00");d.setDate(d.getDate()-1);selDate=d.toISOString().split("T")[0];render()});
  if(dn)dn.addEventListener("click",function(){var d=new Date(selDate+"T12:00:00");d.setDate(d.getDate()+1);selDate=d.toISOString().split("T")[0];render()});
  var bwb=document.getElementById("bw-btn");if(bwb)bwb.addEventListener("click",function(){var v=parseFloat(document.getElementById("bw-inp").value);if(!v||v<30||v>999)return;BW[selDate]=v;saveAll();render()});
  document.querySelectorAll(".rest-btn").forEach(function(b){b.addEventListener("click",function(){startRest(parseInt(this.getAttribute("data-sec")))})});
  var stpl=document.getElementById("save-tpl");if(stpl)stpl.addEventListener("click",function(){var day=W[selDate];if(!day||!day.length)return;var name=prompt("Name this template:");if(!name)return;TPL.push({name:name,exercises:day.map(function(e){return{group:e.group,exercise:e.exercise,sets:e.sets.map(function(s){return{r:s.r,w:s.w}})}})});saveAll();render()});
  document.querySelectorAll(".rate-btn").forEach(function(b){b.addEventListener("click",function(){RATINGS[selDate]=parseInt(this.getAttribute("data-r"));saveAll();render()})});
  document.querySelectorAll(".grp-btn").forEach(function(b){b.addEventListener("click",function(){selGrp=this.getAttribute("data-grp");step=1;selEx="";sets=[{r:10,w:0}];note="";isSuper=false;exSearch="";showManage=false;render()})});
  document.querySelectorAll(".back-btn").forEach(function(b){b.addEventListener("click",function(){if(step===2){step=1;selEx=""}else{step=0;selGrp=""}sets=[{r:10,w:0}];note="";isSuper=false;exSearch="";showManage=false;render()})});
  var mg=document.getElementById("toggle-manage");if(mg)mg.addEventListener("click",function(){showManage=!showManage;render()});
  var srch=document.getElementById("ex-search");if(srch)srch.addEventListener("input",function(){exSearch=this.value;render()});
  var cxA=document.getElementById("cx-add"),cxI=document.getElementById("cx-inp");
  if(cxA&&cxI){cxA.addEventListener("click",function(){var n=cxI.value.trim();if(!n)return;if(!CX[selGrp])CX[selGrp]=[];if(CX[selGrp].indexOf(n)>=0||EX[selGrp].indexOf(n)>=0)return;CX[selGrp].push(n);saveAll();render()});cxI.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();cxA.click()}})}
  document.querySelectorAll(".cx-del").forEach(function(b){b.addEventListener("click",function(){var n=this.getAttribute("data-ex");CX[selGrp]=CX[selGrp].filter(function(e){return e!==n});saveAll();render()})});
  document.querySelectorAll(".fav-btn").forEach(function(b){b.addEventListener("click",function(){toggleFav(selGrp,this.getAttribute("data-ex"))})});
  document.querySelectorAll(".hide-toggle").forEach(function(b){b.addEventListener("click",function(){toggleHide(selGrp,this.getAttribute("data-ex"))})});
  document.querySelectorAll(".ex-pick").forEach(function(b){b.addEventListener("click",function(){selEx=this.getAttribute("data-ex");step=2;sets=[{r:10,w:0}];note="";render()})});
  document.querySelectorAll(".set-pm").forEach(function(b){b.addEventListener("click",function(){var i=parseInt(this.getAttribute("data-i")),f=this.getAttribute("data-f"),d=parseInt(this.getAttribute("data-d"));sets[i][f]=Math.max(0,sets[i][f]+d);render()})});
  document.querySelectorAll(".set-inp").forEach(function(inp){inp.addEventListener("change",function(){var i=parseInt(this.getAttribute("data-i")),f=this.getAttribute("data-f");sets[i][f]=Math.max(0,parseInt(this.value)||0)})});
  document.querySelectorAll(".set-rm").forEach(function(b){b.addEventListener("click",function(){var i=parseInt(this.getAttribute("data-i"));if(sets.length>1){sets.splice(i,1);render()}})});
  var asb=document.getElementById("add-set");if(asb)asb.addEventListener("click",function(){sets.push({r:sets[sets.length-1].r,w:sets[sets.length-1].w});render()});
  var nt=document.getElementById("ex-note");if(nt)nt.addEventListener("input",function(){note=this.value});
  var sst=document.getElementById("ss-toggle");if(sst)sst.addEventListener("click",function(){isSuper=!isSuper;render()});
  var gb=document.getElementById("goal-btn"),gi=document.getElementById("goal-inp");if(gb&&gi)gb.addEventListener("click",function(){var v=parseInt(gi.value);if(v>0){GOALS[selEx]=v;saveAll();render()}});
  var lex=document.getElementById("log-ex");if(lex)lex.addEventListener("click",function(){if(!selEx)return;var gotPR=false;sets.forEach(function(s){if(checkPR(selEx,s.w,s.r))gotPR=true});var entry={group:selGrp,exercise:selEx,sets:sets.map(function(s){return{r:s.r,w:s.w}}),note:note,superset:isSuper};if(!W[selDate])W[selDate]=[];W[selDate].push(entry);saveAll();if(gotPR){confetti();showModal('<div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:12px">🏆</div><div style="font-size:20px;font-weight:800;margin-bottom:6px">NEW PR!</div><div style="color:var(--mt);font-size:13px;margin-bottom:4px">'+selEx+'</div><div style="font-size:16px;font-weight:700;color:var(--yl)">Est. 1RM: '+PR[selEx].e1rm+' lbs</div><div style="margin-top:16px"><button class="btn bp" id="pr-close">Let\'s Go! 🔥</button></div></div>');setTimeout(function(){var c=document.getElementById("pr-close");if(c)c.addEventListener("click",closeModal)},50)}selGrp="";selEx="";step=0;sets=[{r:10,w:0}];note="";isSuper=false;render()});
  document.querySelectorAll(".rm-ex").forEach(function(b){b.addEventListener("click",function(){var date=this.getAttribute("data-date"),i=parseInt(this.getAttribute("data-i"));W[date].splice(i,1);if(!W[date].length)delete W[date];saveAll();render()})});
  document.querySelectorAll(".copy-day").forEach(function(b){b.addEventListener("click",function(){var date=this.getAttribute("data-date");if(!W[date])return;if(!W[selDate])W[selDate]=[];W[date].forEach(function(e){W[selDate].push({group:e.group,exercise:e.exercise,sets:e.sets.map(function(s){return{r:s.r,w:s.w}}),note:"",superset:e.superset})});saveAll();view="log";document.querySelectorAll(".nb").forEach(function(b2){b2.classList.remove("on")});document.querySelector('[data-v="log"]').classList.add("on");render()})});
  document.querySelectorAll(".tpl-load").forEach(function(b){b.addEventListener("click",function(){var i=parseInt(this.getAttribute("data-i")),tpl=TPL[i];if(!W[selDate])W[selDate]=[];tpl.exercises.forEach(function(e){W[selDate].push({group:e.group,exercise:e.exercise,sets:e.sets.map(function(s){return{r:s.r,w:s.w}}),note:"",superset:false});e.sets.forEach(function(s){checkPR(e.exercise,s.w,s.r)})});saveAll();view="log";document.querySelectorAll(".nb").forEach(function(b2){b2.classList.remove("on")});document.querySelector('[data-v="log"]').classList.add("on");render()})});
  document.querySelectorAll(".tpl-del").forEach(function(b){b.addEventListener("click",function(){TPL.splice(parseInt(this.getAttribute("data-i")),1);saveAll();render()})});
  document.querySelectorAll(".wt-pm").forEach(function(b){b.addEventListener("click",function(){var g=this.getAttribute("data-g"),d=parseInt(this.getAttribute("data-d"));WTARGETS[g]=Math.max(0,(WTARGETS[g]||0)+d);saveAll();render()})});
  var cp=document.getElementById("cal-prev"),cn=document.getElementById("cal-next");if(cp)cp.addEventListener("click",function(){calM--;if(calM<0){calM=11;calY--}render()});if(cn)cn.addEventListener("click",function(){calM++;if(calM>11){calM=0;calY++}render()});
  document.querySelectorAll(".lift-pill").forEach(function(b){b.addEventListener("click",function(){selLift=this.getAttribute("data-ex");render()})});
  document.querySelectorAll(".more-tab").forEach(function(b){b.addEventListener("click",function(){moreTab=this.getAttribute("data-t");render()})});
  // Measurements
  var mb=document.getElementById("meas-btn");if(mb)mb.addEventListener("click",function(){var curM=MEAS[selDate]||{};var html='<div style="font-size:16px;font-weight:800;margin-bottom:14px">📏 Log Measurements</div><div style="font-size:11px;color:var(--mt);margin-bottom:12px">'+fmtD(selDate)+' (inches)</div>';
  MEAS_FIELDS.forEach(function(f){html+='<div class="row" style="margin-bottom:8px;justify-content:space-between"><span style="font-size:12px;font-weight:600">'+f+'</span><input type="number" class="inp meas-inp" data-f="'+f+'" style="width:80px;font-size:12px" step="0.1" placeholder="in" value="'+(curM[f]||'')+'"></div>'});
  html+='<button class="btn bp bf" id="save-meas" style="margin-top:8px">Save</button>';showModal(html);
  setTimeout(function(){var sm=document.getElementById("save-meas");if(sm)sm.addEventListener("click",function(){var obj={};document.querySelectorAll(".meas-inp").forEach(function(inp){var v=parseFloat(inp.value);if(v)obj[inp.getAttribute("data-f")]=v});MEAS[selDate]=obj;saveAll();closeModal();render()})},50)});
  // Calculator
  var cb=document.getElementById("calc-btn");if(cb)cb.addEventListener("click",function(){var w=parseFloat(document.getElementById("calc-w").value),r=parseInt(document.getElementById("calc-r").value),out=document.getElementById("calc-out");if(!w||!r){out.innerHTML='<div style="color:var(--rd);font-size:12px">Enter weight and reps</div>';return}var rm=e1rm(w,r);var html='<div style="font-size:16px;font-weight:800;color:var(--yl);margin-bottom:8px">Est 1RM: '+rm+' lbs</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">';[100,95,90,85,80,75,70,65,60].forEach(function(p){html+='<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 8px;background:var(--c2);border-radius:6px"><span style="color:var(--mt)">'+p+'%</span><span style="font-weight:700">'+Math.round(rm*p/100)+'</span></div>'});out.innerHTML=html+'</div>'});
  // Plate calc
  var pb=document.getElementById("plate-btn");if(pb)pb.addEventListener("click",function(){var w=parseInt(document.getElementById("plate-w").value);var out=document.getElementById("plate-out");if(!w||w<45){out.innerHTML='<div style="color:var(--rd);font-size:12px">Min 45 lbs (bar)</div>';return}out.innerHTML=plateViz(w)});
  // Warmup
  var wub=document.getElementById("wu-btn");if(wub)wub.addEventListener("click",function(){var w=parseInt(document.getElementById("wu-w").value);var out=document.getElementById("wu-out");if(!w||w<50){out.innerHTML='<div style="color:var(--rd);font-size:12px">Enter working weight</div>';return}var wu=calcWarmup(w);var html='';wu.forEach(function(s){html+='<div class="wu-row"><span style="color:var(--mt)">'+s.r+' reps</span><span style="font-weight:700">'+s.w+' lbs</span></div>'});html+='<div class="wu-row" style="border:none;color:var(--gn);font-weight:700"><span>Working sets</span><span>'+w+' lbs</span></div>';out.innerHTML=html});
    // Export
  var exp = document.getElementById("export-btn");
  if (exp) exp.addEventListener("click", function () {
    var data = JSON.stringify({
      workouts: W,
      bodyWeight: BW,
      templates: TPL,
      prs: PR,
      customExercises: CX,
      favorites: FAVS,
      hidden: HIDDEN,
      ratings: RATINGS,
      goals: GOALS,
      measurements: MEAS,
      achievements: ACHV,
      weeklyTargets: WTARGETS,

      // nutrition
      nlog: NLOG,
      nfoods: NFOODS,
      ngoals: NGOALS
    }, null, 2);

    var blob = new Blob([data], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ironlog_" + tod() + ".json";
    a.click();
  });

  // Import
  var imp = document.getElementById("import-btn"),
      impF = document.getElementById("import-file");

  if (imp && impF) {
    imp.addEventListener("click", function () { impF.click(); });

    impF.addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var d = JSON.parse(ev.target.result);

          if (d.workouts) W = d.workouts;
          if (d.bodyWeight) BW = d.bodyWeight;
          if (d.templates) TPL = d.templates;
          if (d.prs) PR = d.prs;
          if (d.customExercises) CX = d.customExercises;
          if (d.favorites) FAVS = d.favorites;
          if (d.hidden) HIDDEN = d.hidden;
          if (d.ratings) RATINGS = d.ratings;
          if (d.goals) GOALS = d.goals;
          if (d.measurements) MEAS = d.measurements;
          if (d.achievements) ACHV = d.achievements;
          if (d.weeklyTargets) WTARGETS = d.weeklyTargets;

          // nutrition
          if (d.nlog) NLOG = d.nlog;
          if (d.nfoods) NFOODS = d.nfoods;
          if (d.ngoals) NGOALS = d.ngoals;

          saveAll();
          closeModal();
          render();

          showModal('<div style="text-align:center;padding:20px"><div style="font-size:36px;margin-bottom:8px">✅</div><div style="font-size:16px;font-weight:700">Import Successful!</div><div style="margin-top:12px"><button class="btn bp" id="imp-close">Done</button></div></div>');
          setTimeout(function () {
            var c = document.getElementById("imp-close");
            if (c) c.addEventListener("click", closeModal);
          }, 50);

        } catch (err) {
          alert("Invalid file");
        }
      };

      reader.readAsText(file);
    });
  }
   // Reset
  var rb = document.getElementById("reset-btn");
  if (rb) rb.addEventListener("click", function () {
    if (!confirm("Are you sure? This will delete ALL your data.")) return;
    W = {}; BW = {}; TPL = []; PR = {}; CX = {}; FAVS = {}; HIDDEN = {}; RATINGS = {}; GOALS = {};
    MEAS = {}; ACHV = {}; WTARGETS = {};
    NLOG = {}; NFOODS = {}; NGOALS = {};
    saveAll();
    render();
  });

  // Nutrition
  var foodAdd = document.getElementById("food-add");
  if (foodAdd) {
    foodAdd.addEventListener("click", function () {
      var nameEl = document.getElementById("food-name");
      var calEl = document.getElementById("food-cal");
      var pEl = document.getElementById("food-p");
      var cEl = document.getElementById("food-c");
      var fEl = document.getElementById("food-f");
      var name = (nameEl && nameEl.value ? nameEl.value : "").trim();
      if (!name) return;

      var item = {
        name: name,
        cal: calEl && calEl.value ? parseFloat(calEl.value) || 0 : 0,
        p: pEl && pEl.value ? parseFloat(pEl.value) || 0 : 0,
        c: cEl && cEl.value ? parseFloat(cEl.value) || 0 : 0,
        f: fEl && fEl.value ? parseFloat(fEl.value) || 0 : 0
      };

      if (!NLOG[selDate]) NLOG[selDate] = [];
      NLOG[selDate].push(item);

      if (nameEl) nameEl.value = "";
      if (calEl) calEl.value = "";
      if (pEl) pEl.value = "";
      if (cEl) cEl.value = "";
      if (fEl) fEl.value = "";

      saveAll();
      render();
    });
  }

  document.querySelectorAll(".food-del").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var i = parseInt(this.getAttribute("data-i"), 10);
      if (!NLOG[selDate]) return;
      if (isNaN(i)) return;
      NLOG[selDate].splice(i, 1);
      saveAll();
      render();
    });
  });

  document.querySelectorAll(".food-quick").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = this.getAttribute("data-name");
      if (!name) return;
      var it = calcItemFromFood(name, 1);
      if (!it) return;
      if (!NLOG[selDate]) NLOG[selDate] = [];
      NLOG[selDate].push(it);
      saveAll();
      render();
    });
  });
 // Nutrition: Add food
var addFoodBtn = document.getElementById("add-food-btn");
if (addFoodBtn) {
  addFoodBtn.addEventListener("click", function () {
    var nameEl = document.getElementById("food-name");
    var gramsEl = document.getElementById("food-grams");
    var servEl  = document.getElementById("food-serv");

    var name = (nameEl.value || "").trim();
    if (!name) return alert("Enter a food name.");

    var key = foodKey(name);
    var food = NFOODS[key];
    if (!food) return alert("Food not found. Use exact name from food list.");

    var grams = parseFloat(gramsEl.value) || 0;
    var servings = parseFloat(servEl.value) || 0;

    var calc = calcItemFromFood(food, grams, servings);

    if (!NLOG[selDate]) NLOG[selDate] = [];
    NLOG[selDate].push({
      id: uid(),
      name: food.name,
      grams: calc.grams,
      servings: servings,
      cal: calc.cal,
      p: calc.p,
      c: calc.c,
      f: calc.f,
      at: Date.now()
    });

    saveAll();
    render();
  });
} // end bindEvents

render();
}); // end DOMContentLoaded
 







