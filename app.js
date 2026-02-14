/* Iron Log - rebuilt clean "elite" version
   - Stable single-file app.js
   - Workout logging + history + progress charts + nutrition logging
   - Auto calorie/protein targets (cut 12–15% BF) based on latest bodyweight, activity assumptions
*/

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // -----------------------------
  // Storage helpers
  // -----------------------------
  function ld(k, d) {
    try {
      var v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  }
  function sv(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }

  // -----------------------------
  // Dates
  // -----------------------------
  function pad2(n) { return String(n).padStart(2, "0"); }
  function tod() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function addDays(ds, delta) {
    var d = new Date(ds + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  function fmtD(ds) {
    var d = new Date(ds + "T00:00:00");
    var opts = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    return d.toLocaleDateString(undefined, opts);
  }
  function fmtS(ds) {
    var d = new Date(ds + "T00:00:00");
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  // -----------------------------
  // Base data
  // -----------------------------
  var EX = {
    Chest: ["Bench Press","Incline Bench Press","Dumbbell Bench Press","Incline Dumbbell Press","Cable Fly","Push-Ups","Dips"],
    Back: ["Deadlift","Barbell Row","Pull-Ups","Lat Pulldown","Seated Cable Row","Face Pull"],
    Legs: ["Squat","Front Squat","Leg Press","Romanian Deadlift","Walking Lunges","Leg Extension","Leg Curl","Calf Raises"],
    Shoulders: ["Overhead Press","Seated Dumbbell Press","Lateral Raise","Rear Delt Fly","Upright Row"],
    Arms: ["Barbell Curl","Dumbbell Curl","Hammer Curl","Tricep Pushdown","Skull Crushers","Close-Grip Bench Press"],
    Core: ["Plank","Crunches","Hanging Leg Raise","Ab Rollout","Cable Crunch"],
    Cardio: ["Treadmill","Rowing Machine","Cycling","Stair Climber","Jump Rope"]
  };
  var ICO = {Chest:"🏋️",Back:"🔙",Legs:"🦵",Shoulders:"🏹",Arms:"💪",Core:"🧘",Cardio:"🏃"};
  var QUOTES = [
    {t:"Discipline is choosing what you want most over what you want now.",a:"Abraham Lincoln"},
    {t:"Success is the sum of small efforts, repeated day in and day out.",a:"Robert Collier"},
    {t:"The last three or four reps is what makes the muscle grow.",a:"Arnold Schwarzenegger"},
    {t:"The iron never lies to you.",a:"Henry Rollins"},
    {t:"Consistency beats intensity.",a:"Unknown"}
  ];

  // -----------------------------
  // Nutrition database (per 100g)
  // -----------------------------
  function foodKey(name) {
    return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  var NFOODS = ld("il_nfoods", {
    "chicken breast cooked": { name:"Chicken Breast (cooked)", per100:{cal:165,p:31,c:0,f:3.6}, serving:{label:"6 oz", grams:170} },
    "white rice cooked":     { name:"White Rice (cooked)",     per100:{cal:130,p:2.7,c:28.2,f:0.3}, serving:{label:"150 g", grams:150} },
    "ground beef 90% cooked":{ name:"Ground Beef 90% (cooked)",per100:{cal:217,p:26,c:0,f:12}, serving:{label:"6 oz", grams:170} },
    "english muffin":        { name:"English Muffin",          per100:{cal:232,p:8.2,c:44.0,f:2.0}, serving:{label:"1 muffin", grams:57} },
    "bagel plain":           { name:"Plain Bagel",             per100:{cal:250,p:9.5,c:48.9,f:1.5}, serving:{label:"1 bagel", grams:95} },
    "canadian bacon":        { name:"Canadian Bacon",          per100:{cal:110,p:20,c:1.0,f:2.0}, serving:{label:"2 slices", grams:60} },
    "potato baked":          { name:"Potato (baked)",          per100:{cal:93,p:2.5,c:21.2,f:0.1}, serving:{label:"200 g", grams:200} },
    "sweet potato baked":    { name:"Sweet Potato (baked)",    per100:{cal:90,p:2.0,c:20.7,f:0.2}, serving:{label:"200 g", grams:200} },
    "pasta cooked":          { name:"Pasta (cooked)",          per100:{cal:158,p:5.8,c:30.9,f:0.9}, serving:{label:"180 g", grams:180} },
    "egg":                   { name:"Whole Egg",               per100:{cal:143,p:13,c:1.1,f:9.5}, serving:{label:"1 large", grams:50} },
    "greek yogurt nonfat":   { name:"Greek Yogurt (nonfat)",   per100:{cal:59,p:10.3,c:3.6,f:0.4}, serving:{label:"170 g cup", grams:170} },
    "wesley farms blueberry granola": { name:"Wesley Farms Blueberry Granola", per100:{cal:471,p:9,c:68,f:18}, serving:{label:"1/2 cup", grams:55} },
    "whey protein":          { name:"Whey Protein Powder",      per100:{cal:400,p:80,c:8,f:6}, serving:{label:"1 scoop", grams:30} },
    "milk 2%":               { name:"Milk (2%)",                per100:{cal:50,p:3.4,c:4.9,f:2.0}, serving:{label:"1 cup", grams:244} },
    "almond milk unsweetened": { name:"Almond Milk (unsweetened)", per100:{cal:15,p:0.5,c:0.6,f:1.2}, serving:{label:"1 cup", grams:240} },
    "peanut butter":         { name:"Peanut Butter",            per100:{cal:588,p:25,c:20,f:50}, serving:{label:"1 tbsp", grams:16} },
    "banana":                { name:"Banana",                   per100:{cal:89,p:1.1,c:23,f:0.3}, serving:{label:"1 medium", grams:118} },
    "apple":                 { name:"Apple",                    per100:{cal:52,p:0.3,c:14,f:0.2}, serving:{label:"1 medium", grams:182} },
    "blueberries":           { name:"Blueberries",              per100:{cal:57,p:0.7,c:14,f:0.3}, serving:{label:"1 cup", grams:148} },
    "strawberries":          { name:"Strawberries",             per100:{cal:32,p:0.7,c:7.7,f:0.3}, serving:{label:"1 cup", grams:152} },
    "broccoli":              { name:"Broccoli",                 per100:{cal:35,p:2.4,c:7.2,f:0.4}, serving:{label:"1 cup", grams:91} },
    "spinach":               { name:"Spinach",                  per100:{cal:23,p:2.9,c:3.6,f:0.4}, serving:{label:"2 cups", grams:60} },
    "avocado":               { name:"Avocado",                  per100:{cal:160,p:2,c:8.5,f:14.7}, serving:{label:"1/2 avocado", grams:75} },
    "olive oil":             { name:"Olive Oil",                per100:{cal:884,p:0,c:0,f:100}, serving:{label:"1 tbsp", grams:13.5} },
    "tortilla flour":        { name:"Flour Tortilla",           per100:{cal:310,p:8.5,c:52,f:7.5}, serving:{label:"1 tortilla", grams:50} },
    "bread white":           { name:"White Bread",              per100:{cal:265,p:9,c:49,f:3.2}, serving:{label:"1 slice", grams:25} },
    "rice cake":             { name:"Rice Cake",                per100:{cal:387,p:7.5,c:81,f:2.8}, serving:{label:"1 cake", grams:9} },
    "cheddar cheese":        { name:"Cheddar Cheese",           per100:{cal:403,p:25,c:1.3,f:33}, serving:{label:"1 oz", grams:28} },
    "cottage cheese lowfat": { name:"Cottage Cheese (lowfat)",  per100:{cal:81,p:11.1,c:3.4,f:2.3}, serving:{label:"1/2 cup", grams:113} },
    "tuna canned":           { name:"Tuna (canned)",            per100:{cal:116,p:26,c:0,f:1}, serving:{label:"1 can", grams:120} },
    "salmon cooked":         { name:"Salmon (cooked)",          per100:{cal:208,p:20,c:0,f:13}, serving:{label:"6 oz", grams:170} },
    "turkey breast deli":    { name:"Turkey Breast (deli)",     per100:{cal:104,p:17,c:3,f:2}, serving:{label:"4 oz", grams:112} },
    "steak sirloin cooked":  { name:"Sirloin Steak (cooked)",   per100:{cal:217,p:26,c:0,f:12}, serving:{label:"6 oz", grams:170} },
    "oats":                  { name:"Oats (dry)",               per100:{cal:389,p:16.9,c:66.3,f:6.9}, serving:{label:"40 g", grams:40} },
    "pasta sauce marinara":  { name:"Marinara Sauce",           per100:{cal:50,p:1.7,c:9.0,f:1.2}, serving:{label:"1/2 cup", grams:125} },
    "potatoes fries":        { name:"French Fries",             per100:{cal:312,p:3.4,c:41,f:15}, serving:{label:"150 g", grams:150} },
    "egg whites":            { name:"Egg Whites",               per100:{cal:52,p:11,c:0.7,f:0.2}, serving:{label:"3 large", grams:99} },
    "greek yogurt 2%":       { name:"Greek Yogurt (2%)",        per100:{cal:73,p:9.95,c:3.94,f:1.92}, serving:{label:"170 g cup", grams:170} },
    "protein bar":           { name:"Protein Bar",              per100:{cal:350,p:25,c:35,f:10}, serving:{label:"1 bar", grams:65} }
  });

// ─────────────────────────────────────────────────────────────
// Nutrition extras (meal presets + barcode map + granola add-on)
// ─────────────────────────────────────────────────────────────
function ensureFood(key, obj){
  if(!NFOODS[key]) { NFOODS[key]=obj; sv("il_nfoods", NFOODS); }
}
// Add your granola (approx values; edit in-app later if you want)
ensureFood("wesley farms blueberry granola", {
  name:"Wesley Farms Blueberry Granola",
  per100:{cal:471,p:10,c:64,f:20},
  serving:{label:"60 g", grams:60}
});

// Meal presets (1-tap meals)
var MEAL_PRESETS = ld("il_meal_presets", [
  { id:"m_bfast", name:"Breakfast: Greek yogurt + granola", items:[
    { key:"greek yogurt nonfat", grams:170, servings:0 },
    { key:"wesley farms blueberry granola", grams:60, servings:0 }
  ]},
  { id:"m_lunch", name:"Lunch: Eggs + Canadian bacon + English muffin", items:[
    { key:"egg", grams:100, servings:0 },                // ~2 large eggs
    { key:"canadian bacon", grams:90, servings:0 },      // ~3 slices
    { key:"english muffin", grams:57, servings:0 }
  ]},
  { id:"m_dinner", name:"Dinner: Rice + Chicken", items:[
    { key:"white rice cooked", grams:150, servings:0 },
    { key:"chicken breast cooked", grams:175, servings:0 }
  ]}
]);

// Barcode → food key map (optional)
var BARCODE_MAP = ld("il_barcode_map", {}); // { "0123456789012": "chicken breast cooked" }

function saveMealPresets(){ sv("il_meal_presets", MEAL_PRESETS); }
function saveBarcodeMap(){ sv("il_barcode_map", BARCODE_MAP); }

function addPresetToDay(presetId){
  var p=null;
  for(var i=0;i<MEAL_PRESETS.length;i++){ if(MEAL_PRESETS[i].id===presetId){ p=MEAL_PRESETS[i]; break; } }
  if(!p) return;
  if(!NLOG[selDate]) NLOG[selDate]=[];
  p.items.forEach(function(it){
    var food = NFOODS[it.key];
    if(!food) return;
    var calc = calcItemFromFood(food, (it.grams||0), (it.servings||0));
    if(!calc) return;
    NLOG[selDate].push({
      id: uid(),
      name: food.name,
      key: it.key,
      grams: calc.grams,
      servings: (it.servings||0),
      cal: calc.cal, p: calc.p, c: calc.c, f: calc.f,
      at: Date.now()
    });
  });
  saveAll();
  render();
}

function saveTodayAsPreset(){
  var items = (NLOG[selDate]||[]);
  if(!items.length) return alert("Log at least 1 food first.");
  var name = prompt("Preset name? (e.g., Dinner: Beef + Potato)");
  if(!name) return;
  var pid = "m_"+String(Date.now());
  var pitems=[];
  items.forEach(function(it){
    // try to map by key first, else by name lookup
    var k = it.key;
    if(!k){
      var k2 = foodKey(it.name||"");
      if(NFOODS[k2]) k=k2;
      else {
        // contains match
        var found=null; Object.keys(NFOODS).some(function(kk){
          var nn=(NFOODS[kk].name||"").toLowerCase();
          if(nn.indexOf((it.name||"").toLowerCase())>=0){ found=kk; return true; }
          return false;
        });
        if(found) k=found;
      }
    }
    if(!k) return;
    pitems.push({ key:k, grams: it.grams||0, servings: it.servings||0 });
  });
  MEAL_PRESETS.unshift({ id:pid, name:name, items:pitems });
  saveMealPresets();
  alert("Saved preset: "+name);
  render();
}

// Weekly adherence + guardrails (simple + Safari-safe)
function lastNDates(n){
  var out=[], d=new Date();
  for(var i=0;i<n;i++){
    var x=new Date(d); x.setDate(d.getDate()-i);
    out.push(x.toISOString().split("T")[0]);
  }
  return out;
}
function countWorkoutsLast7(){
  var d=lastNDates(7), c=0;
  for(var i=0;i<d.length;i++){ if(W[d[i]] && W[d[i]].length) c++; }
  return c;
}
function totalSetsLast7(){
  var d=lastNDates(7), s=0;
  d.forEach(function(day){
    (W[day]||[]).forEach(function(ex){
      (ex.sets||[]).forEach(function(st){ if(st && st.r) s+=1; });
    });
  });
  return s;
}
function weeklyAdherence(){
  var workouts = countWorkoutsLast7();
  var plan = 5; // your typical schedule
  var workoutScore = Math.min(1, workouts/plan);
  // guardrail: if sets are too high, adherence is capped (quality > junk volume)
  var sets = totalSetsLast7();
  var setCap = 130; // adjustable
  var volumePenalty = sets>setCap ? Math.min(0.25, (sets-setCap)/setCap) : 0;
  var score = Math.max(0, workoutScore - volumePenalty);
  return {score:score, workouts:workouts, plan:plan, sets:sets, setCap:setCap};
}

// Barcode scanning (best-effort; Safari supports BarcodeDetector on newer versions)
function canScanBarcode(){
  return !!(window.BarcodeDetector && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
function openBarcodeScanner(){
  if(!canScanBarcode()) return alert("Barcode scanning isn't supported on this Safari version.");
  var html='';
  html+='<div style="padding:16px">';
  html+='<div style="font-size:14px;font-weight:800;margin-bottom:6px">📷 Scan Barcode</div>';
  html+='<div style="font-size:11px;color:var(--mt);margin-bottom:10px">Point your camera at the barcode. If it recognizes it, you can map it to a food once and then 1-tap add next time.</div>';
  html+='<video id="bc-vid" style="width:100%;border-radius:12px;background:#000" playsinline></video>';
  html+='<div class="row" style="gap:8px;margin-top:10px"><button class="btn bs" id="bc-close" style="flex:1">Close</button><button class="btn bp" id="bc-flip" style="flex:1">Flip</button></div>';
  html+='<div id="bc-out" style="margin-top:10px;font-size:12px;color:var(--mt)"></div>';
  html+='</div>';
  showModal(html);

  var stream=null, facing="environment", detector=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e","code_128","qr_code"]});
  var vid=document.getElementById("bc-vid"), out=document.getElementById("bc-out");

  function stop(){
    if(stream){ stream.getTracks().forEach(function(t){ try{t.stop();}catch(e){} }); stream=null; }
  }
  function start(){
    stop();
    navigator.mediaDevices.getUserMedia({video:{facingMode:facing}}).then(function(s){
      stream=s; vid.srcObject=s; vid.play();
      tick();
    }).catch(function(err){
      out.textContent="Camera error: "+(err && err.message ? err.message : err);
    });
  }
  var scanning=true;
  function tick(){
    if(!scanning) return;
    if(vid.readyState<2){ requestAnimationFrame(tick); return; }
    detector.detect(vid).then(function(codes){
      if(codes && codes.length){
        var raw=codes[0].rawValue||"";
        if(raw){
          scanning=false;
          stop();
          out.innerHTML='<div style="font-weight:800;color:var(--tx);margin-bottom:6px">Found: '+raw+'</div>';
          // If already mapped, quick add
          if(BARCODE_MAP[raw]){
            var k=BARCODE_MAP[raw], food=NFOODS[k];
            if(food){
              out.innerHTML+='<div style="font-size:11px;color:var(--mt);margin-bottom:10px">Mapped to: <strong>'+food.name+'</strong></div>';
              out.innerHTML+='<button class="btn bp" id="bc-add" style="width:100%;margin-bottom:8px">Add serving</button>';
              setTimeout(function(){
                var b=document.getElementById("bc-add");
                if(b) b.addEventListener("click", function(){
                  if(!NLOG[selDate]) NLOG[selDate]=[];
                  var calc=calcItemFromFood(food, food.serving?food.serving.grams:0, 0);
                  NLOG[selDate].push({id:uid(),name:food.name,key:k,grams:calc.grams,servings:0,cal:calc.cal,p:calc.p,c:calc.c,f:calc.f,at:Date.now()});
                  saveAll(); closeModal(); render();
                });
              },30);
            }
          } else {
            out.innerHTML+='<div style="font-size:11px;color:var(--mt);margin-bottom:8px">Not mapped yet. Choose which food this barcode is:</div>';
            out.innerHTML+='<input class="inp" id="bc-map-name" placeholder="Type food name (e.g., chicken)" style="width:100%;margin-bottom:8px">';
            out.innerHTML+='<button class="btn bp" id="bc-map-save" style="width:100%">Save mapping</button>';
            setTimeout(function(){
              var sbtn=document.getElementById("bc-map-save");
              if(sbtn) sbtn.addEventListener("click", function(){
                var nm=(document.getElementById("bc-map-name").value||"").trim();
                if(!nm) return;
                var k=foodKey(nm);
                var food=NFOODS[k];
                if(!food){
                  // contains match
                  var kk=null; Object.keys(NFOODS).some(function(x){
                    if((NFOODS[x].name||"").toLowerCase().indexOf(nm.toLowerCase())>=0){ kk=x; return true; }
                    return false;
                  });
                  if(kk) { k=kk; food=NFOODS[kk]; }
                }
                if(!food) return alert("Food not found in your foods list.");
                BARCODE_MAP[raw]=k; saveBarcodeMap();
                alert("Mapped "+raw+" → "+food.name);
                closeModal(); render();
              });
            },30);
          }
        }
      } else {
        requestAnimationFrame(tick);
      }
    }).catch(function(e){
      requestAnimationFrame(tick);
    });
  }

  setTimeout(function(){
    var c=document.getElementById("bc-close");
    var f=document.getElementById("bc-flip");
    if(c) c.addEventListener("click", function(){ scanning=false; stop(); closeModal(); });
    if(f) f.addEventListener("click", function(){ facing = (facing==="environment"?"user":"environment"); scanning=true; start(); });
    start();
  },30);
}

  // Quick add list (NO olive oil)
  var QUICK_FOODS = [
    "Chicken Breast (cooked)",
    "White Rice (cooked)",
    "Ground Beef 90% (cooked)",
    "Whole Egg",
    "Greek Yogurt (nonfat)",
    "English Muffin",
    "Canadian Bacon",
    "Potato (baked)",
    "Sweet Potato (baked)",
    "Pasta (cooked)",
    "Wesley Farms Blueberry Granola"
  ];

  // -----------------------------
  // App state
  // -----------------------------
  var TH = ld("il_th", "dark"); // "dark" or "light"
  var view = ld("il_view", "log");
  var selDate = ld("il_selDate", tod());

  var W = ld("il_w", {});         // workouts by date
  var CEX = ld("il_custom_ex", {}); // custom exercises by group
   var BW = ld("il_bw", {});       // bodyweight by date: number
  var PR = ld("il_pr", {});       // pr by exercise: {e1rm, w, r, date}
  var NLOG = ld("il_nlog", {});   // nutrition log by date
  var NUPC = ld("il_nupc", {});   // barcode -> foodKey mapping
var FOOD_SEARCH_TEXT = ld("il_food_search", "");
  // activity assumptions (used for calorie targets)
   
  var USER = ld("il_user", {
    sessionsPerWeek: 5,
    stepsPerDay: 10000,
     goalMode: "cut", // "cut" | "maintain" | "bulk"
    goalPace: "moderate", // "performance" | "moderate" | "aggressive"
    cutAggressiveness: "performance", // legacy support
    autoGoals: true
  });

   if (!USER.goalMode) USER.goalMode = "cut";
  if (!USER.goalPace) USER.goalPace = USER.cutAggressiveness || "moderate";
  function saveAll() {
    sv("il_th", TH);
    sv("il_view", view);
    sv("il_selDate", selDate);
    sv("il_custom_ex", CEX);
     sv("il_w", W);
    sv("il_bw", BW);
    sv("il_pr", PR);
    sv("il_nlog", NLOG);
    sv("il_nfoods", NFOODS);
    sv("il_nupc", NUPC);
     sv("il_food_search", FOOD_SEARCH_TEXT);
    sv("il_user", USER);
  }

  // -----------------------------
  // Theme
  // -----------------------------
  function applyTheme() {
    document.body.setAttribute("data-theme", TH === "light" ? "light" : "");
    var b = document.getElementById("thm-btn");
    if (b) b.textContent = TH === "dark" ? "🌙" : "☀️";
  }

  // -----------------------------
  // Workout helpers
  // -----------------------------
  function e1rm(w, r) {
    w = +w || 0; r = +r || 0;
    if (w <= 0 || r <= 0) return 0;
    return Math.round(w * (1 + r / 30));
  }

function exerciseList(group){
    var base = EX[group] || [];
    var custom = CEX[group] || [];
    var seen = {};
    return base.concat(custom).filter(function(name){
      var k = String(name || "").trim();
      if(!k) return false;
      var id = k.toLowerCase();
      if(seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function lastExercisePerf(exName){
    // Most recent logged set with weight/reps for this exercise
    var dates = Object.keys(W).sort().reverse();
    for(var di=0; di<dates.length; di++){
      var d = dates[di], day = W[d] || [];
      for(var ei=0; ei<day.length; ei++){
        var e = day[ei];
        if(e && e.exercise === exName && e.sets && e.sets.length){
          // use heaviest set as representative
          var best=null;
          e.sets.forEach(function(s){
            if(!s) return;
            var w=+s.w||0, r=+s.r||0;
            if(w<=0||r<=0) return;
            if(!best || w>best.w || (w===best.w && r>best.r)) best={w:w,r:r};
          });
          if(best) return {date:d, w:best.w, r:best.r, e1:e1rm(best.w,best.r)};
        }
      }
    }
    return null;
  }

  function overloadSuggestion(exName){
    var p = lastExercisePerf(exName);
    if(!p) return null;
    // heuristic: add 5 lbs, or +1 rep at same weight
    var incW = 5;
    var w2 = p.w + incW;
    var r2 = p.r + 1;
    return {
      last: p,
      opt1: { w: w2, r: p.r },
      opt2: { w: p.w, r: r2 }
    };
  }
  function ensureDay(ds) {
    if (!W[ds]) W[ds] = [];
    if (!NLOG[ds]) NLOG[ds] = [];
  }

  function updatePRFromEntry(ds, exEntry) {
    if (!exEntry || !exEntry.exercise || !exEntry.sets) return;
    var best = 0, bw = 0, br = 0;
    exEntry.sets.forEach(function(s){
      var est = e1rm(s.w, s.r);
      if (est > best) { best = est; bw = s.w; br = s.r; }
    });
    if (!best) return;
    var name = exEntry.exercise;
    if (!PR[name] || best > (PR[name].e1rm || 0)) {
      PR[name] = { e1rm: best, w: bw, r: br, date: ds };
    }
  }

  // -----------------------------
  // Nutrition helpers
  // -----------------------------
  function uid() { return Math.random().toString(16).slice(2) + Date.now().toString(16); }
   function normSearch(v) {
    return String(v || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  function levenshtein(a, b) {
    a = normSearch(a); b = normSearch(b);
    if (!a) return b.length;
    if (!b) return a.length;
    var dp = Array(b.length + 1);
    for (var j = 0; j <= b.length; j++) dp[j] = j;
    for (var i = 1; i <= a.length; i++) {
      var prev = dp[0];
      dp[0] = i;
      for (var k = 1; k <= b.length; k++) {
        var tmp = dp[k];
        var cost = (a[i - 1] === b[k - 1]) ? 0 : 1;
        dp[k] = Math.min(dp[k] + 1, dp[k - 1] + 1, prev + cost);
        prev = tmp;
      }
    }
    return dp[b.length];
  }

  function foodSearch(inputName, limit) {
    var q = normSearch(inputName);
    if (!q) return [];
    var toks = q.split(" ").filter(Boolean);
    var list = Object.keys(NFOODS).map(function(key){
      var food = NFOODS[key] || {};
      var nm = normSearch(food.name || key);
      var score = 0;
      if (nm === q || key === q) score += 1000;
      if (nm.indexOf(q) >= 0 || key.indexOf(q) >= 0) score += 250;
      toks.forEach(function(t){ if (nm.indexOf(t) >= 0 || key.indexOf(t) >= 0) score += 80; });
      var d = levenshtein(q, nm.slice(0, Math.max(q.length, 3)));
      score += Math.max(0, 60 - (d * 8));
      return { key: key, food: food, score: score };
    }).filter(function(x){ return x.score > 20; });
    list.sort(function(a, b){ return b.score - a.score; });
    return list.slice(0, limit || 8);
  }


  function findFoodByName(inputName) {
    var q = String(inputName || "").trim();
    if (!q) return null;

    var k = foodKey(q);
    if (NFOODS[k]) return NFOODS[k];

    var exact = Object.keys(NFOODS).find(function(key){
      return foodKey(NFOODS[key].name) === foodKey(q);
    });
    if (exact) return NFOODS[exact];

     var hits = foodSearch(q, 1);
    return hits.length ? hits[0].food : null;
  }

  function calcItem(food, grams, servings) {
    if (!food) return null;
    grams = +grams || 0;
    servings = +servings || 0;

    var g = grams;
    if (!g && servings && food.serving && food.serving.grams) g = servings * food.serving.grams;
    if (!g && food.serving && food.serving.grams) { g = food.serving.grams; servings = 1; }
    if (!g) return null;

    var per = food.per100 || {cal:0,p:0,c:0,f:0};
    function round1(x){ return Math.round(x * 10) / 10; }
    return {
      grams: Math.round(g),
      servings: servings ? round1(servings) : 0,
      cal: Math.round((per.cal || 0) * g / 100),
      p: round1((per.p || 0) * g / 100),
      c: round1((per.c || 0) * g / 100),
      f: round1((per.f || 0) * g / 100)
    };
  }

  function dayNutrition(ds) {
    ensureDay(ds);
    var items = NLOG[ds] || [];
    var totals = { cal:0, p:0, c:0, f:0 };
    items.forEach(function(it){
      totals.cal += +it.cal || 0;
      totals.p += +it.p || 0;
      totals.c += +it.c || 0;
      totals.f += +it.f || 0;
    });
    totals.cal = Math.round(totals.cal);
    totals.p = Math.round(totals.p * 10) / 10;
    totals.c = Math.round(totals.c * 10) / 10;
    totals.f = Math.round(totals.f * 10) / 10;
    return { items: items, totals: totals };
  }

  // -----------------------------
  // Auto targets (cut 12-15% BF)
  // -----------------------------
  function latestBodyweight() {
    var ds = Object.keys(BW).sort();
    if (!ds.length) return null;
    return +BW[ds[ds.length - 1]] || null;
  }

  function bwTrend14() {
    var ds = Object.keys(BW).sort();
    if (ds.length < 2) return null;
    var end = ds[ds.length - 1];
    var start = addDays(end, -14);
    var startKey = null;
    for (var i=0;i<ds.length;i++){ if (ds[i] >= start) { startKey = ds[i]; break; } }
    if (!startKey) startKey = ds[0];
    var bw0 = +BW[startKey] || 0;
    var bw1 = +BW[end] || 0;
    if (!bw0 || !bw1) return null;
    return { start: startKey, end: end, delta: (bw1 - bw0) };
  }

  function calcAutoGoals() {
var mode = USER.goalMode || "cut";
    var pace = USER.goalPace || USER.cutAggressiveness || "moderate";
var bw = latestBodyweight();
var maint = bw ? (bw * 15) : 2400;
 var delta = 0;
    if (mode === "cut") {
      delta = pace === "aggressive" ? -600 : pace === "moderate" ? -400 : -250;
    } else if (mode === "bulk") {
      delta = pace === "aggressive" ? 450 : pace === "moderate" ? 300 : 180;
    }

    var actAdj = 0;
    if ((USER.sessionsPerWeek || 0) >= 5) actAdj += 150;
    else if ((USER.sessionsPerWeek || 0) >= 3) actAdj += 75;
    if ((USER.stepsPerDay || 0) >= 10000) actAdj += 100;
    else if ((USER.stepsPerDay || 0) <= 5000) actAdj -= 100;

    var targetCal = Math.round(maint + actAdj + delta);

var tr = bw ? bwTrend14() : null;
     if (tr) {
      var perWeek = (tr.delta / 2);
      var pctPerWeek = (perWeek / bw) * 100;
      if (mode === "cut") {
        if (pctPerWeek <= -1.0) targetCal += 150;
        if (pctPerWeek >= -0.1) targetCal -= 150;
      }
      if (mode === "bulk") {
        if (pctPerWeek >= 0.6) targetCal -= 120;
        if (pctPerWeek <= 0.1) targetCal += 120;
      }
    }

    var pMult = mode === "cut" ? 0.9 : mode === "bulk" ? 0.8 : 0.85;
    var fMult = mode === "cut" ? 0.3 : mode === "bulk" ? 0.35 : 0.33;
    var useBw = bw || 200;
   var p = Math.round(useBw * pMult);
 var f = Math.round(useBw * fMult);
    var calFromPF = p * 4 + f * 9;
    var c = Math.max(0, Math.round((targetCal - calFromPF) / 4));

    return {
      cal: targetCal,
      p: p,
      c: c,
      f: f,
      mode: mode,
note: (bw ? "Auto-targets update from 14-day weight trend + activity." : "Log bodyweight for personalized targets; using a baseline estimate.") + " Goal: " + mode + "."
    };
  }

  // -----------------------------
  // Charts
  // -----------------------------
  function drawChart(id, labels, values) {
    setTimeout(function(){
      var cv = document.getElementById(id);
      if (!cv) return;
      var ctx = cv.getContext("2d");
      var dpr = window.devicePixelRatio || 1;
      var r = cv.getBoundingClientRect();
      cv.width = r.width * dpr;
      cv.height = r.height * dpr;
      ctx.scale(dpr, dpr);

      var Ww = r.width, Hh = r.height;
      ctx.clearRect(0,0,Ww,Hh);

      var bg = TH === "dark" ? "#0a0f1a" : "#f9fafb";
      var grid = TH === "dark" ? "#1f2937" : "#d1d5db";
      var txt = TH === "dark" ? "#9ca3af" : "#6b7280";
      var line = TH === "dark" ? "#60a5fa" : "#2563eb";

      ctx.fillStyle = bg;
      ctx.fillRect(0,0,Ww,Hh);

      var p = {t: 14, r: 12, b: 28, l: 40};
      var cw = Ww - p.l - p.r;
      var ch = Hh - p.t - p.b;

      if (!values.length) return;

      var mn = Math.min.apply(null, values);
      var mx = Math.max.apply(null, values);
      if (mn === mx) { mn -= 1; mx += 1; }
      var pad = (mx - mn) * 0.1;
      mn -= pad; mx += pad;

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (var i=0;i<=4;i++){
        var y = p.t + ch - (i/4)*ch;
        ctx.beginPath();
        ctx.moveTo(p.l, y);
        ctx.lineTo(Ww - p.r, y);
        ctx.stroke();
        ctx.fillStyle = txt;
        ctx.font = "10px -apple-system,sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(String(Math.round(mn + (mx-mn)*i/4)), p.l - 6, y + 3);
      }

      ctx.strokeStyle = line;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      values.forEach(function(v, i){
        var x = p.l + (i / Math.max(values.length-1,1))*cw;
        var y = p.t + ch - ((v - mn) / (mx - mn))*ch;
        if (i === 0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();

      ctx.fillStyle = txt;
      ctx.font = "9px -apple-system,sans-serif";
      ctx.textAlign = "center";
      var step = Math.max(1, Math.floor(labels.length/6));
      for (var j=0;j<labels.length;j+=step){
        var xx = p.l + (j / Math.max(labels.length-1,1))*cw;
        ctx.fillText(labels[j], xx, Hh - 10);
      }
    }, 50);
  }

  // -----------------------------
  // UI helpers
  // -----------------------------
  function todayQuote() {
    var i = Math.floor((Date.now()/86400000) % QUOTES.length);
    return QUOTES[i];
  }

  function esc(s){
    return String(s||"").replace(/[&<>"']/g,function(m){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  function showModal(html) {
    var el = document.getElementById("mover");
    if (!el) return;
    el.style.display = "flex";
    el.innerHTML = '<div class="mover-bg"><div class="modal">'+html+'</div></div>';
    var bg = el.querySelector(".mover-bg");
    if (bg) bg.addEventListener("click", function(e){ if (e.target === bg) closeModal(); });
  }
  function closeModal() {
    var el = document.getElementById("mover");
    if (!el) return;
    el.style.display = "none";
    el.innerHTML = "";
  }

  // Barcode scanning (Safari-safe, graceful fallback)
  function scanFoodBarcode() {
    // Requires HTTPS + user gesture
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return alert("Camera not available in this browser.");
    }
    if (typeof BarcodeDetector === "undefined") {
      alert("Barcode scanning isn\'t supported on this Safari version. You can still search & add foods manually.");
      return;
    }

    showModal(
      '<div style="padding:12px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
          '<div style="font-size:14px;font-weight:800">📷 Scan Barcode</div>'+
          '<button class="del" id="scan-x">×</button>'+
        '</div>'+
        '<div style="font-size:11px;color:var(--mt);margin-bottom:8px">Point your camera at a barcode. If it matches a saved item, it will be added. Otherwise you can link it.</div>'+
        '<video id="scan-vid" autoplay playsinline style="width:100%;border-radius:12px;background:#000;max-height:240px"></video>'+
        '<div id="scan-msg" style="margin-top:10px;font-size:11px;color:var(--mt)">Starting camera…</div>'+
        '<div id="scan-link" style="display:none;margin-top:12px"></div>'+
      '</div>'
    );

    var stop = function(stream) {
      if (!stream) return;
      try { stream.getTracks().forEach(function(t){ t.stop(); }); } catch(e){}
    };

    var streamRef = null;
    var detector = new BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128","qr_code"] });
    var vid = document.getElementById("scan-vid");
    var msg = document.getElementById("scan-msg");
    var link = document.getElementById("scan-link");
    var close = function(){ stop(streamRef); closeModal(); };

    var x = document.getElementById("scan-x");
    if (x) x.addEventListener("click", close);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(function(stream){
        streamRef = stream;
        vid.srcObject = stream;
        msg.textContent = "Scanning…";
        var tick = function(){
          if (!vid || vid.readyState < 2) { requestAnimationFrame(tick); return; }
          detector.detect(vid).then(function(codes){
            if (codes && codes.length) {
              var raw = codes[0].rawValue || "";
              if (!raw) { requestAnimationFrame(tick); return; }
              // Found a code
              msg.textContent = "Found: " + raw;
              // If mapped, add immediately
              var fk = NUPC[raw];
              if (fk && NFOODS[fk]) {
                if (!NLOG[selDate]) NLOG[selDate] = [];
                NLOG[selDate].push(calcItem(NFOODS[fk], 0, 1));
                saveAll();
                stop(streamRef);
                closeModal();
                render();
                return;
              }
              // Otherwise offer linking
              var opts = Object.keys(NFOODS).sort().map(function(k){
                return '<option value="'+esc(k)+'">'+esc(NFOODS[k].name)+'</option>';
              }).join("");
              link.style.display = "block";
              link.innerHTML =
                '<div style="background:var(--c2);border-radius:12px;padding:10px">'+
                  '<div style="font-size:12px;font-weight:700;margin-bottom:8px">Link barcode to a food</div>'+
                  '<select class="inp" id="scan-pick" style="width:100%;margin-bottom:8px">'+opts+'</select>'+
                  '<div class="row" style="gap:8px">'+
                    '<button class="btn bp" id="scan-link-btn" style="flex:1">Save Link</button>'+
                    '<button class="btn bs" id="scan-cancel" style="width:110px">Cancel</button>'+
                  '</div>'+
                '</div>';
              var cancel = document.getElementById("scan-cancel");
              if (cancel) cancel.addEventListener("click", close);
              var linkBtn = document.getElementById("scan-link-btn");
              if (linkBtn) linkBtn.addEventListener("click", function(){
                var pick = document.getElementById("scan-pick");
                var key = pick ? pick.value : "";
                if (!key || !NFOODS[key]) return;
                NUPC[raw] = key;
                saveAll();
                if (!NLOG[selDate]) NLOG[selDate] = [];
                NLOG[selDate].push(calcItem(NFOODS[key], 0, 1));
                saveAll();
                stop(streamRef);
                closeModal();
                render();
              });
              // pause loop (keep stream) until user acts
              return;
            }
            requestAnimationFrame(tick);
          }).catch(function(){
            requestAnimationFrame(tick);
          });
        };
        requestAnimationFrame(tick);
      })
      .catch(function(err){
        msg.textContent = "Camera error: " + (err && err.message ? err.message : err);
      });
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  function render() {
    applyTheme();
    ensureDay(selDate);

    sv("il_view", view);
    sv("il_selDate", selDate);

    var app = document.getElementById("app");
    if (!app) return;

    var h = "";

    if (view === "log") {
      var q = todayQuote();
      h += '<div class="quote-box"><div class="quote-text">"'+esc(q.t)+'"</div><div class="quote-author">— '+esc(q.a)+'</div></div>';
    }

    h += '<div class="card" style="padding:8px">';
    h += '<div class="row" style="justify-content:space-between;align-items:center">';
    h += '<button class="pm" id="d-prev">←</button>';
    h += '<div style="text-align:center"><div style="font-size:15px;font-weight:800">'+esc(fmtD(selDate))+'</div><div style="font-size:10px;color:var(--mt)">'+(selDate===tod()?"Today":esc(selDate))+'</div></div>';
    h += '<button class="pm" id="d-next">→</button>';
    h += '</div></div>';


    // Weekly adherence + guardrails (last 7 days)
    var adh = weeklyAdherence();
    var adhPct = Math.round(adh.score * 100);
    var volMsg = (adh.sets > adh.setCap) ? ('⚠️ Volume high ('+adh.sets+' sets / 7d). Consider trimming accessories.') : ('✅ Volume OK ('+adh.sets+' sets / 7d)');
    h += '<div class="card" style="margin-top:8px">';
    h += '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px">';
    h += '<div style="font-size:13px;font-weight:800">📌 Weekly Adherence</div>';
    h += '<div style="font-size:14px;font-weight:900;color:var(--gn)">'+adhPct+'%</div>';
    h += '</div>';
    h += '<div style="font-size:11px;color:var(--mt)">Workouts: <strong style="color:var(--tx)">'+adh.workouts+'/'+adh.plan+'</strong> · '+volMsg+'</div>';
    h += '</div>';

    if (view === "log") {
      var bw = BW[selDate];
      h += '<div class="card">';
      h += '<div class="row" style="justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:10px;color:var(--mt);text-transform:uppercase;font-weight:700">⚖️ Body Weight</div>';
      h += bw ? '<div style="font-size:22px;font-weight:900;color:var(--pk)">'+bw+' lbs</div>' : '<div style="font-size:11px;color:var(--mt)">Not logged</div>';
      h += '</div>';
      h += '<div class="row" style="gap:6px"><input type="number" class="inp" id="bw-inp" style="width:90px" placeholder="lbs" value="'+(bw||"")+'"><button class="btn bs" id="bw-btn" style="padding:8px 12px">'+(bw?"✓":"Log")+'</button></div>';
      h += '</div></div>';

      var day = W[selDate] || [];
      h += '<div class="row" style="justify-content:space-between;margin-top:4px;align-items:center">';
      h += '<div class="sect" style="margin:0">🏋️ Today\'s Workout</div>';
      h += '<button class="btn bp" id="add-ex-btn" style="padding:6px 10px;font-size:11px">➕ Add</button>';
      h += '</div><div style="height:8px"></div>';

      if (!day.length) {
        h += '<div class="empty"><div style="font-size:40px;margin-bottom:8px">🏋️</div>No exercises logged yet.</div>';
      } else {
        day.forEach(function(ex, idx){
          h += '<div class="card" style="margin-bottom:8px">';
          h += '<div class="row" style="justify-content:space-between;align-items:flex-start">';
          h += '<div><div style="font-size:12px;color:var(--mt);font-weight:700">'+esc(ex.group)+'</div>';
          h += '<div style="font-size:15px;font-weight:900">'+esc(ex.exercise)+'</div>';
          h += '<div style="font-size:11px;color:var(--mt);margin-top:4px">'+ex.sets.map(function(s){ return (s.r||0)+'×'+((+s.w||0)>0? s.w+' lb':'BW'); }).join(" · ")+'</div></div>';
          h += '<button class="del" data-act="rm-ex" data-i="'+idx+'">×</button>';
          h += '</div>';
            h += '<div style="margin-top:8px;display:grid;grid-template-columns:44px 1fr 1fr;gap:6px;align-items:center">';
          h += '<div style="font-size:10px;color:var(--mt);font-weight:700">Set</div>';
          h += '<div style="font-size:10px;color:var(--mt);font-weight:700">Reps</div>';
          h += '<div style="font-size:10px;color:var(--mt);font-weight:700">Weight (lb)</div>';
          (ex.sets || []).forEach(function(st, sIdx){
            h += '<div style="font-size:11px;color:var(--mt)">#'+(sIdx+1)+'</div>';
            h += '<input class="inp" data-act="set-reps" data-i="'+idx+'" data-s="'+sIdx+'" type="number" min="0" max="100" value="'+(+st.r||0)+'" style="padding:6px 8px">';
            h += '<input class="inp" data-act="set-weight" data-i="'+idx+'" data-s="'+sIdx+'" type="number" min="0" step="2.5" value="'+(+st.w||0)+'" style="padding:6px 8px">';
          });
          h += '</div>';
          if (ex.note) h += '<div style="margin-top:8px;font-size:11px;color:var(--mt);font-style:italic">📝 '+esc(ex.note)+'</div>';
          h += '</div>';
        });
      }
    }

    if (view === "history") {
      h += '<div class="sect">📋 History</div>';
      var dates = Object.keys(W).sort().reverse().filter(function(d){ return (W[d]||[]).length; });
      if (!dates.length) {
        h += '<div class="empty"><div style="font-size:36px;margin-bottom:8px">📋</div>No workouts yet.</div>';
      } else {
        dates.slice(0, 60).forEach(function(d){
          var entries = W[d] || [];
          var vol = 0, sets = 0;
          entries.forEach(function(e){
            (e.sets||[]).forEach(function(s){
              vol += (+s.r||0) * (+s.w||0);
              sets++;
            });
          });
          h += '<div class="card" style="margin-bottom:8px">';
          h += '<div class="row" style="justify-content:space-between;align-items:center">';
          h += '<div><div style="font-size:13px;font-weight:900">'+esc(fmtD(d))+'</div>';
          h += '<div style="font-size:10px;color:var(--mt)">'+entries.length+' exercises · '+sets+' sets · '+Math.round(vol).toLocaleString()+' lbs volume</div></div>';
          h += '<button class="btn bs" data-act="jump" data-date="'+d+'" style="padding:5px 10px;font-size:10px">Open</button>';
          h += '</div></div>';
        });
        h += '<div style="font-size:10px;color:var(--mt);text-align:center;margin-top:10px">Showing last 60 workout days.</div>';
      }
    }

    if (view === "progress") {
      h += '<div class="sect">📈 Progress</div>';
      var bwD = Object.keys(BW).sort();
      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:4px">⚖️ Bodyweight</div>';
      if (bwD.length >= 2) {
        var v = bwD.map(function(d){ return +BW[d]; });
        var cur = v[v.length-1], start = v[0], diff = cur-start;
        h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">Current: <strong style="color:var(--pk)">'+cur+'</strong> lbs · Change: <strong>'+(diff>0?'+':'')+diff.toFixed(1)+'</strong></div>';
        h += '<canvas id="bw-ch" style="width:100%;height:180px"></canvas>';
      } else {
        h += '<div style="font-size:11px;color:var(--mt)">Log bodyweight 2+ days.</div>';
      }
      h += '</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">🏆 PRs (Est. 1RM)</div>';
      var prNames = Object.keys(PR).sort(function(a,b){ return (PR[b].e1rm||0)-(PR[a].e1rm||0); });
      if (!prNames.length) {
        h += '<div style="font-size:11px;color:var(--mt)">No PRs yet. Log weights & reps.</div>';
      } else {
        prNames.slice(0, 20).forEach(function(n){
          var p = PR[n];
          h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--c2)">';
          h += '<div><div style="font-size:12px;font-weight:800">'+esc(n)+'</div><div style="font-size:10px;color:var(--mt)">'+esc(fmtS(p.date||tod()))+' · '+p.w+'×'+p.r+'</div></div>';
          h += '<div style="font-size:15px;font-weight:900;color:var(--yl)">'+(p.e1rm||0)+'</div>';
          h += '</div>';
        });
      }
      h += '</div>';

      var g = calcAutoGoals();
h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">🎯 Auto Nutrition Targets</div>';
       h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">';
      h += '<div><div style="font-size:18px;font-weight:900">'+g.cal+'</div><div style="font-size:10px;color:var(--mt)">Calories</div></div>';
      h += '<div><div style="font-size:18px;font-weight:900">'+g.p+'g</div><div style="font-size:10px;color:var(--mt)">Protein</div></div>';
      h += '<div><div style="font-size:18px;font-weight:900">'+g.c+'g</div><div style="font-size:10px;color:var(--mt)">Carbs</div></div>';
      h += '<div><div style="font-size:18px;font-weight:900">'+g.f+'g</div><div style="font-size:10px;color:var(--mt)">Fat</div></div>';
      h += '</div>';
      h += '<div style="margin-top:10px;font-size:10px;color:var(--mt)">'+esc(g.note)+'</div>';
      h += '</div>';
    }

    if (view === "nutrition") {
      var dayData = dayNutrition(selDate);
      var totals = dayData.totals;
      var goals = calcAutoGoals();
 var foodHits = foodSearch(FOOD_SEARCH_TEXT, 6);
      h += '<div class="sect">🍽️ Nutrition</div>';
h += '<div class="card">';
      h += '<div style="font-size:13px;font-weight:900;margin-bottom:8px">🔎 Food Finder (fuzzy search)</div>';
      h += '<input class="inp" id="food-search" value="'+esc(FOOD_SEARCH_TEXT)+'" placeholder="Search foods (e.g., chkn brst, yogrt, bagle)">';
      if (FOOD_SEARCH_TEXT && !foodHits.length) {
        h += '<div style="font-size:11px;color:var(--mt);margin-top:8px">No matches yet. Try a shorter term.</div>';
      }
      foodHits.forEach(function(hit){
        var f = hit.food || {};
        var per = f.per100 || {cal:0,p:0,c:0,f:0};
        h += '<div style="margin-top:8px;padding:8px;border:1px solid var(--c2);border-radius:10px;display:flex;justify-content:space-between;gap:8px;align-items:center">';
        h += '<div style="min-width:0"><div style="font-size:12px;font-weight:800">'+esc(f.name || hit.key)+'</div>';
        h += '<div style="font-size:10px;color:var(--mt)">Per 100g: '+Math.round(per.cal||0)+' cal · P '+(per.p||0)+' · C '+(per.c||0)+' · F '+(per.f||0)+'</div></div>';
        h += '<button class="btn bs food-use" data-key="'+esc(hit.key)+'" style="padding:6px 10px;font-size:11px">Use</button>';
        h += '</div>';
      });
      h += '</div>';
      var calPct = Math.min(100, Math.round((totals.cal / goals.cal) * 100));
      var pPct = Math.min(100, Math.round((totals.p / goals.p) * 100));
      h += '<div class="card">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      h += '<div style="font-size:13px;font-weight:900">Daily Targets</div>';
 h += '<div style="font-size:10px;color:var(--mt)">Auto ('+esc((goals.mode||"cut").charAt(0).toUpperCase() + (goals.mode||"cut").slice(1))+')</div>';
       h += '</div>';
      h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center">';
      h += '<div><div style="font-size:16px;font-weight:900">'+totals.cal+' / '+goals.cal+'</div><div style="font-size:10px;color:var(--mt)">Calories</div></div>';
      h += '<div><div style="font-size:16px;font-weight:900">'+Math.round(totals.p)+' / '+goals.p+'g</div><div style="font-size:10px;color:var(--mt)">Protein</div></div>';
      h += '<div><div style="font-size:16px;font-weight:900">'+Math.round(totals.c)+' / '+goals.c+'g</div><div style="font-size:10px;color:var(--mt)">Carbs</div></div>';
      h += '<div><div style="font-size:16px;font-weight:900">'+Math.round(totals.f)+' / '+goals.f+'g</div><div style="font-size:10px;color:var(--mt)">Fat</div></div>';
      h += '</div>';
      h += '<div style="margin-top:10px">';
      h += '<div style="font-size:10px;color:var(--mt);margin-bottom:4px">Calories ('+calPct+'%)</div>';
      h += '<div style="height:8px;background:var(--c2);border-radius:8px;overflow:hidden"><div style="height:100%;width:'+calPct+'%;background:linear-gradient(to right,var(--bl),var(--pu))"></div></div>';
      h += '<div style="height:8px"></div>';
      h += '<div style="font-size:10px;color:var(--mt);margin-bottom:4px">Protein ('+pPct+'%)</div>';
      h += '<div style="height:8px;background:var(--c2);border-radius:8px;overflow:hidden"><div style="height:100%;width:'+pPct+'%;background:linear-gradient(to right,var(--gn),var(--yl))"></div></div>';
      h += '</div>';
      h += '</div>';

      h += '<div class="card">';
      h += '<div style="font-size:13px;font-weight:900;margin-bottom:8px">➕ Add Food</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 100px 90px;gap:8px;align-items:end">';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Food</div>';
      h += '<input class="inp" id="food-name" placeholder="e.g., chicken, rice, yogurt" list="foodlist"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Grams</div><input class="inp" type="number" id="food-grams" placeholder="g"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Servings</div><input class="inp" type="number" id="food-serv" placeholder="x" step="0.5"></div>';
      h += '</div>';
      h += '<div class="row" style="gap:8px;margin-top:10px"><button class="btn bp bf" id="add-food-btn" style="flex:1">Add</button><button class="btn bs bf" id="scan-food-btn" style="width:120px">📷 Scan</button></div>';

      h += '<datalist id="foodlist">';
      Object.keys(NFOODS).sort().forEach(function(k){
        h += '<option value="'+esc(NFOODS[k].name)+'"></option>';
      });
      h += '</datalist>';

      h += '<div style="margin-top:12px;font-size:12px;font-weight:900">⚡ Quick Add</div>';
      h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">';
      QUICK_FOODS.forEach(function(nm){
        var food = findFoodByName(nm);
        var it = food ? calcItem(food, 0, 1) : null; // default serving
        var meta = it ? ('<span style="font-size:9px;color:var(--mt);margin-left:6px">'+it.cal+' cal · '+it.p+'P</span>') : '';
        h += '<button class="btn bs food-quick" data-name="'+esc(nm)+'" style="padding:6px 10px;font-size:11px;display:flex;align-items:center;gap:6px">'+
              '<span>'+esc(nm)+'</span>'+meta+
             '</button>';
      });
      h += '</div>';

      h += '<div style="margin-top:10px;font-size:10px;color:var(--mt)">Tip: Use grams for cooked weights (e.g., 175g chicken). Servings uses the default serving size.</div>';
      h += '</div>';


      // Meal presets
      h += '<div class="card">';
      h += '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">';
      h += '<div style="font-size:13px;font-weight:800">🍱 Meal Presets</div>';
      h += '<button class="btn bs" id="save-preset-btn" style="padding:6px 10px;font-size:11px">💾 Save today</button>';
      h += '</div>';
      if (!MEAL_PRESETS.length) {
        h += '<div style="font-size:11px;color:var(--mt)">No presets yet.</div>';
      } else {
        MEAL_PRESETS.forEach(function(p){
          h += '<div class="row" style="justify-content:space-between;gap:8px;margin-bottom:6px">';
          h += '<button class="btn bp preset-add" data-id="'+p.id+'" style="flex:1;padding:8px 10px;font-size:12px;text-align:left">➕ '+p.name+'</button>';
          h += '<button class="del preset-del" data-id="'+p.id+'" title="Delete">×</button>';
          h += '</div>';
        });
      }
      if (canScanBarcode()) {
        h += '<div style="height:6px"></div>';
        h += '<button class="btn bs" id="scan-barcode-btn" style="width:100%">📷 Scan Barcode</button>';
        h += '<div style="font-size:10px;color:var(--mt);margin-top:6px">Optional: map barcodes to foods once, then 1-tap add.</div>';
      }
      h += '</div>';


      h += '<div class="card">';
      h += '<div style="font-size:13px;font-weight:900;margin-bottom:8px">Food Log</div>';
      if (!dayData.items.length) {
        h += '<div style="font-size:11px;color:var(--mt)">No food logged today.</div>';
      } else {
        dayData.items.slice().sort(function(a,b){ return (+b.at||0)-(+a.at||0); }).forEach(function(it){
          h += '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--c2)">';
          h += '<div style="min-width:0">';
          h += '<div style="font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(it.name)+'</div>';
          var amt = [];
          if (it.grams) amt.push(it.grams + "g");
          if (it.servings) amt.push(it.servings + " srv");
          h += '<div style="font-size:10px;color:var(--mt)">'+esc(amt.join(" · "))+'</div>';
          h += '<div style="font-size:10px;color:var(--mt)">'+Math.round(it.cal||0)+' cal · P '+Math.round(it.p||0)+' · C '+Math.round(it.c||0)+' · F '+Math.round(it.f||0)+'</div>';
          h += '</div>';
          h += '<button class="del food-del" data-i="'+(dayData.items.indexOf(it))+'">×</button>';
          h += '</div>';
        });
      }
      h += '</div>';
    }

    if (view === "templates") {
      h += '<div class="sect">📁 Routines</div>';
      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">Coming soon</div>';
      h += '<div style="font-size:11px;color:var(--mt)">This clean rebuild focuses on stability + logging + nutrition. Next upgrade: routines & weekly planning.</div></div>';
    }

    if (view === "more") {
      h += '<div class="sect">⚡ More</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:10px">Settings</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Training sessions/week</div><input id="set-sess" class="inp" type="number" min="0" max="14" value="'+(USER.sessionsPerWeek||5)+'"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Steps/day</div><input id="set-steps" class="inp" type="number" min="0" max="30000" step="500" value="'+(USER.stepsPerDay||10000)+'"></div>';
      h += '</div>';
      h += '<div style="height:10px"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:6px">Goal</div>';
      var gm = USER.goalMode || "cut";
      h += '<div class="row" style="gap:6px;flex-wrap:wrap">';
      ["cut","maintain","bulk"].forEach(function(x){
        h += '<button class="btn bs set-goal'+(gm===x?' on':'')+'" data-v="'+x+'" style="padding:6px 10px;font-size:11px">'+x+'</button>';
      });
      h += '</div></div>';
      h += '<div style="height:10px"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:6px">Goal pace</div>';
      var ag = USER.goalPace || USER.cutAggressiveness || "moderate";
      h += '<div class="row" style="gap:6px;flex-wrap:wrap">';
      ["performance","moderate","aggressive"].forEach(function(x){
        var lbl = x==="performance" ? "performance" : x;
        h += '<button class="btn bs set-aggr'+(ag===x?' on':'')+'" data-v="'+x+'" style="padding:6px 10px;font-size:11px">'+lbl+'</button>';
      });
      h += '</div></div>';
      h += '<button class="btn bp bf" id="save-settings" style="margin-top:12px">Save Settings</button>';
      h += '</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:10px">💾 Data</div>';
      h += '<div class="row" style="gap:8px;flex-wrap:wrap">';
      h += '<button class="btn bs" id="export-btn" style="flex:1">📤 Export</button>';
      h += '<button class="btn bs" id="import-btn" style="flex:1">📥 Import</button>';
      h += '<button class="btn" id="reset-btn" style="background:var(--rd);color:#fff;flex:1">🗑 Reset</button>';
      h += '</div>';
      h += '<input type="file" id="import-file" accept=".json" style="display:none">';
      h += '<div style="font-size:10px;color:var(--mt);margin-top:10px">Export saves workouts, bodyweight, PRs, foods & nutrition logs.</div>';
      h += '</div>';
    }

    app.innerHTML = h;
    bindEvents();

    if (view === "progress") {
      var bwD2 = Object.keys(BW).sort();
      if (bwD2.length >= 2) drawChart("bw-ch", bwD2.map(fmtS), bwD2.map(function(d){ return +BW[d]; }));
    }
  }

  // -----------------------------
  // Modals: Add exercise
  // -----------------------------
  function openAddExerciseModal() {
    var groups = Object.keys(EX);

    var html = '';
    html += '<div style="padding:14px;min-width:280px;max-width:520px">';
    html += '<div style="font-size:16px;font-weight:900;margin-bottom:10px">➕ Add Exercise</div>';

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Group</div>';
    html += '<select class="inp" id="ae-group">';
    groups.forEach(function(x){ html += '<option value="'+esc(x)+'">'+esc(x)+'</option>'; });
    html += '</select></div>';

    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Exercise</div>';
    html += '<select class="inp" id="ae-ex"></select></div>';
    html += '</div>';
 html += '<div class="row" style="gap:8px;margin-top:8px">';
    html += '<input class="inp" id="ae-custom" placeholder="Or add custom workout" style="flex:1">';
    html += '<button class="btn bs" id="ae-custom-add" style="padding:8px 10px">Save</button>';
    html += '</div>';
    html += '<div style="height:10px"></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Sets</div><input class="inp" id="ae-sets" type="number" min="1" max="10" value="3"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Reps</div><input class="inp" id="ae-reps" type="number" min="1" max="50" value="8"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Weight</div><input class="inp" id="ae-w" type="number" min="0" step="5" value="0"></div>';
    html += '</div>';

    html += '<div style="height:10px"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Note (optional)</div><textarea class="txta" id="ae-note" placeholder="e.g., RPE 8, paused reps..."></textarea></div>';

    html += '<div class="row" style="gap:8px;justify-content:flex-end;margin-top:12px">';
    html += '<button class="btn bs" id="ae-cancel">Cancel</button>';
    html += '<button class="btn bp" id="ae-add">Add</button>';
    html += '</div>';

    html += '</div>';

    showModal(html);

    var hintEl = document.getElementById("ae-hint");
    function updateHint(){
      if(!hintEl) return;
      var exSel2 = document.getElementById("ae-ex");
      var exName = exSel2 ? exSel2.value : "";
      var sug = overloadSuggestion(exName);
      if(!sug){
        hintEl.style.display = "none";
        hintEl.innerHTML = "";
        return;
      }
      hintEl.style.display = "block";
      hintEl.innerHTML = '📈 Progressive Overload · Last ('+fmtS(sug.last.date)+') '+
        sug.last.w+'×'+sug.last.r+
        ' · Try <strong>'+sug.opt1.w+'×'+sug.opt1.r+'</strong> or <strong>'+sug.opt2.w+'×'+sug.opt2.r+'</strong>';
    }


    function fillExercises(group) {
      var exSel = document.getElementById("ae-ex");
      if (!exSel) return;
       var list = exerciseList(group);
      exSel.innerHTML = list.map(function(n){ return '<option value="'+esc(n)+'">'+esc(n)+'</option>'; }).join("");
    }

    var gSel = document.getElementById("ae-group");
    if (gSel) {
      fillExercises(gSel.value);
    updateHint();
     gSel.addEventListener("change", function(){ fillExercises(this.value); updateHint(); });
    }
 var customAdd = document.getElementById("ae-custom-add");
    if (customAdd) customAdd.addEventListener("click", function(){
      var grp = (document.getElementById("ae-group") || {}).value || "Chest";
      var customName = ((document.getElementById("ae-custom") || {}).value || "").trim();
      if (!customName) return;
      if (!CEX[grp]) CEX[grp] = [];
      var exists = exerciseList(grp).some(function(n){ return n.toLowerCase() === customName.toLowerCase(); });
      if (!exists) CEX[grp].push(customName);
      fillExercises(grp);
      var exSel = document.getElementById("ae-ex");
      if (exSel) exSel.value = customName;
      document.getElementById("ae-custom").value = "";
      saveAll();
      updateHint();
    });

    var exSel = document.getElementById("ae-ex");
    if (exSel) exSel.addEventListener("change", updateHint);

    var cancel = document.getElementById("ae-cancel");
    if (cancel) cancel.addEventListener("click", closeModal);

    var add = document.getElementById("ae-add");
    if (add) add.addEventListener("click", function(){
      var grp = (document.getElementById("ae-group") || {}).value || "Chest";
      var ex = (document.getElementById("ae-ex") || {}).value || "Bench Press";
      var setsN = parseInt((document.getElementById("ae-sets") || {}).value, 10) || 3;
      var reps = parseInt((document.getElementById("ae-reps") || {}).value, 10) || 8;
      var wt = parseFloat((document.getElementById("ae-w") || {}).value) || 0;
      var note = ((document.getElementById("ae-note") || {}).value || "").trim();

      ensureDay(selDate);
      var entry = { group: grp, exercise: ex, sets: [], note: note };
      for (var i=0;i<setsN;i++) entry.sets.push({ r: reps, w: wt });

      W[selDate].push(entry);
      updatePRFromEntry(selDate, entry);
      saveAll();
      closeModal();
      render();
    });
  }

  // -----------------------------
  // Events
  // -----------------------------
  function bindEvents() {
    var prev = document.getElementById("d-prev");
    var next = document.getElementById("d-next");
    if (prev) prev.onclick = function(){ selDate = addDays(selDate, -1); sv("il_selDate", selDate); render(); };
    if (next) next.onclick = function(){ selDate = addDays(selDate, 1); sv("il_selDate", selDate); render(); };

    var themeBtn = document.getElementById("thm-btn");
    if (themeBtn) themeBtn.onclick = function(){
      TH = (TH === "dark") ? "light" : "dark";
      saveAll();
      render();
    };

    document.querySelectorAll(".nb").forEach(function(btn){
      btn.onclick = function(){
        view = this.getAttribute("data-v") || "log";
        sv("il_view", view);
        document.querySelectorAll(".nb").forEach(function(b){ b.classList.remove("on"); });
        this.classList.add("on");
        render();
      };
    });
    document.querySelectorAll(".nb").forEach(function(btn){
      btn.classList.toggle("on", (btn.getAttribute("data-v") === view));
    });

    var bwBtn = document.getElementById("bw-btn");
    if (bwBtn) bwBtn.onclick = function(){
      var inp = document.getElementById("bw-inp");
      var v = inp ? parseFloat(inp.value) : 0;
      if (!v || v < 50) return alert("Enter a valid weight (lbs).");
      BW[selDate] = Math.round(v * 10) / 10;
      saveAll();
      render();
    };

    var addEx = document.getElementById("add-ex-btn");
    if (addEx) addEx.onclick = openAddExerciseModal;

    document.querySelectorAll('[data-act="rm-ex"]').forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        if (isNaN(i)) return;
        if (!W[selDate]) return;
        W[selDate].splice(i, 1);
        saveAll();
        render();
      };
    });
 document.querySelectorAll('[data-act="set-reps"], [data-act="set-weight"]').forEach(function(inp){
      inp.onchange = function(){
        var exIdx = parseInt(this.getAttribute("data-i"), 10);
        var setIdx = parseInt(this.getAttribute("data-s"), 10);
        if (isNaN(exIdx) || isNaN(setIdx)) return;
        var day = W[selDate] || [];
        var ex = day[exIdx];
        if (!ex || !ex.sets || !ex.sets[setIdx]) return;
        var v = parseFloat(this.value) || 0;
        if (this.getAttribute("data-act") === "set-reps") ex.sets[setIdx].r = Math.max(0, Math.round(v));
        else ex.sets[setIdx].w = Math.max(0, Math.round(v * 10) / 10);
        updatePRFromEntry(selDate, ex);
        saveAll();
        render();
      };
    });
    document.querySelectorAll('[data-act="jump"]').forEach(function(btn){
      btn.onclick = function(){
        var d = this.getAttribute("data-date");
        if (!d) return;
        selDate = d;
        view = "log";
        sv("il_selDate", selDate);
        sv("il_view", view);
        document.querySelectorAll(".nb").forEach(function(b){
          b.classList.toggle("on", (b.getAttribute("data-v") === "log"));
        });
        render();
      };
    });

    var addFoodBtn = document.getElementById("add-food-btn");
    if (addFoodBtn) addFoodBtn.onclick = function(){
      var nameEl = document.getElementById("food-name");
      var gramsEl = document.getElementById("food-grams");
      var servEl = document.getElementById("food-serv");

      var name = (nameEl && nameEl.value ? nameEl.value : "").trim();
      if (!name) return alert("Enter a food name.");

      var food = findFoodByName(name);
      if (!food) return alert("Food not found. Try selecting from the dropdown suggestions.");

      var grams = parseFloat(gramsEl && gramsEl.value ? gramsEl.value : "") || 0;
      var servings = parseFloat(servEl && servEl.value ? servEl.value : "") || 0;

      var calc = calcItem(food, grams, servings);
      if (!calc) return alert("Enter grams or servings.");

      ensureDay(selDate);
          var foodKeyHit = foodKey(food.name || name);
      NLOG[selDate].push({
        id: uid(),
        name: food.name,
          key: foodKeyHit,
        grams: calc.grams,
        servings: calc.servings,
        cal: calc.cal,
        p: calc.p,
        c: calc.c,
        f: calc.f,
        at: Date.now()
      });

      if (nameEl) nameEl.value = "";
      if (gramsEl) gramsEl.value = "";
      if (servEl) servEl.value = "";

      saveAll();
      render();
    };
var foodSearchEl = document.getElementById("food-search");
    if (foodSearchEl) {
      foodSearchEl.oninput = function(){
        FOOD_SEARCH_TEXT = this.value || "";
        sv("il_food_search", FOOD_SEARCH_TEXT);
        render();
      };
    }

    document.querySelectorAll(".food-use").forEach(function(btn){
      btn.onclick = function(){
        var k = this.getAttribute("data-key");
        if (!k || !NFOODS[k]) return;
        var n = document.getElementById("food-name");
        if (n) n.value = NFOODS[k].name || k;
      };
    });
    // Barcode scan (optional)
    var scanBtn = document.getElementById("scan-food-btn");
    if (scanBtn) scanBtn.addEventListener("click", scanFoodBarcode);

    document.querySelectorAll(".food-quick").forEach(function(btn){
      btn.onclick = function(){
        var nm = this.getAttribute("data-name");
        var food = findFoodByName(nm);
        if (!food) return alert("Quick food missing from database.");
        var calc = calcItem(food, 0, 1);
        if (!calc) return;
        ensureDay(selDate);
        NLOG[selDate].push({
          id: uid(),
          name: food.name,
          grams: calc.grams,
          servings: calc.servings,
          cal: calc.cal,
          p: calc.p,
          c: calc.c,
          f: calc.f,
          at: Date.now()
        });
        saveAll();
        render();
      };
    });

    
    // Meal presets events
    document.querySelectorAll(".preset-add").forEach(function(btn){
      btn.onclick = function(){
        var pid = this.getAttribute("data-id");
        if(pid) addPresetToDay(pid);
      };
    });
    document.querySelectorAll(".preset-del").forEach(function(btn){
      btn.onclick = function(){
        var pid = this.getAttribute("data-id");
        if(!pid) return;
        if(!confirm("Delete this preset?")) return;
        MEAL_PRESETS = MEAL_PRESETS.filter(function(p){ return p.id !== pid; });
        saveMealPresets();
        render();
      };
    });
    var sp = document.getElementById("save-preset-btn");
    if(sp) sp.onclick = function(){ saveTodayAsPreset(); };
    var sbc = document.getElementById("scan-barcode-btn");
    if(sbc) sbc.onclick = function(){ openBarcodeScanner(); };

document.querySelectorAll(".food-del").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        if (isNaN(i)) return;
        if (!NLOG[selDate]) return;
        NLOG[selDate].splice(i, 1);
        saveAll();
        render();
      };
    });

    var saveSet = document.getElementById("save-settings");
    if (saveSet) saveSet.onclick = function(){
      var sess = parseInt((document.getElementById("set-sess")||{}).value, 10);
      var steps = parseInt((document.getElementById("set-steps")||{}).value, 10);
      if (!isNaN(sess)) USER.sessionsPerWeek = Math.max(0, Math.min(14, sess));
      if (!isNaN(steps)) USER.stepsPerDay = Math.max(0, Math.min(30000, steps));
      saveAll();
      alert("Saved!");
      render();
    };
    document.querySelectorAll(".set-aggr").forEach(function(btn){
      btn.onclick = function(){
USER.goalPace = this.getAttribute("data-v") || "moderate";
        USER.cutAggressiveness = USER.goalPace;
        saveAll();
        render();
      };
    });
    document.querySelectorAll(".set-goal").forEach(function(btn){
      btn.onclick = function(){
        USER.goalMode = this.getAttribute("data-v") || "cut";
         saveAll();
        render();
      };
    });

    var exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.onclick = function(){
      var data = { W:W, BW:BW, PR:PR, NLOG:NLOG, NFOODS:NFOODS, USER:USER, TH:TH };
      var blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ironlog_backup.json";
      a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 5000);
    };

    var importBtn = document.getElementById("import-btn");
    var importFile = document.getElementById("import-file");
    if (importBtn && importFile) importBtn.onclick = function(){ importFile.click(); };
    if (importFile) importFile.onchange = function(){
      var f = importFile.files && importFile.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function(){
        try {
          var data = JSON.parse(String(r.result||"{}"));
          if (data.W) W = data.W;
          if (data.BW) BW = data.BW;
          if (data.PR) PR = data.PR;
          if (data.NLOG) NLOG = data.NLOG;
          if (data.NFOODS) NFOODS = data.NFOODS;
          if (data.USER) USER = data.USER;
          if (data.TH) TH = data.TH;
          saveAll();
          alert("Imported!");
          render();
        } catch (e) {
          alert("Import failed: invalid JSON.");
        }
      };
      r.readAsText(f);
      importFile.value = "";
    };

    var resetBtn = document.getElementById("reset-btn");
    if (resetBtn) resetBtn.onclick = function(){
      if (!confirm("Reset all data? This cannot be undone.")) return;
      W = {}; BW = {}; PR = {}; NLOG = {};
      saveAll();
      render();
    };
  }

  document.querySelectorAll(".nb").forEach(function(btn){
    btn.classList.toggle("on", (btn.getAttribute("data-v") === view));
  });

  applyTheme();
  saveAll();
  render();
});
