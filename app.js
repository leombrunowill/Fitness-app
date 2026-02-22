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
    var EQUIPMENT_OPTIONS = ["Barbell", "Dumbbell", "Machine", "Plate Loaded", "Smith Machine"];
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


  function sanitizeNutritionState() {
    if (!NFOODS || typeof NFOODS !== "object" || Array.isArray(NFOODS)) NFOODS = {};
    if (!Array.isArray(MEAL_PRESETS)) MEAL_PRESETS = [];
    MEAL_PRESETS = MEAL_PRESETS.filter(function(p){
      return p && typeof p === "object" && typeof p.name === "string" && Array.isArray(p.items);
    }).map(function(p){
      var id = String(p.id || ("m_" + Date.now() + "_" + Math.random().toString(16).slice(2)));
      var name = String(p.name || "Custom meal").trim() || "Custom meal";
      var items = p.items.filter(function(it){
        return it && NFOODS[it.key] && (+it.grams > 0 || +it.servings > 0);
      }).map(function(it){
        return { key: it.key, grams: Math.max(0, Math.round(+it.grams || 0)), servings: Math.max(0, round1(+it.servings || 0)) };
      });
      return { id:id, name:name, items:items };
    });
  }

   function sanitizeWorkoutState() {
    if (!W || typeof W !== "object" || Array.isArray(W)) W = {};
    Object.keys(W).forEach(function(ds){
      if (!Array.isArray(W[ds])) {
        W[ds] = [];
        return;
      }
      W[ds] = W[ds].filter(function(ex){
        return ex && typeof ex === "object";
      }).map(function(ex){
        var sets = Array.isArray(ex.sets) ? ex.sets.filter(function(st){ return st && typeof st === "object"; }) : [];
        return {
          group: String(ex.group || "Chest"),
          exercise: String(ex.exercise || "Exercise"),
          equipment: ex.equipment ? String(ex.equipment) : "",
          note: ex.note ? String(ex.note) : "",
          setStyle: ex.setStyle === "drop" || ex.setStyle === "super" ? ex.setStyle : "standard",
          sets: sets.map(function(st){
            return {
              r: Math.max(0, parseInt(st.r, 10) || 0),
              w: Math.max(0, +st.w || 0),
              t: Math.max(0, +st.t || 0),
              d: Math.max(0, +st.d || 0)
            };
          })
        };
      });
    });

    if (!NLOG || typeof NLOG !== "object" || Array.isArray(NLOG)) NLOG = {};
    Object.keys(NLOG).forEach(function(ds){
      if (!Array.isArray(NLOG[ds])) NLOG[ds] = [];
    });
  }

function findFoodKeyByName(name){
  var q = foodKey(name || "");
  if (!q) return "";
  if (NFOODS[q]) return q;
  var keys = Object.keys(NFOODS);
  for (var i=0;i<keys.length;i++) {
    if (foodKey(NFOODS[keys[i]].name) === q) return keys[i];
  }
  for (var j=0;j<keys.length;j++) {
    var nm = String((NFOODS[keys[j]]||{}).name || "").toLowerCase();
    if (nm.indexOf(String(name||"").toLowerCase()) >= 0) return keys[j];
  }
  return "";
}

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

function getLastExerciseSession(exerciseName, beforeDate){
  var dates = Object.keys(W).sort().reverse();
  for (var i=0;i<dates.length;i++) {
    var d = dates[i];
    if (beforeDate && d >= beforeDate) continue;
    var day = W[d] || [];
    for (var j=0;j<day.length;j++) {
      if (day[j] && day[j].exercise === exerciseName) return { date: d, entry: day[j] };
    }
  }
  return null;
}
function entryStrengthScore(entry){
  var score = 0;
  (entry && entry.sets || []).forEach(function(st){ score += (+st.r||0) * (+st.w||0); });
  return score;
}
function progressToneForEntry(entry){
  var last = getLastExerciseSession(entry.exercise, selDate);
  if (!last || !last.entry) return 'yellow';
  var cur = entryStrengthScore(entry);
  var prev = entryStrengthScore(last.entry);
  if (cur > prev * 1.02) return 'green';
  if (cur < prev * 0.98) return 'red';
  return 'yellow';
}
function buildDashboardAnalytics(){
  var muscleMap = {Chest:'Chest',Back:'Back',Legs:'Legs',Shoulders:'Shoulders',Arms:'Arms',Core:'Core'};
  var targets = { Chest: 16, Back: 16, Legs: 18, Shoulders: 12, Arms: 16, Core: 8 };
  var muscleVolumes = { Chest:0, Back:0, Legs:0, Shoulders:0, Arms:0, Core:0 };
  var exerciseProgress = [];
  var prsThisWeek = 0;
  var dates = lastNDates(7);
  dates.forEach(function(d){
    (W[d] || []).forEach(function(ex){
      var m = muscleMap[ex.group];
      if (m) muscleVolumes[m] += (ex.sets || []).length;
      var last = getLastExerciseSession(ex.exercise, d);
      var cur = entryStrengthScore(ex);
      var prev = last ? entryStrengthScore(last.entry) : 0;
      if (cur > prev && prev > 0) prsThisWeek += 1;
      exerciseProgress.push({ exercise: ex.exercise, prReady: prev > 0 && cur >= prev * 0.97 });
    });
  });
  var cals = 0;
  dates.forEach(function(d){ (NLOG[d]||[]).forEach(function(it){ cals += (+it.cal||0); }); });
  var workoutDates = Object.keys(W).filter(function(d){ return (W[d]||[]).length; });
  var bodyweightLogs = Object.keys(BW).sort().map(function(d){ return { date:d, weight:+BW[d]||0 }; });
  var adh = weeklyAdherence();
  return {
    muscleVolumes: muscleVolumes,
    targets: targets,
    exerciseProgress: exerciseProgress,
    bodyweightLogs: bodyweightLogs,
    goalWeight: USER.bodyweightGoal || 170,
    workoutDates: workoutDates,
    prsThisWeek: prsThisWeek,
    adherencePct: adh.score * 100,
    weekly: {
      workoutsDone: adh.workouts,
      workoutsPlanned: adh.plan,
      setsDone: adh.sets,
      setsTarget: 90,
      calories: Math.round(cals / 7),
      calTarget: +(USER.targetCalories || 2400)
    },
    needsProfile: !USER.trainingGoal
  };
}
   
   function getRecentWeightTrendInfo() {
  var dates = Object.keys(BW).sort();
  if (!dates.length) return { today: null, avg7: null, deltaWeek: null };
  var todayWeight = +BW[dates[dates.length - 1]] || null;
  var recent = dates.slice(-7).map(function(d){ return +BW[d] || 0; }).filter(function(v){ return v > 0; });
  var avg7 = recent.length ? Math.round((recent.reduce(function(sum, v){ return sum + v; }, 0) / recent.length) * 10) / 10 : null;
  var latestDate = dates[dates.length - 1];
  var weekAgo = addDays(latestDate, -7);
  var weekAgoWeight = BW[weekAgo] ? (+BW[weekAgo] || 0) : null;
  var deltaWeek = (todayWeight && weekAgoWeight) ? Math.round((todayWeight - weekAgoWeight) * 10) / 10 : null;
  return { today: todayWeight, avg7: avg7, deltaWeek: deltaWeek };
}


function getWeekWindowStart() {
  var base = new Date(selDate + "T00:00:00");
  var day = base.getDay();
  var mondayDelta = day === 0 ? -6 : (1 - day);
  base.setDate(base.getDate() + mondayDelta);
  return base.toISOString().slice(0, 10);
}

function getPlannedCompletedForWeek() {
  var start = getWeekWindowStart();
  var planned = 0;
  var completed = 0;
  for (var i = 0; i < 7; i++) {
    var curDate = addDays(start, i);
    var curDow = new Date(curDate + "T00:00:00").getDay();
    var dayPlan = RSCHED[String(curDow)];
    if (dayPlan && dayPlan !== "__REST__") planned += 1;
    if ((W[curDate] || []).length) completed += 1;
  }
  return { planned: planned, completed: completed, weekStart: start };
}

function isRestScheduleValue(v) {
  return v === "__REST__";
}

function buildWorkoutCalendar(daysBack) {
  var days = Math.max(7, parseInt(daysBack, 10) || 30);
  var end = selDate;
  var start = addDays(end, -(days - 1));
  var startDate = new Date(start + "T00:00:00");
  var offset = startDate.getDay();
  var cells = [];

  for (var pre = 0; pre < offset; pre++) cells.push({ blank: true });

  for (var i = 0; i < days; i++) {
    var ds = addDays(start, i);
    var entries = W[ds] || [];
    var hasWorkout = entries.length > 0;
    var volume = 0;
    entries.forEach(function(ex) {
      (ex.sets || []).forEach(function(st) {
        volume += (+st.r || 0) * (+st.w || 0);
      });
    });
    cells.push({
      blank: false,
      date: ds,
      day: new Date(ds + "T00:00:00").getDate(),
      hasWorkout: hasWorkout,
      volume: Math.round(toDisplayWeight(volume))
    });
  }

  return { start: start, end: end, cells: cells };
}

function getRoutineById(rid) {
  for (var i = 0; i < (RLIB || []).length; i++) {
    if (RLIB[i].id === rid) return RLIB[i];
  }
  return null;
}

function getAssignedRoutineForDate(ds) {
  var dow = new Date(ds + "T00:00:00").getDay();
  var rid = RSCHED[String(dow)] || "";
  if (isRestScheduleValue(rid)) return { id: "__REST__", name: "Rest Day", isRestDay: true };
  return rid ? getRoutineById(rid) : null;
}

function getLastWorkoutSummary() {
  var dates = Object.keys(W).filter(function(d){ return (W[d] || []).length; }).sort().reverse();
  if (!dates.length) return null;
  var d = dates[0];
  var entries = W[d] || [];
  var routine = getAssignedRoutineForDate(d);
  var name = routine ? routine.name : ((entries[0] && entries[0].group) ? (entries[0].group + " day") : "Workout");
  return { date: d, name: name, sets: entries.reduce(function(sum, ex){ return sum + ((ex.sets || []).length || 0); }, 0) };
}

function getRecentGroupTrainingHours(refDate) {
  var out = {};
  var ref = new Date(refDate + "T00:00:00").getTime();
  var dates = Object.keys(W).filter(function(d){ return (W[d] || []).length; }).sort().reverse();
  for (var i = 0; i < dates.length; i++) {
    var d = dates[i];
    var ts = new Date(d + "T00:00:00").getTime();
    if (ts > ref) continue;
    var hours = Math.max(0, (ref - ts) / 36e5);
    (W[d] || []).forEach(function(ex){
      var g = ex && ex.group ? ex.group : "";
      if (!g || g === "Cardio") return;
      if (out[g] === undefined || hours < out[g]) out[g] = hours;
    });
  }
  return out;
}

function plannedRoutineGroups(routine) {
  var map = {};
  if (!routine) return map;
  (routine.focus || []).forEach(function(g){ if (g) map[g] = 1; });
  (routine.items || []).forEach(function(it){ if (it && it.group && it.group !== "Cardio") map[it.group] = 1; });
  return map;
}

function buildTodayFocusData() {
  var analytics = buildDashboardAnalytics();
  var targets = analytics.targets || {};
  var volumes = analytics.muscleVolumes || {};
  var routine = getAssignedRoutineForDate(selDate);
  var planned = plannedRoutineGroups(routine);
  var recentHours = getRecentGroupTrainingHours(selDate);
  var items = [];

  Object.keys(targets).forEach(function(group){
    var target = +targets[group] || 0;
    var current = +volumes[group] || 0;
    var deficit = Math.max(0, target - current);
    var score = 0;
    if (planned[group]) score += 100;
    if (deficit > 0) score += 50;
    score += Math.min(40, deficit * 2);
    var hrs = recentHours[group];
    if (!planned[group] && hrs !== undefined) {
      if (hrs <= 24) score -= 30;
      else if (hrs <= 48) score -= 15;
    }
    items.push({
      group: group,
      target: target,
      current: current,
      deficit: deficit,
      sets: deficit,
      score: score,
      planned: !!planned[group],
      recentHours: hrs
    });
  });

  items.sort(function(a, b){
    if (b.score !== a.score) return b.score - a.score;
    return b.deficit - a.deficit;
  });

  return { routine: routine, items: items };
}

function getVolumeSnapshot(limit) {
  var analytics = buildDashboardAnalytics();
  var targets = analytics.targets || {};
  var volumes = analytics.muscleVolumes || {};
  var rows = [];
  Object.keys(targets).forEach(function(group){
    var target = +targets[group] || 0;
    var current = +volumes[group] || 0;
    var deficit = Math.max(0, target - current);
    rows.push({ group: group, target: target, current: current, deficit: deficit });
  });
  rows.sort(function(a, b){ return b.deficit - a.deficit; });
  return rows.slice(0, limit || 3);
}

function getNextPlannedWorkoutSummary(fromDate) {
  var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  for (var i = 0; i < 14; i++) {
    var d = addDays(fromDate, i);
    var dow = new Date(d + "T00:00:00").getDay();
    var rid = RSCHED[String(dow)] || "";
    if (!rid || isRestScheduleValue(rid)) continue;
    var r = getRoutineById(rid);
    return { day: dayNames[dow], routine: r ? r.name : "Routine" };
  }
  return null;
}

function queueRender(delayMs) {
  clearTimeout(renderDebounceTimer);
  renderDebounceTimer = setTimeout(render, delayMs || 70);
}

function showToast(msg) {
  var wrap = document.getElementById("il-toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "il-toast-wrap";
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  var t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add("show"); });
  setTimeout(function(){
    t.classList.remove("show");
    setTimeout(function(){ if (t && t.parentNode) t.parentNode.removeChild(t); }, 220);
  }, 2200);
}
   
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
  // Supabase Auth
  // -----------------------------
  var SUPABASE_URL = window.IRONLOG_SUPABASE_URL || "";
  var SUPABASE_ANON_KEY = window.IRONLOG_SUPABASE_ANON_KEY || "";
  var sb = null;
  var authSession = null;
  var authReady = false;
  var authBusy = false;
  var authMsg = "";
   var rememberedDevice = ld("il_remember_device", true);
var cloudSyncEnabled = true;
  var cloudSaveTimer = null;
     var socialProfileSaveTimer = null;
  var cloudHydrating = false;
   
  function initAuth() {
    if (!window.supabase) {
      authMsg = "Supabase SDK not loaded.";
      authReady = true;
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      authMsg = "Set window.IRONLOG_SUPABASE_URL and window.IRONLOG_SUPABASE_ANON_KEY to enable auth.";
      authReady = true;
      return;
    }

    try {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      sb.auth.getSession().then(function(res) {
        authSession = (res && res.data && res.data.session) ? res.data.session : null;
        authReady = true;
if (authSession && authSession.user) {
cloudLoad().then(function(){ return loadSocialGraph(); }).finally(function(){ render(); });
} else {
          render();
        }
      }).catch(function(err) {
        authMsg = "Session check failed: " + (err && err.message ? err.message : "Unknown error");
        authReady = true;
        render();
      });

      sb.auth.onAuthStateChange(function(_event, session) {
        authSession = session || null;
        if (authSession) authMsg = "";
if (authSession && authSession.user) {
cloudLoad().then(function(){ return loadSocialGraph(); }).finally(function(){ render(); });
} else {
          render();
        }
      });
    } catch (e) {
      authMsg = "Auth initialization failed.";
      authReady = true;
    }
  }

  function authCredsFromUI() {
    var email = ((document.getElementById("auth-email") || {}).value || "").trim();
    var password = ((document.getElementById("auth-password") || {}).value || "").trim();
    return { email: email, password: password };
  }

   function isSignedIn() {
    return !!(authSession && authSession.user);
  }
   
  function runAuthAction(kind) {
    if (!sb || authBusy) return;
  var rememberEl = document.getElementById("auth-remember");
    if (rememberEl) {
      rememberedDevice = !!rememberEl.checked;
      sv("il_remember_device", rememberedDevice);
    }
     var creds = authCredsFromUI();
    if (!creds.email || !creds.password) {
      authMsg = "Enter email and password.";
      render();
      return;
    }
    authBusy = true;
    authMsg = "";
    render();

    var op = kind === "signup"
      ? sb.auth.signUp({ email: creds.email, password: creds.password })
      : sb.auth.signInWithPassword({ email: creds.email, password: creds.password });

    op.then(function(res) {
      var err = res && res.error;
      if (err) {
        authMsg = err.message || "Auth failed.";
      } else if (kind === "signup") {
        authMsg = "Sign-up successful. Check your email for confirmation if required.";
      } else {
        authMsg = "Signed in.";
      }
    }).catch(function(err) {
      authMsg = (err && err.message) ? err.message : "Auth request failed.";
    }).finally(function() {
      authBusy = false;
      render();
    });
  }

  function runSignOut() {
    if (!sb || authBusy) return;
    authBusy = true;
    authMsg = "";
    render();
    sb.auth.signOut().then(function(res) {
      if (res && res.error) authMsg = res.error.message || "Sign out failed.";
      else authMsg = "Signed out.";
    }).catch(function(err) {
      authMsg = (err && err.message) ? err.message : "Sign out failed.";
    }).finally(function() {
      authBusy = false;
      render();
    });
  }
   
   // -----------------------------
  // App state
  // -----------------------------
  var TH = ld("il_th", "dark"); // "dark" or "light"
var view = ld("il_view", "home");
  var trackMode = ld("il_track_mode", "workout");
  var legacyViewMap = {
    log: "track",
    nutrition: "track",
    templates: "plan",
    more: "social",
    history: "progress"
  };
  if (legacyViewMap[view]) view = legacyViewMap[view];
  if (["home", "plan", "track", "progress", "social", "profile"].indexOf(view) < 0) view = "home";
  if (trackMode !== "workout" && trackMode !== "nutrition") trackMode = "workout";
   var selDate = ld("il_selDate", tod());
   var homeWeightEntryOpen = false;
  var lastHomeSuggestion = null;
  var planAccordionOpen = {};
  var planSelectedDow = new Date(selDate + "T00:00:00").getDay();
  var renderDebounceTimer = null;

  var W = ld("il_w", {});         // workouts by date
  var CEX = ld("il_custom_ex", {}); // custom exercises by group
  var BW = ld("il_bw", {});       // bodyweight by date: number
   var PR = ld("il_pr", {});       // pr by exercise: {e1rm, w, r, date}
     var PROG_PR_FILTER = ld("il_progress_pr_filter", null); // selected exercises shown in progress PR list
  var NLOG = ld("il_nlog", {});   // nutrition log by date
   var DN_CACHE = ld("il_daily_nutrition_cache", {}); // cached nutrition totals by date
   var RLIB = ld("il_routines", []); // saved workout routines
  var RSCHED = ld("il_routine_sched", {}); // weekday -> routine id
  var NUPC = ld("il_nupc", {});   // barcode -> foodKey mapping
  // activity assumptions (used for calorie targets)
   
  var USER = ld("il_user", {
    sessionsPerWeek: 5,
    stepsPerDay: 10000,
     goalMode: "cut", // "cut" | "maintain" | "bulk"
    goalPace: "moderate", // "performance" | "moderate" | "aggressive"
    cutAggressiveness: "performance", // legacy support
     weightUnit: "lbs", // "lbs" | "kg"
    nutritionUnit: "grams", // "grams" | "ounces" | "bottles"
autoGoals: true,
    goal_type: "cut",
    weekly_rate_target: -0.5,
    protein_target_per_lb: 0.9,
    auto_calorie_adjustments: false
  });
function normalizeUSER(u) {
    var src = (u && typeof u === "object" && !Array.isArray(u)) ? u : {};
    return {
      sessionsPerWeek: Math.max(0, Math.min(14, parseInt(src.sessionsPerWeek, 10) || 5)),
      stepsPerDay: Math.max(0, Math.min(30000, parseInt(src.stepsPerDay, 10) || 10000)),
      goalMode: (src.goalMode === "maintain" || src.goalMode === "bulk") ? src.goalMode : "cut",
      goalPace: (src.goalPace === "performance" || src.goalPace === "aggressive") ? src.goalPace : "moderate",
      cutAggressiveness: (src.cutAggressiveness === "performance" || src.cutAggressiveness === "aggressive") ? src.cutAggressiveness : (src.goalPace || "moderate"),
      weightUnit: src.weightUnit === "kg" ? "kg" : "lbs",
      nutritionUnit: (src.nutritionUnit === "ounces" || src.nutritionUnit === "bottles") ? src.nutritionUnit : "grams",
autoGoals: src.autoGoals !== false,
      goal_type: (src.goal_type === "maintain" || src.goal_type === "bulk") ? src.goal_type : (src.goalMode || "cut"),
      weekly_rate_target: isFinite(+src.weekly_rate_target) ? +src.weekly_rate_target : -0.5,
      protein_target_per_lb: isFinite(+src.protein_target_per_lb) ? +src.protein_target_per_lb : 0.9,
      auto_calorie_adjustments: !!src.auto_calorie_adjustments
    };
  }
var SOC = ld("il_social", {
   profileName: "You",
     handle: "",
    bio: "",
    friends: [],
     requests: [],
    sentRequests: [],
    messages: {},
    feed: [],
    leaderboardLift: "Bench Press"
  });
  function normalizeSOC(s) {
    s = s || {};
 var friends = Array.isArray(s.friends) ? s.friends : [];
    var requests = Array.isArray(s.requests) ? s.requests : [];
var sentRequests = Array.isArray(s.sentRequests) ? s.sentRequests : [];
var messages = (s.messages && typeof s.messages === "object") ? s.messages : {};     
     return {
      profileName: String(s.profileName || "You"),
  handle: String(s.handle || ""),
      bio: String(s.bio || ""),
      friends: friends.map(function(fr){
        return {
          id: fr && fr.id ? String(fr.id) : socialId(),
          name: String((fr && fr.name) || "Friend"),
          handle: String((fr && fr.handle) || ""),
          workouts: +(fr && fr.workouts || 0),
          lifts: (fr && fr.lifts && typeof fr.lifts === "object") ? fr.lifts : {}
        };
      }),
      requests: requests.map(function(rq){
        return {
          id: rq && rq.id ? String(rq.id) : socialId(),
          user_id: rq && rq.user_id ? String(rq.user_id) : "",
           name: String((rq && rq.name) || "Athlete"),
          handle: String((rq && rq.handle) || "")
        };
      }),
      sentRequests: sentRequests.map(function(rq){
        return {
          id: rq && rq.id ? String(rq.id) : socialId(),
          user_id: rq && rq.user_id ? String(rq.user_id) : "",
          name: String((rq && rq.name) || "Athlete"),
          handle: String((rq && rq.handle) || "")
        };
      }),
      messages: messages,
        feed: Array.isArray(s.feed) ? s.feed : [],
      leaderboardLift: String(s.leaderboardLift || "Bench Press")
    };
  }
  SOC = normalizeSOC(SOC);
    USER = normalizeUSER(USER);
     syncProgressPRFilter();
   if (!USER.goalMode) USER.goalMode = "cut";
  if (!USER.goalPace) USER.goalPace = USER.cutAggressiveness || "moderate";
   USER.weightUnit = normalizeWeightUnit(USER.weightUnit);
  USER.nutritionUnit = normalizeNutritionUnit(USER.nutritionUnit);

function normalizeWeightUnit(unit) {
    return unit === "kg" ? "kg" : "lbs";
  }
  function normalizeNutritionUnit(unit) {
    return (unit === "ounces" || unit === "bottles") ? unit : "grams";
  }
  function weightUnitLabel(unit) {
    return normalizeWeightUnit(unit || USER.weightUnit) === "kg" ? "kg" : "lb";
  }
  function toDisplayWeight(lbVal) {
    var lbs = +lbVal || 0;
    if (USER.weightUnit === "kg") return Math.round((lbs * 0.45359237) * 10) / 10;
    return Math.round(lbs * 10) / 10;
  }
  function toStoredWeight(displayVal) {
    var v = +displayVal || 0;
    if (USER.weightUnit === "kg") return Math.round((v / 0.45359237) * 10) / 10;
    return Math.round(v * 10) / 10;
  }
  function nutritionUnitLabel(unit) {
    var u = normalizeNutritionUnit(unit || USER.nutritionUnit);
    return u === "ounces" ? "oz" : (u === "bottles" ? "bottle(s)" : "g");
  }
  function saveAll() {
         refreshDailyNutritionCache(selDate);
    sv("il_th", TH);
    sv("il_view", view);
         sv("il_track_mode", trackMode);
    sv("il_selDate", selDate);
    sv("il_custom_ex", CEX);
     sv("il_w", W);
    sv("il_bw", BW);
    sv("il_pr", PR);
         sv("il_progress_pr_filter", PROG_PR_FILTER);
    sv("il_nlog", NLOG);
         sv("il_daily_nutrition_cache", DN_CACHE);
     sv("il_routines", RLIB);
    sv("il_routine_sched", RSCHED);
    sv("il_nfoods", NFOODS);
    sv("il_nupc", NUPC);
    sv("il_user", USER);
     sv("il_social", SOC);
     if (authSession && authSession.user) {
      scheduleCloudUpsert();
              scheduleSocialProfileUpsert();
    }
  }

  function buildCloudPayload() {
    return {
      user_id: authSession && authSession.user ? authSession.user.id : null,
      w: W || {},
      bw: BW || {},
      pr: PR || {},
      nlog: NLOG || {},
             ncache: DN_CACHE || {},
      nfoods: NFOODS || {},
      user_settings: USER || {},
      th: TH || "dark",
      soc: SOC || {},
      rlib: RLIB || [],
      rsched: RSCHED || {},
      updated_at: new Date().toISOString()
    };
  }

  function applyCloudState(row) {
    if (!row || typeof row !== "object") return;
    cloudHydrating = true;
    try {
      W = row.w || {};
      BW = row.bw || {};
      PR = row.pr || {};
      NLOG = row.nlog || {};
             DN_CACHE = row.ncache || {};
      NFOODS = row.nfoods || {};
      USER = normalizeUSER(row.user_settings || {});
      TH = row.th || "dark";
      SOC = normalizeSOC(row.soc || {});
      RLIB = Array.isArray(row.rlib) ? row.rlib : [];
      RSCHED = row.rsched || {};
           sanitizeWorkoutState();
       sanitizeNutritionState();
      normalizeRoutines();
      syncProgressPRFilter();
      saveAll();
    } finally {
      cloudHydrating = false;
    }
  }

  function cloudUpsertNow() {
    if (!cloudSyncEnabled || cloudHydrating) return Promise.resolve();
    if (!sb || !authSession || !authSession.user) return Promise.resolve();
    var payload = buildCloudPayload();
    if (!payload.user_id) return Promise.resolve();

    return sb.from("app_state")
      .upsert(payload, { onConflict: "user_id" })
      .then(function(res) {
        if (res && res.error) throw res.error;
      })
      .catch(function(err) {
        authMsg = "Cloud save failed: " + ((err && err.message) ? err.message : "Unknown error");
        render();
      });
  }

  function scheduleCloudUpsert() {
    if (!cloudSyncEnabled || cloudHydrating) return;
    if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(function() {
      cloudUpsertNow();
    }, 500);
  }

   
    function scheduleSocialProfileUpsert() {
    if (!socialReady()) return;
    if (socialProfileSaveTimer) clearTimeout(socialProfileSaveTimer);
    socialProfileSaveTimer = setTimeout(function() {
      ensureSocialProfile().catch(function(err) {
        authMsg = "Profile sync failed: " + ((err && err.message) ? err.message : "Unknown error");
        render();
      });
    }, 500);
  }
   
  function cloudLoad() {
    if (!cloudSyncEnabled) return Promise.resolve();
    if (!sb || !authSession || !authSession.user) return Promise.resolve();
    return sb.from("app_state")
      .select("*")
      .eq("user_id", authSession.user.id)
      .maybeSingle()
      .then(function(res) {
        if (res && res.error) throw res.error;
        if (res && res.data) {
          applyCloudState(res.data);
          return;
        }
        return cloudUpsertNow();
      })
      .catch(function(err) {
        authMsg = "Cloud load failed: " + ((err && err.message) ? err.message : "Unknown error");
        render();
      });
  }


   function myUserId() {
    return (authSession && authSession.user && authSession.user.id) ? authSession.user.id : null;
  }

  function normalizeHandle(v) {
    var h = String(v || "").trim().toLowerCase();
    if (!h) return "";
    if (h.charAt(0) === "@") h = h.slice(1);
    h = h.replace(/[^a-z0-9_.]/g, "");
    return h;
  }

  function socialReady() {
    return !!(sb && myUserId());
  }

   var socialSupportsHandle = true;
      var socialSupportsBio = true;
  function isMissingHandleColumnError(err) {
    var msg = String((err && err.message) || "").toLowerCase();
    var details = String((err && err.details) || "").toLowerCase();
    var code = String((err && err.code) || "").toLowerCase();
    return msg.indexOf("profiles.handle") >= 0 || details.indexOf("profiles.handle") >= 0 || code === "42703" || code === "pgrst204";
  }

   function isMissingBioColumnError(err) {
    var msg = String((err && err.message) || "").toLowerCase();
    var details = String((err && err.details) || "").toLowerCase();
    var code = String((err && err.code) || "").toLowerCase();
    return msg.indexOf("profiles.bio") >= 0 || details.indexOf("profiles.bio") >= 0 || code === "42703" || code === "pgrst204";
  }
   
   function profileSelectColumns() {
var cols = ["id", "display_name"];
    if (socialSupportsHandle) cols.push("handle");
    if (socialSupportsBio) cols.push("bio");
    return cols.join(",");
   }

  function safeProfileHandle(p) {
    return (p && p.handle) ? ("@" + String(p.handle).replace(/^@/, "")) : "";
  }

  function isLikelyUuid(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || ""));
  }
   
  function ensureSocialProfile() {
    if (!socialReady()) return Promise.resolve();
    var uid = myUserId();
    var display = (SOC.profileName || (authSession.user.email || "Athlete")).trim();
    var handle = normalizeHandle(SOC.handle || (authSession.user.email || "").split("@")[0]);
    var bio = String(SOC.bio || "").trim();
    var payload = {
     id: uid,
      display_name: display,
      updated_at: new Date().toISOString()
};
    if (socialSupportsHandle) payload.handle = handle || null;
    if (socialSupportsBio) payload.bio = bio || null;
     
    return sb.from("profiles").upsert(payload, { onConflict: "id" }).then(function(res){ if (res && res.error) throw res.error; })
      .catch(function(err){
        if (socialSupportsHandle && isMissingHandleColumnError(err)) {
          socialSupportsHandle = false;
          delete payload.handle;
          return sb.from("profiles").upsert(payload, { onConflict: "id" }).then(function(retry){ if (retry && retry.error) throw retry.error; });
        }
         if (socialSupportsBio && isMissingBioColumnError(err)) {
          socialSupportsBio = false;
          delete payload.bio;
          return sb.from("profiles").upsert(payload, { onConflict: "id" }).then(function(retryBio){ if (retryBio && retryBio.error) throw retryBio.error; });
        }
        throw err;
      })
         .catch(function(err){
        authMsg = "Social profile sync failed: " + ((err && err.message) ? err.message : "Unknown error");
      });
  }

  function fetchProfilesByIds(ids) {
    ids = (ids || []).filter(Boolean);
    if (!ids.length || !sb) return Promise.resolve({});
    return sb.from("profiles").select(profileSelectColumns()).in("id", ids).then(function(res){
     if (res && res.error) throw res.error;
      var map = {};
      (res.data || []).forEach(function(p){ map[p.id] = p; });
      return map;
   }).catch(function(err){
      if (socialSupportsHandle && isMissingHandleColumnError(err)) {
        socialSupportsHandle = false;
        return fetchProfilesByIds(ids);
      }
      throw err;
    });  
  }

  function loadSocialGraph() {
    if (!socialReady()) return Promise.resolve();
    var uid = myUserId();
    return ensureSocialProfile().then(function(){
      return Promise.all([
        sb.from("profiles").select(profileSelectColumns()).eq("id", uid).maybeSingle(),
        sb.from("friendships").select("user_id,friend_id").or("user_id.eq." + uid + ",friend_id.eq." + uid),
         sb.from("friend_requests").select("id,requester_id,addressee_id,status,created_at").eq("addressee_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
        sb.from("friend_requests").select("id,requester_id,addressee_id,status,created_at").eq("requester_id", uid).eq("status", "pending").order("created_at", { ascending: false }),
        sb.from("messages").select("id,sender_id,recipient_id,body,created_at").or("sender_id.eq." + uid + ",recipient_id.eq." + uid).order("created_at", { ascending: false }).limit(200)
      ]);
    }).then(function(results){
      var meRes = results[0], frRes = results[1], rqRes = results[2], sentRqRes = results[3], msgRes = results[4];
      if (meRes && meRes.error) throw meRes.error;
      if (frRes && frRes.error) throw frRes.error;
      if (rqRes && rqRes.error) throw rqRes.error;
      if (sentRqRes && sentRqRes.error) throw sentRqRes.error;
      if (msgRes && msgRes.error) throw msgRes.error;

      var myProfile = meRes.data || {};
      if (myProfile.display_name) SOC.profileName = myProfile.display_name;
      SOC.handle = safeProfileHandle(myProfile) || (SOC.handle || "");
SOC.bio = socialSupportsBio ? (myProfile.bio || SOC.bio || "") : (SOC.bio || "");
       
var friendIds = [];
      (frRes.data || []).forEach(function(r){
        var fid = (r.user_id === uid) ? r.friend_id : r.user_id;
        if (fid && friendIds.indexOf(fid) === -1) friendIds.push(fid);
      });
       var reqRows = rqRes.data || [];
      var sentReqRows = sentRqRes.data || [];
      var reqUserIds = reqRows.map(function(r){ return r.requester_id; }).filter(Boolean);
      var sentUserIds = sentReqRows.map(function(r){ return r.addressee_id; }).filter(Boolean);
      var allProfileIds = friendIds.concat(reqUserIds).concat(sentUserIds);
      return fetchProfilesByIds(allProfileIds).then(function(pmap){
        SOC.friends = friendIds.map(function(fid){
          var p = pmap[fid] || {};
          return {
            id: fid,
            name: p.display_name || p.handle || "Athlete",
             handle: safeProfileHandle(p),
             workouts: 0,
            lifts: {}
          };
        });
        SOC.requests = reqRows.map(function(r){
          var p = pmap[r.requester_id] || {};
          return {
            id: r.id,
            user_id: r.requester_id,
            name: p.display_name || p.handle || "Athlete",
             handle: safeProfileHandle(p)
          };
        });
        SOC.sentRequests = sentReqRows.map(function(r){
          var p = pmap[r.addressee_id] || {};
          return {
            id: r.id,
            user_id: r.addressee_id,
            name: p.display_name || p.handle || "Athlete",
             handle: safeProfileHandle(p)
          };
        });

        SOC.messages = {};
        var nameById = {};
        SOC.friends.forEach(function(fr){ nameById[fr.id] = fr.name; });
        (msgRes.data || []).slice().reverse().forEach(function(m){
          var fid = m.sender_id === uid ? m.recipient_id : m.sender_id;
          if (!fid) return;
          SOC.messages[fid] = SOC.messages[fid] || [];
          SOC.messages[fid].push({
            from: m.sender_id === uid ? (SOC.profileName || "You") : (nameById[fid] || "Athlete"),
            text: m.body || "",
            at: new Date(m.created_at || Date.now()).getTime()
          });
        });

        var feedIds = [uid].concat(friendIds);
        if (!feedIds.length) { SOC.feed = []; return; }
        return sb.from("social_posts").select("id,user_id,type,body,post_date,created_at").in("user_id", feedIds).order("created_at", { ascending: false }).limit(80).then(function(feedRes){
          if (feedRes && feedRes.error) throw feedRes.error;
          return fetchProfilesByIds(feedIds).then(function(feedProfiles){
            SOC.feed = (feedRes.data || []).map(function(it){
              var p = feedProfiles[it.user_id] || {};
              return {
                id: "p_" + it.id,
                from: p.display_name || p.handle || "Athlete",
                 type: it.type || "update",
                date: it.post_date || String(it.created_at || "").slice(0, 10),
                text: it.body || "",
                at: new Date(it.created_at || Date.now()).getTime()
              };
            });
          });
        });
      });
    }).then(function(){
      sv("il_social", SOC);
    }).catch(function(err){
      if (socialSupportsHandle && isMissingHandleColumnError(err)) {
         socialSupportsHandle = false;
        return loadSocialGraph();
      }
        if (socialSupportsBio && isMissingBioColumnError(err)) {
        socialSupportsBio = false;
        return loadSocialGraph();
      }
      authMsg = "Social load failed: " + ((err && err.message) ? err.message : "Set up social tables in Supabase.");
    });
  }
   
   function syncProgressPRFilter() {
    var prNames = Object.keys(PR || {}).sort(function(a,b){ return (PR[b].e1rm||0)-(PR[a].e1rm||0); });
    if (!Array.isArray(PROG_PR_FILTER)) {
      PROG_PR_FILTER = prNames.slice(0, 5);
      return;
    }
    var allowed = {};
    prNames.forEach(function(n){ allowed[n] = true; });
    PROG_PR_FILTER = PROG_PR_FILTER.filter(function(n){ return !!allowed[n]; });
  }

  // -----------------------------
  // Theme
  // -----------------------------
  function applyTheme() {
    document.body.setAttribute("data-theme", TH === "light" ? "light" : "");
    var b = document.getElementById("thm-btn");
    if (b) b.textContent = TH === "dark" ? "🌙" : "☀️";
  }

 function renderAuthStatusCard() {
    var h = "";
    h += "<div class=\"card\" style=\"margin-bottom:8px\">";
    h += "<div class=\"row\" style=\"justify-content:space-between;align-items:center;gap:8px\">";
    h += "<div style=\"min-width:0\">";
    if (!authReady) {
      h += "<div style=\"font-size:11px;color:var(--mt)\">🔐 Checking session…</div>";
    } else if (authSession && authSession.user) {
      h += "<div style=\"font-size:11px;font-weight:700;color:var(--gn);white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">✅ Signed in as " + esc(authSession.user.email || "user") + "</div>";
    } else if (sb) {
      h += "<div style=\"font-size:11px;color:var(--yl);font-weight:700\">🔓 Not signed in</div>";
    } else {
      h += "<div style=\"font-size:11px;color:var(--mt)\">⚙️ Auth unavailable</div>";
    }
    if (authBusy) h += "<div style=\"font-size:10px;color:var(--mt);margin-top:3px\">Working…</div>";
    if (authMsg) h += "<div style=\"font-size:10px;color:var(--mt);margin-top:3px\">" + esc(authMsg) + "</div>";
    h += "</div>";
    if (authSession && authSession.user) h += "<button class=\"btn bs\" id=\"auth-signout-top\" style=\"padding:6px 10px;font-size:11px\">Sign out</button>";
    h += "</div></div>";
    return h;
  }

   function renderLoginScreen() {
    var q = todayQuote();
    var h = "";
    h += '<div class="login-wrap">';
    h += '<div class="card login-card">';
    h += '<div style="text-align:center;margin-bottom:10px">';
    h += '<div style="font-size:24px">🔐</div>';
    h += '<div style="font-size:20px;font-weight:900">Welcome to Iron Log</div>';
    h += '<div style="font-size:12px;color:var(--mt);margin-top:4px">Sign in to access your workouts on this device.</div>';
    h += '</div>';
    h += '<div class="quote-box" style="margin-bottom:10px"><div class="quote-text">"'+esc(q.t)+'"</div><div class="quote-author">— '+esc(q.a)+'</div></div>';

    if (!authReady) {
      h += '<div style="font-size:12px;color:var(--mt);text-align:center">Checking saved login…</div>';
    } else if (!sb) {
      h += '<div style="font-size:12px;color:var(--rd);text-align:center">'+esc(authMsg || 'Authentication is unavailable right now.')+'</div>';
    } else {
      h += '<input class="inp" id="auth-email" type="email" placeholder="you@example.com" style="margin-bottom:8px">';
      h += '<input class="inp" id="auth-password" type="password" placeholder="Password" style="margin-bottom:8px">';
      h += '<label style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--mt);margin-bottom:10px">';
      h += '<input id="auth-remember" type="checkbox" '+(rememberedDevice ? 'checked' : '')+'> Remember this device';
      h += '</label>';
      h += '<div class="row" style="gap:8px">';
      h += '<button class="btn bp" id="auth-signin" style="flex:1">Sign in</button>';
      h += '<button class="btn bs" id="auth-signup" style="flex:1">Create account</button>';
      h += '</div>';
      if (authBusy) h += '<div style="font-size:10px;color:var(--mt);margin-top:8px">Working…</div>';
      if (authMsg) h += '<div style="font-size:10px;color:var(--mt);margin-top:6px">'+esc(authMsg)+'</div>';
    }

    h += '</div>';
    h += '</div>';
    return h;
  }
   
   // -----------------------------
  // Workout helpers
  // -----------------------------
  function e1rm(w, r) {
    w = +w || 0; r = +r || 0;
    if (w <= 0 || r <= 0) return 0;
    return Math.round(w * (1 + r / 30));
  }

function buildPRTrendData(exerciseNames) {
    var selected = (exerciseNames || []).filter(function(n){ return !!n; });
    var dates = Object.keys(W || {}).sort();
    if (!selected.length || !dates.length) return { labels: [], series: [] };

    var selectedSet = {};
    selected.forEach(function(n){ selectedSet[n] = true; });

    var labels = [];
    var rollingBest = {};
    var seriesMap = {};
    selected.forEach(function(n){ seriesMap[n] = []; rollingBest[n] = 0; });

    dates.forEach(function(d){
      labels.push(fmtS(d));
      var day = W[d] || [];
      var dailyBest = {};

      day.forEach(function(entry){
        if (!entry || !selectedSet[entry.exercise]) return;
        (entry.sets || []).forEach(function(st){
          var est = e1rm(st && st.w, st && st.r);
          if (!est) return;
          if (!dailyBest[entry.exercise] || est > dailyBest[entry.exercise]) dailyBest[entry.exercise] = est;
        });
      });

      selected.forEach(function(name){
        if (dailyBest[name] && dailyBest[name] > (rollingBest[name] || 0)) rollingBest[name] = dailyBest[name];
        seriesMap[name].push(rollingBest[name] > 0 ? toDisplayWeight(rollingBest[name]) : null);
      });
    });

    var series = selected.map(function(name){
      var vals = seriesMap[name];
      var hasValue = vals.some(function(v){ return v !== null; });
      return hasValue ? { name: name, values: vals } : null;
    }).filter(Boolean);

    return { labels: labels, series: series };
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

   function lastExerciseSession(exName) {
    var dates = Object.keys(W).sort().reverse();
    for (var di = 0; di < dates.length; di++) {
      var d = dates[di], day = W[d] || [];
      for (var ei = day.length - 1; ei >= 0; ei--) {
        var e = day[ei];
        if (e && e.exercise === exName && e.sets && e.sets.length) return { date: d, entry: e };
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

   var DEFAULT_ROUTINES = [
    { id:"r_push", name:"Push Day", focus:["Chest","Shoulders","Arms"], items:[
      { group:"Chest", exercise:"Bench Press", sets:4, reps:6, weight:0 },
      { group:"Chest", exercise:"Incline Dumbbell Press", sets:3, reps:10, weight:0 },
      { group:"Shoulders", exercise:"Lateral Raise", sets:3, reps:14, weight:0 },
      { group:"Arms", exercise:"Tricep Pushdown", sets:3, reps:12, weight:0 }
    ]},
    { id:"r_pull", name:"Pull Day", focus:["Back","Arms"], items:[
      { group:"Back", exercise:"Barbell Row", sets:4, reps:8, weight:0 },
      { group:"Back", exercise:"Lat Pulldown", sets:3, reps:10, weight:0 },
      { group:"Back", exercise:"Face Pull", sets:3, reps:15, weight:0 },
      { group:"Arms", exercise:"Hammer Curl", sets:3, reps:12, weight:0 }
    ]},
    { id:"r_legs", name:"Leg Day", focus:["Legs","Core"], items:[
      { group:"Legs", exercise:"Squat", sets:4, reps:6, weight:0 },
      { group:"Legs", exercise:"Romanian Deadlift", sets:3, reps:8, weight:0 },
      { group:"Legs", exercise:"Leg Press", sets:3, reps:12, weight:0 },
      { group:"Core", exercise:"Plank", sets:3, reps:1, weight:0, sec:60 }
    ]},
    { id:"r_full", name:"Full Body Express", focus:["Chest","Back","Legs","Shoulders","Core"], items:[
      { group:"Legs", exercise:"Squat", sets:3, reps:8, weight:0 },
      { group:"Chest", exercise:"Dumbbell Bench Press", sets:3, reps:10, weight:0 },
      { group:"Back", exercise:"Seated Cable Row", sets:3, reps:10, weight:0 },
      { group:"Shoulders", exercise:"Overhead Press", sets:2, reps:10, weight:0 },
      { group:"Core", exercise:"Ab Rollout", sets:3, reps:10, weight:0 }
    ]}
  ];

  function normalizeRoutines() {
    if (!Array.isArray(RLIB) || !RLIB.length) RLIB = DEFAULT_ROUTINES.slice();
    RLIB = RLIB.filter(function(r){
      return r && r.id && r.name && Array.isArray(r.items) && r.items.length;
    }).map(function(r){
      return {
        id: String(r.id),
        name: String(r.name),
        focus: Array.isArray(r.focus) ? r.focus : [],
        items: r.items.map(function(it){
          return {
            group: String(it.group || "Chest"),
            exercise: String(it.exercise || "Bench Press"),
            sets: Math.max(1, parseInt(it.sets, 10) || 3),
            reps: Math.max(0, parseFloat(it.reps) || 8),
            weight: Math.max(0, parseFloat(it.weight) || 0),
            sec: Math.max(0, parseInt(it.sec, 10) || 0)
          };
        })
      };
    });
    if (!RSCHED || typeof RSCHED !== "object" || Array.isArray(RSCHED)) RSCHED = {};
  }

  function applyRoutineToDate(routineId, ds) {
    var r = null;
    for (var i=0;i<RLIB.length;i++) if (RLIB[i].id === routineId) { r = RLIB[i]; break; }
    if (!r) return;
    ensureDay(ds);
    if ((W[ds] || []).length && !confirm("Replace current workout for this day with " + r.name + "?")) return;
    W[ds] = [];
    r.items.forEach(function(it){
      var sets = [];
      for (var s=0;s<it.sets;s++) {
        if (it.group === "Cardio") sets.push({ t: Math.max(1, +it.reps || 20), d: Math.max(0, +it.weight || 0) });
        else if (it.sec) sets.push({ r: 1, w:0, sec: it.sec });
        else sets.push({ r: Math.max(1, +it.reps || 8), w: Math.max(0, +it.weight || 0) });
      }
      W[ds].push({ group: it.group, exercise: it.exercise, sets: sets, note: "From routine: " + r.name });
    });
    saveAll();
    render();
  }

  function setCountsByMuscle(days) {
    var dates = lastNDates(days || 7);
    var out = { Chest:0, Back:0, Legs:0, Shoulders:0, Arms:0, Core:0, Cardio:0 };
    dates.forEach(function(d){
      (W[d] || []).forEach(function(ex){
        var g = ex.group || "Chest";
        if (!out[g] && out[g] !== 0) out[g] = 0;
        out[g] += (ex.sets || []).length;
      });
    });
    return out;
  }

  function trainingStreak() {
    var streak = 0;
    for (var i=0;i<90;i++) {
      var d = addDays(tod(), -i);
      if ((W[d] || []).length) streak += 1;
      else break;
    }
    return streak;
  }

  function saveDayAsRoutine(ds) {
    var day = W[ds] || [];
    if (!day.length) return alert("Log at least one exercise before saving a routine.");
    var nm = prompt("Routine name?", "Custom Routine " + fmtS(ds));
    if (!nm) return;
    var items = [];
    day.forEach(function(ex){
      var sample = (ex.sets || [])[0] || {};
      items.push({
        group: ex.group || "Chest",
        exercise: ex.exercise || "Exercise",
        sets: Math.max(1, (ex.sets || []).length || 3),
        reps: Math.max(0, +sample.r || +sample.t || 8),
        weight: Math.max(0, +sample.w || +sample.d || 0),
        sec: Math.max(0, +sample.sec || 0)
      });
    });
    RLIB.unshift({
      id: "r_" + Date.now(),
      name: nm,
      focus: items.map(function(it){ return it.group; }).filter(function(v, i, a){ return a.indexOf(v) === i; }),
      items: items
    });
    saveAll();
    render();
  }

  function openRoutineBuilder(routineId) {
    var existing = null;
    if (routineId) {
      for (var i=0;i<RLIB.length;i++) if (RLIB[i].id === routineId) { existing = RLIB[i]; break; }
    }
    var html = '';
    html += '<div style="padding:14px;min-width:300px;max-width:640px">';
    html += '<div style="font-size:16px;font-weight:900;margin-bottom:8px">'+(existing ? '✏️ Edit Routine' : '➕ Create Routine')+'</div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Routine name</div><input class="inp" id="rb-name" placeholder="e.g., Upper Hypertrophy" value="'+esc(existing ? existing.name : '')+'"></div>';
    html += '<div id="rb-items" style="margin-top:10px"></div>';
    html += '<button class="btn bs" id="rb-add-row" style="margin-top:8px">+ Add Exercise</button>';
    html += '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">';
    html += '<button class="btn bs" id="rb-cancel">Cancel</button>';
    html += '<button class="btn bp" id="rb-save">Save Routine</button>';
    html += '</div></div>';
    showModal(html);

    var itemsEl = document.getElementById('rb-items');
    function rowTemplate(it){
      it = it || { group:'Chest', exercise:'', sets:3, reps:8, weight:0 };
      var groups = Object.keys(EX).map(function(g){ return '<option value="'+esc(g)+'" '+(it.group===g?'selected':'')+'>'+esc(g)+'</option>'; }).join('');
      return '<div class="card rb-row" style="padding:8px;margin-bottom:6px">'+
        '<div style="display:grid;grid-template-columns:1fr 1.3fr .6fr .6fr .7fr auto;gap:6px;align-items:end">'+
          '<div><div style="font-size:9px;color:var(--mt)">Group</div><select class="inp rb-group">'+groups+'</select></div>'+
          '<div><div style="font-size:9px;color:var(--mt)">Exercise</div><input class="inp rb-ex" value="'+esc(it.exercise||'')+'" placeholder="Bench Press"></div>'+
          '<div><div style="font-size:9px;color:var(--mt)">Sets</div><input class="inp rb-sets" type="number" min="1" max="12" value="'+(+it.sets||3)+'"></div>'+
          '<div><div style="font-size:9px;color:var(--mt)">Reps</div><input class="inp rb-reps" type="number" min="0" step="0.5" value="'+(+it.reps||8)+'"></div>'+
          '<div><div style="font-size:9px;color:var(--mt)">Wt</div><input class="inp rb-w" type="number" min="0" step="1" value="'+(+it.weight||0)+'"></div>'+
          '<button class="del rb-del">×</button>'+
        '</div></div>';
    }

    function addRow(it){
      if (!itemsEl) return;
      itemsEl.insertAdjacentHTML('beforeend', rowTemplate(it));
      var rows = itemsEl.querySelectorAll('.rb-row');
      var row = rows[rows.length - 1];
      var del = row.querySelector('.rb-del');
      if (del) del.onclick = function(){ row.remove(); };
      var gsel = row.querySelector('.rb-group');
      var exin = row.querySelector('.rb-ex');
      if (gsel && exin && !exin.value) {
        var list = exerciseList(gsel.value || 'Chest');
        exin.value = list[0] || '';
      }
    }

    (existing && existing.items && existing.items.length ? existing.items : [{ group:'Chest', exercise:'Bench Press', sets:3, reps:8, weight:0 }]).forEach(addRow);

    var addBtn = document.getElementById('rb-add-row');
    if (addBtn) addBtn.onclick = function(){ addRow(); };
    var cancelBtn = document.getElementById('rb-cancel');
    if (cancelBtn) cancelBtn.onclick = closeModal;
    var saveBtn = document.getElementById('rb-save');
    if (saveBtn) saveBtn.onclick = function(){
      var nm = ((document.getElementById('rb-name') || {}).value || '').trim();
      if (!nm) return alert('Routine name is required.');
      var rows = Array.prototype.slice.call((itemsEl || document).querySelectorAll('.rb-row'));
      if (!rows.length) return alert('Add at least one exercise.');
      var items = [];
      rows.forEach(function(row){
        var g = ((row.querySelector('.rb-group')||{}).value || 'Chest');
        var ex = ((row.querySelector('.rb-ex')||{}).value || '').trim();
        var sets = Math.max(1, parseInt((row.querySelector('.rb-sets')||{}).value, 10) || 3);
        var reps = Math.max(0, parseFloat((row.querySelector('.rb-reps')||{}).value) || 8);
        var weight = Math.max(0, parseFloat((row.querySelector('.rb-w')||{}).value) || 0);
        if (!ex) return;
        items.push({ group:g, exercise:ex, sets:sets, reps:reps, weight:weight, sec:0 });
      });
      if (!items.length) return alert('Each row needs an exercise name.');
      var payload = { id: existing ? existing.id : ('r_' + Date.now()), name:nm, focus:items.map(function(it){ return it.group; }).filter(function(v,i,a){ return a.indexOf(v)===i; }), items:items };
      if (existing) {
        RLIB = RLIB.map(function(r){ return r.id === existing.id ? payload : r; });
      } else {
        RLIB.unshift(payload);
      }
      saveAll();
      closeModal();
      render();
    };
  }
   
  function socialId() {
    return "s_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function topPrs(limit) {
    return Object.keys(PR || {}).map(function(k){
      return { exercise: k, e1rm: +(PR[k] && PR[k].e1rm || 0) };
    }).filter(function(x){ return x.e1rm > 0; })
      .sort(function(a,b){ return b.e1rm - a.e1rm; })
      .slice(0, limit || 3);
  }

  function dayWorkoutSummary(ds) {
    var day = W[ds] || [];
    var sets = 0, volume = 0, cardioMin = 0, cardioDist = 0;
    day.forEach(function(ex){
      (ex.sets || []).forEach(function(st){
        var r = +st.r || 0, w = +st.w || 0;
        var t = +st.t || 0, d = +st.d || 0;
        sets += 1;
        volume += (r * w);
        cardioMin += t;
        cardioDist += d;
      });
    });
    return {
      exercises: day.length,
      sets: sets,
      volume: Math.round(volume),
      cardioMin: Math.round(cardioMin * 10) / 10,
      cardioDist: Math.round(cardioDist * 100) / 100
    };
  }

  function mySocialSnapshot() {
    var allWorkoutDays = Object.keys(W || {}).filter(function(d){ return (W[d] || []).length; });
    var allSets = 0;
    var allVolume = 0;
    allWorkoutDays.forEach(function(d){
      var s = dayWorkoutSummary(d);
      allSets += s.sets;
      allVolume += s.volume;
    });
    return {
      name: SOC.profileName || "You",
      workouts: allWorkoutDays.length,
      sets: allSets,
      volume: Math.round(allVolume),
      prs: topPrs(5)
    };
  }

  function leaderboardRows(lift) {
    var me = mySocialSnapshot();
    var meLift = (PR[lift] && PR[lift].e1rm) ? +(PR[lift].e1rm) : 0;
    var rows = [{ name: me.name, score: meLift, workouts: me.workouts, isMe: true }];
    (SOC.friends || []).forEach(function(fr){
      rows.push({
        name: fr.name,
        score: +(fr.lifts && fr.lifts[lift] || 0),
        workouts: +(fr.workouts || 0),
        isMe: false
      });
    });
    return rows.sort(function(a,b){
      if (b.score !== a.score) return b.score - a.score;
      return b.workouts - a.workouts;
    });
  }

  function friendById(friendId) {
    return (SOC.friends || []).find(function(fr){ return String(fr.id) === String(friendId); }) || null;
  }

  function pushFeed(type, text, extras) {
    var item = {
      id: socialId(),
      from: SOC.profileName || "You",
      type: type || "update",
      date: tod(),
      text: text || "",
      at: Date.now()
    };
    if (extras && typeof extras === "object") {
      Object.keys(extras).forEach(function(k){ item[k] = extras[k]; });
    }
    SOC.feed = SOC.feed || [];
    SOC.feed.unshift(item);
    SOC.feed = SOC.feed.slice(0, 120);
  }

  function createPostText(kind) {
    if (kind === "workout") {
      ensureDay(selDate);
      var s = dayWorkoutSummary(selDate);
      if (!s.exercises) return "";
      var top = topPrs(2).map(function(x){ return x.exercise + " " + x.e1rm; }).join(" · ");
      return "Crushed " + s.exercises + " exercises / " + s.sets + " sets on " + fmtS(selDate) + ". Volume " + Math.round(toDisplayWeight(s.volume)) + " " + weightUnitLabel() + "." + (top ? " Top PRs: " + top : "");
    }
    if (kind === "meal") {
      var n = NLOG[selDate] || [];
      if (!n.length) return "";
      var t = dayNutritionTotals(selDate);
      return "Nutrition check-in " + fmtS(selDate) + ": " + Math.round(t.cal) + " kcal, " + Math.round(t.p) + "g protein, " + Math.round(t.c) + "g carbs, " + Math.round(t.f) + "g fat.";
    }
    if (kind === "pr") {
      var prs = topPrs(1);
      if (!prs.length) return "";
      return "New PR spotlight: " + prs[0].exercise + " at " + prs[0].e1rm + " e1RM.";
    }
    return "";
  }
   
   function shareTodayWorkout() {
    ensureDay(selDate);
    var s = dayWorkoutSummary(selDate);
    if (!s.exercises) {
      alert("Log a workout first so there is something to share.");
      return;
    }
    var p = topPrs(2).map(function(x){ return x.exercise + " " + x.e1rm + " e1RM"; }).join(" · ");
    var cardioNote = (s.cardioMin || s.cardioDist) ? (" Cardio: " + s.cardioMin + " min / " + s.cardioDist + " mi.") : "";
    SOC.feed.unshift({
      id: socialId(),
      from: SOC.profileName || "You",
      type: "workout",
      date: selDate,
text: "Logged " + s.exercises + " exercises / " + s.sets + " sets (" + Math.round(toDisplayWeight(s.volume)) + " "+weightUnitLabel()+" volume)." + cardioNote + (p ? " Top PRs: " + p : ""),
       at: Date.now()
    });
    SOC.feed = SOC.feed.slice(0, 80);
    saveAll();
    alert("Shared to your social feed.");
  }

  function isCardioEntry(ex) {
    return !!(ex && ex.group === "Cardio");
  }

  function updatePRFromEntry(ds, exEntry) {
    if (!exEntry || !exEntry.exercise || !exEntry.sets) return;
    if (isCardioEntry(exEntry)) return;
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
  function round1(x){ return Math.round((+x || 0) * 10) / 10; }
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
    return {
      grams: Math.round(g),
      servings: servings ? round1(servings) : 0,
      cal: Math.round((per.cal || 0) * g / 100),
      p: round1((per.p || 0) * g / 100),
      c: round1((per.c || 0) * g / 100),
      f: round1((per.f || 0) * g / 100)
    };
  }
  function calcItemFromFood(food, grams, servings) {
    return calcItem(food, grams, servings);
  }

   function baseServingToGrams(amount, unit) {
    var u = normalizeNutritionUnit(unit);
    var val = +amount || 0;
    if (u === "ounces") return val * 28.3495;
    if (u === "bottles") return val;
    return val;
  }

  function customServingLabel(amount, unit) {
    var u = normalizeNutritionUnit(unit);
    var val = round1(+amount || 0);
    if (u === "ounces") return val + " oz";
    if (u === "bottles") return val + (val === 1 ? " bottle" : " bottles");
    return val + " g";
  }
   
  function saveCustomFood(def) {
    var name = String(def.name || "").trim();
var servingUnit = normalizeNutritionUnit(def.servingUnit || "grams");
    var servingAmount = +def.servingAmount || 0;
    var servingGrams = baseServingToGrams(servingAmount, servingUnit);
     var cal = +def.cal || 0;
    var p = +def.p || 0;
    var c = +def.c || 0;
    var f = +def.f || 0;
    if (!name) return { ok:false, msg:"Food name is required." };
if (!servingAmount || servingAmount <= 0) return { ok:false, msg:"Base serving amount must be greater than 0." };
    if (!servingGrams || servingGrams <= 0) return { ok:false, msg:"Base serving must be greater than 0." };
     if (cal < 0 || p < 0 || c < 0 || f < 0) return { ok:false, msg:"Macros cannot be negative." };
    var per100Factor = 100 / servingGrams;
    var key = foodKey(name);
    NFOODS[key] = {
      name: name,
      per100: {
        cal: round1(cal * per100Factor),
        p: round1(p * per100Factor),
        c: round1(c * per100Factor),
        f: round1(f * per100Factor)
      },
serving: { label: customServingLabel(servingAmount, servingUnit), grams: Math.round(servingGrams) },
       custom: true
    };
 return { ok:true, key:key, food:NFOODS[key], servingGrams: servingGrams };
  }

  function openCustomFoodModal() {
    var html = '';
    html += '<div style="padding:14px;min-width:280px;max-width:520px">';
    html += '<div style="font-size:16px;font-weight:900;margin-bottom:10px">🧪 Create Custom Food</div>';
    html += '<div style="font-size:11px;color:var(--mt);margin-bottom:10px">Enter macros for one serving. This food is saved for reuse.</div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Food name</div><input class="inp" id="cf-name" placeholder="e.g., Homemade Turkey Chili"></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">';
html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Base serving amount</div><input class="inp" id="cf-serv-amt" type="number" min="0.1" step="0.1" value="100"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Base serving unit</div><select class="inp" id="cf-serv-unit"><option value="grams">grams</option><option value="ounces">ounces</option><option value="bottles">bottles</option></select></div>';
     html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Calories</div><input class="inp" id="cf-cal" type="number" min="0" step="1" value="0"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Protein (g)</div><input class="inp" id="cf-p" type="number" min="0" step="0.1" value="0"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Carbs (g)</div><input class="inp" id="cf-c" type="number" min="0" step="0.1" value="0"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Fat (g)</div><input class="inp" id="cf-f" type="number" min="0" step="0.1" value="0"></div>';
    html += '</div>';
    html += '<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px"><input type="checkbox" id="cf-add-today" checked> Add 1 serving to today after saving</label>';
    html += '<div class="row" style="gap:8px;justify-content:flex-end;margin-top:12px">';
    html += '<button class="btn bs" id="cf-cancel">Cancel</button>';
    html += '<button class="btn bp" id="cf-save">Save Food</button>';
    html += '</div></div>';
    showModal(html);

     var servingUnitEl = document.getElementById("cf-serv-unit");
    var servingAmtEl = document.getElementById("cf-serv-amt");
    function syncServingAmountInput() {
      if (!servingUnitEl || !servingAmtEl) return;
      if (servingUnitEl.value === "bottles") {
        servingAmtEl.value = servingAmtEl.value ? servingAmtEl.value : "1";
        servingAmtEl.min = "0.1";
        servingAmtEl.step = "0.1";
      } else if (servingUnitEl.value === "ounces") {
        servingAmtEl.min = "0.1";
        servingAmtEl.step = "0.1";
      } else {
        servingAmtEl.min = "1";
        servingAmtEl.step = "1";
      }
    }
    if (servingUnitEl) {
      servingUnitEl.value = "grams";
      servingUnitEl.onchange = syncServingAmountInput;
    }
    syncServingAmountInput();
     
    var cancelBtn = document.getElementById("cf-cancel");
    if (cancelBtn) cancelBtn.onclick = closeModal;
    var saveBtn = document.getElementById("cf-save");
    if (saveBtn) saveBtn.onclick = function(){
      var payload = {
        name: (document.getElementById("cf-name") || {}).value || "",
servingAmount: parseFloat((document.getElementById("cf-serv-amt") || {}).value) || 0,
        servingUnit: ((document.getElementById("cf-serv-unit") || {}).value) || "grams",
         cal: parseFloat((document.getElementById("cf-cal") || {}).value) || 0,
        p: parseFloat((document.getElementById("cf-p") || {}).value) || 0,
        c: parseFloat((document.getElementById("cf-c") || {}).value) || 0,
        f: parseFloat((document.getElementById("cf-f") || {}).value) || 0
      };
      var res = saveCustomFood(payload);
      if (!res.ok) return alert(res.msg || "Could not save food.");

      if ((document.getElementById("cf-add-today") || {}).checked) {
        ensureDay(selDate);
        var calc = calcItem(res.food, payload.servingGrams, 1);
         if (calc) {
          NLOG[selDate].push({
            id: uid(),
            name: res.food.name,
            key: res.key,
            grams: calc.grams,
            servings: calc.servings,
            cal: calc.cal,
            p: calc.p,
            c: calc.c,
            f: calc.f,
            at: Date.now()
          });
        }
      }
      saveAll();
      closeModal();
      render();
    };
  }

  function openCustomMealPresetModal() {
    var html = '';
    html += '<div style="padding:14px;min-width:280px;max-width:560px">';
    html += '<div style="font-size:16px;font-weight:900;margin-bottom:10px">🍱 Create Meal Preset</div>';
    html += '<div style="font-size:11px;color:var(--mt);margin-bottom:10px">Format each line as <strong>Food Name, grams</strong> (example: Chicken Breast, 175).</div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Meal name</div><input class="inp" id="cm-name" placeholder="e.g., Post-workout meal"></div>';
    html += '<div style="margin-top:8px"><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Foods</div><textarea class="txta" id="cm-lines" placeholder="White Rice, 150&#10;Chicken Breast (cooked), 175"></textarea></div>';
    html += '<div class="row" style="gap:8px;justify-content:flex-end;margin-top:12px">';
    html += '<button class="btn bs" id="cm-cancel">Cancel</button>';
    html += '<button class="btn bp" id="cm-save">Save Meal</button>';
    html += '</div></div>';
    showModal(html);

    var cmCancel = document.getElementById("cm-cancel");
    if (cmCancel) cmCancel.onclick = closeModal;
    var cmSave = document.getElementById("cm-save");
    if (cmSave) cmSave.onclick = function(){
      var name = String((document.getElementById("cm-name") || {}).value || "").trim();
      var linesRaw = String((document.getElementById("cm-lines") || {}).value || "").trim();
      if (!name) return alert("Enter a meal name.");
      if (!linesRaw) return alert("Add at least one food line.");

      var lines = linesRaw.split(/\n+/).map(function(x){ return x.trim(); }).filter(Boolean);
      var items = [];
      var misses = [];
      lines.forEach(function(line){
        var parts = line.split(",");
        var foodName = (parts[0] || "").trim();
        var grams = parseFloat((parts[1] || "").trim()) || 0;
        if (!foodName || grams <= 0) {
          misses.push(line);
          return;
        }
        var key = findFoodKeyByName(foodName);
        if (!key || !NFOODS[key]) {
          misses.push(line);
          return;
        }
        items.push({ key:key, grams:Math.round(grams), servings:0 });
      });

      if (!items.length) return alert("Could not parse foods. Use: Food Name, grams");
      if (misses.length) {
        var msg = "Some lines could not be matched:\n- " + misses.slice(0,4).join("\n- ");
        if (!confirm(msg + "\n\nSave the meal with matched foods only?")) return;
      }

      MEAL_PRESETS.unshift({ id:"m_"+Date.now(), name:name, items:items });
      saveMealPresets();
      closeModal();
      render();
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

    function refreshDailyNutritionCache(ds) {
    var d = ds || selDate;
    var day = dayNutrition(d);
    DN_CACHE[d] = {
      date: d,
      calories: day.totals.cal,
      protein: day.totals.p,
      carbs: day.totals.c,
      fat: day.totals.f,
      updated_at: Date.now()
    };
  }

  function getNutritionTotalsFromCache(ds) {
    var d = ds || selDate;
    if (!DN_CACHE[d]) refreshDailyNutritionCache(d);
    return DN_CACHE[d];
  }

  function buildLast7NutritionFromCache() {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var d = addDays(selDate, -i);
      out.push(getNutritionTotalsFromCache(d));
    }
    return out;
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

   function drawMultiChart(id, labels, series) {
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
      var lineColors = ["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#22d3ee", "#f97316"];

      ctx.fillStyle = bg;
      ctx.fillRect(0,0,Ww,Hh);

      var p = {t: 14, r: 12, b: 28, l: 40};
      var cw = Ww - p.l - p.r;
      var ch = Hh - p.t - p.b;

      var flatValues = [];
      (series || []).forEach(function(s){
        (s.values || []).forEach(function(v){ if (v !== null && !isNaN(v)) flatValues.push(+v); });
      });
      if (!flatValues.length || !labels.length) return;

      var mn = Math.min.apply(null, flatValues);
      var mx = Math.max.apply(null, flatValues);
      if (mn === mx) { mn -= 1; mx += 1; }
      var pad = (mx - mn) * 0.1;
      mn -= pad; mx += pad;

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (var i=0;i<=4;i++) {
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

      (series || []).forEach(function(s, si){
        var color = lineColors[si % lineColors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.lineJoin = "round";
        ctx.beginPath();

        var started = false;
        (s.values || []).forEach(function(v, i){
          if (v === null || isNaN(v)) { started = false; return; }
          var x = p.l + (i / Math.max(labels.length-1,1))*cw;
          var y = p.t + ch - ((v - mn) / (mx - mn))*ch;
          if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
        });

        if (started) ctx.stroke();
      });

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


function scanFoodBarcode() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return alert("Camera not available in this browser.");
  }
  if (typeof BarcodeDetector === "undefined") {
    alert("Barcode scanning requires a supported browser (Chrome on Android or iOS 17+).");
    return;
  }

  showModal(
    '<div style="padding:14px">' +
      '<div class="row" style="justify-content:space-between;margin-bottom:10px">' +
        '<div style="font-size:16px;font-weight:900">📷 Scan Barcode</div>' +
        '<button class="del" id="scan-x" style="font-size:22px">×</button>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--mt);margin-bottom:10px">' +
        'Point your camera at a product barcode. Powered by Open Food Facts.' +
      '</div>' +
      '<video id="scan-vid" autoplay playsinline style="width:100%;border-radius:14px;background:#000;max-height:250px;display:block"></video>' +
      '<div id="scan-msg" style="margin-top:10px;font-size:12px;color:var(--mt);text-align:center">Starting camera…</div>' +
      '<div id="scan-result" style="display:none;margin-top:12px"></div>' +
    '</div>'
  );

  var streamRef = null;
  var scanning  = true;
  var detector  = new BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128","qr_code"] });
  var vid       = document.getElementById("scan-vid");
  var msgEl     = document.getElementById("scan-msg");
  var resultEl  = document.getElementById("scan-result");
  var api       = window._IronLogFoodApi; // exposed by foodApi.js

  function stop() {
    scanning = false;
    if (streamRef) { streamRef.getTracks().forEach(function(t){ try { t.stop(); } catch(e){} }); streamRef = null; }
  }

  function close() { stop(); closeModal(); }

  var xBtn = document.getElementById("scan-x");
  if (xBtn) xBtn.addEventListener("click", close);

  function showFoundFood(apiFood) {
    stop();
    var p100  = apiFood.per100 || {};
    var servG = apiFood.serving ? apiFood.serving.grams : 100;
    var ratio = servG / 100;

    resultEl.style.display = "block";
    resultEl.innerHTML =
      '<div class="food-result-card">' +
        (apiFood.image ? '<img src="' + apiFood.image + '" style="width:100%;max-height:120px;object-fit:contain;border-radius:10px;margin-bottom:10px">' : '') +
        '<div style="font-size:14px;font-weight:900;margin-bottom:2px">' + esc(apiFood.foodName) + '</div>' +
        (apiFood.brand ? '<div style="font-size:11px;color:var(--mt);margin-bottom:8px">' + esc(apiFood.brand) + '</div>' : '') +
        '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">' +
          'Per 100g — Cal: ' + Math.round(p100.cal||0) + ' · P: ' + (p100.p||0) + 'g · C: ' + (p100.c||0) + 'g · F: ' + (p100.f||0) + 'g' +
        '</div>' +
        '<div class="row" style="gap:8px">' +
          '<div class="log-amount-wrap" style="background:var(--c2);border-radius:10px;padding:0 8px;display:flex;align-items:center;gap:4px">' +
            '<input class="inp" type="number" id="scan-grams" min="1" step="1" value="' + servG + '" style="width:64px;background:transparent;border:none">' +
            '<span style="font-size:11px;color:var(--mt)">g</span>' +
          '</div>' +
          '<button class="btn bp" id="scan-add" style="flex:1">➕ Add to log</button>' +
        '</div>' +
      '</div>';

    var addBtn = document.getElementById("scan-add");
    if (addBtn) addBtn.addEventListener("click", function() {
      var g = parseFloat(document.getElementById("scan-grams").value) || servG;
      var entry = api.apiItemToLogEntry(apiFood, g);
      if (entry) {
        ensureDay(selDate);
        NLOG[selDate].push(entry);
        saveAll();
        close();
        render();
      }
    });
  }

  function showNotFound(barcode) {
    stop();
    msgEl.textContent = "Barcode " + barcode + " not found in Open Food Facts.";
    msgEl.style.color = "var(--yl)";
    resultEl.style.display = "block";
    resultEl.innerHTML =
      '<div style="font-size:12px;color:var(--mt);margin-bottom:8px">Try searching the food by name instead:</div>' +
      '<div class="row" style="gap:6px">' +
        '<input class="inp" id="scan-fallback-name" placeholder="e.g., Peanut Butter" style="flex:1">' +
        '<button class="btn bp" id="scan-fallback-search">Search</button>' +
      '</div>' +
      '<div id="scan-fallback-results" style="margin-top:10px"></div>';

    var searchBtn = document.getElementById("scan-fallback-search");
    if (searchBtn) searchBtn.addEventListener("click", function() {
      var q = (document.getElementById("scan-fallback-name").value || "").trim();
      if (!q || !api) return;
      var resEl = document.getElementById("scan-fallback-results");
      resEl.innerHTML = '<div style="font-size:11px;color:var(--mt)">Searching…</div>';
      api.searchFood(q, 5).then(function(results) {
        if (!results.length) { resEl.innerHTML = '<div style="font-size:11px;color:var(--mt)">No results.</div>'; return; }
        resEl.innerHTML = "";
        results.forEach(function(food) {
          var btn = document.createElement("button");
          btn.className = "btn bs";
          btn.style.cssText = "width:100%;text-align:left;margin-bottom:6px;padding:10px;font-size:12px;display:block";
          btn.textContent = food.foodName + (food.brand ? " — " + food.brand : "") +
                            " (" + Math.round(food.per100.cal||0) + " cal/100g)";
          btn.addEventListener("click", function() { showFoundFood(food); });
          resEl.appendChild(btn);
        });
      });
    });
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
    .then(function(stream) {
      streamRef = stream;
      vid.srcObject = stream;
      msgEl.textContent = "Scanning — hold steady…";

      function tick() {
        if (!scanning) return;
        if (vid.readyState < 2) { requestAnimationFrame(tick); return; }
        detector.detect(vid).then(function(codes) {
          if (!scanning) return;
          if (codes && codes.length) {
            var raw = (codes[0].rawValue || "").trim();
            if (!raw) { requestAnimationFrame(tick); return; }
            msgEl.textContent = "Found barcode: " + raw + " — looking up…";
            if (!api) { showNotFound(raw); return; }
            api.lookupBarcode(raw).then(function(food) {
              if (food) showFoundFood(food);
              else showNotFound(raw);
            });
          } else {
            requestAnimationFrame(tick);
          }
        }).catch(function() { requestAnimationFrame(tick); });
      }
      requestAnimationFrame(tick);
    })
    .catch(function(err) {
      msgEl.textContent = "Camera error: " + (err && err.message ? err.message : "Permission denied");
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
    if (!window.__ironlogSkeletonDone) {
      window.__ironlogSkeletonDone = true;
      app.innerHTML = '<div class="card skeleton" style="height:108px;margin-bottom:10px"></div><div class="card skeleton" style="height:160px;margin-bottom:10px"></div><div class="card skeleton" style="height:220px"></div>';
      setTimeout(function(){ queueRender(0); }, 120);
      return;
    } 
var nav = document.querySelector(".bnav");
    var timerBar = document.getElementById("tbar");
    var loggedIn = isSignedIn();

    if (nav) nav.style.display = "";
     if (!loggedIn && timerBar) timerBar.style.display = "none";
    
var h = "";
    h += renderAuthStatusCard();

    if (!loggedIn) {
      h += '<div class="card" style="margin-bottom:8px">';
      h += '<div style="font-size:12px;font-weight:700">You\'re using offline mode.</div>';
      h += '<div style="font-size:11px;color:var(--mt);margin-top:4px">You can log workouts and navigate all screens without signing in. Sign in anytime for cloud sync and social features.</div>';
      h += '<div style="margin-top:8px">';
      h += '<button class="btn bs" id="open-login-screen" style="padding:6px 10px;font-size:11px">Sign in / Create account</button>';
      h += '</div></div>';
    }

    var showDateNav = (view !== "social" && view !== "profile");
    if (showDateNav) {
      h += '<div class="card" style="padding:8px">';
      h += '<div class="row" style="justify-content:space-between;align-items:center">';
      h += '<button class="pm" id="d-prev">←</button>';
      h += '<div style="text-align:center"><div style="font-size:15px;font-weight:800">'+esc(fmtD(selDate))+'</div><div style="font-size:10px;color:var(--mt)">'+(selDate===tod()?"Today":esc(selDate))+'</div></div>';
      h += '<button class="pm" id="d-next">→</button>';
      h += '</div></div>';
    }

    // Weekly adherence + guardrails (last 7 days)
    var adh = weeklyAdherence();
    var adhPct = Math.round(adh.score * 100);
    var volMsg = (adh.sets > adh.setCap) ? ('⚠️ Volume high ('+adh.sets+' sets / 7d). Consider trimming accessories.') : ('✅ Volume OK ('+adh.sets+' sets / 7d)');
  
if (view === "home") {
      var homeDay = dayNutrition(selDate);
      var homeTotals = homeDay.totals;
      var homeGoals = calcAutoGoals();
var weightInfo = getRecentWeightTrendInfo();
   var todayWeight = BW[selDate] ? (+BW[selDate] || 0) : weightInfo.today;
      var focusData = buildTodayFocusData();
      var todayFocusItems = (focusData.items || []).slice(0, 2);
      var lastWorkout = getLastWorkoutSummary();
      var homeCalRemaining = Math.max(0, (homeGoals.cal || 0) - (homeTotals.cal || 0));
      var homeProteinRemaining = Math.max(0, (homeGoals.p || 0) - Math.round(homeTotals.p || 0));
      var caloriePct = homeGoals.cal ? Math.round((homeTotals.cal / homeGoals.cal) * 100) : 0;
      var proteinPct = homeGoals.p ? Math.round((homeTotals.p / homeGoals.p) * 100) : 0;

      var focusHtml = '';
      if (focusData.routine) focusHtml += '<div class="focus-routine-pill">Today: '+esc(focusData.routine.name)+'</div>';
      if (todayFocusItems.length) {
        todayFocusItems.forEach(function(item, idx){
          focusHtml += '<div class="focus-item'+(idx === 0 ? ' top' : '')+'">';
          focusHtml += '<div><div style="font-size:12px;font-weight:800">'+esc(item.group)+'</div>';
          focusHtml += '<div class="home-meta mono-number">'+item.current+'/'+item.target+' weekly sets</div><div class="home-meta">Add '+item.deficit+' sets this week</div></div>';
          focusHtml += '<button class="btn bp home-focus-action" data-group="'+esc(item.group)+'" data-sets="'+item.sets+'">Add Sets</button>';
          focusHtml += '</div>';
        });
      } else {
        focusHtml += '<div class="empty-state"><div class="empty-icon">✅</div><div><div class="empty-title">Great coverage this week</div><div class="empty-meta">No urgent muscle-group gaps right now.</div></div></div>';
      }
       focusHtml += '<div class="row" style="gap:8px;margin-top:10px">';
      focusHtml += '<button class="btn bs" id="home-log-food" style="flex:1">Log Food</button>';
      focusHtml += '<button class="btn bp" id="home-start-workout" style="flex:1">'+(((W[selDate]||[]).length ? 'Continue Workout' : 'Start Workout'))+'</button>';
      focusHtml += '</div>';
      focusHtml += '<div class="row" style="gap:8px;margin-top:8px">';
      focusHtml += '<button class="btn bs" id="home-focus-viewall" style="flex:1">View All Focus</button>';
      focusHtml += '<button class="btn bs" id="home-weight-toggle" style="flex:1">'+(homeWeightEntryOpen ? 'Close Weight' : 'Log Weight')+'</button>';
      focusHtml += '</div>';
      if (homeWeightEntryOpen) {
       focusHtml += '<div class="row" style="gap:8px;margin-top:10px">';
        focusHtml += '<input type="number" class="inp input-large" id="bw-inp" style="flex:1" placeholder="'+weightUnitLabel()+'" value="'+(BW[selDate] ? toDisplayWeight(BW[selDate]) : '')+'">';
        focusHtml += '<button class="btn bp" id="bw-btn">Save</button>';
        focusHtml += '</div>';
      }

  var dashboardRenderer = window.IronLogUI && window.IronLogUI.renderDashboard;
      if (dashboardRenderer) {
        h += dashboardRenderer({
          greeting: 'Welcome back, ' + esc((((typeof USER!=="undefined" && USER && USER.name) ? USER.name : '') || 'Lifter')),
          headline: 'Push Day — Week ' + (Math.ceil((new Date(selDate+'T00:00:00').getDate()) / 7) || 1),
          adherence: adhPct,
          calories: homeTotals.cal,
          protein: Math.round(homeTotals.p || 0),
          caloriePct: caloriePct,
          proteinPct: proteinPct,
          focusTitle: (focusData.routine && focusData.routine.name) ? esc(focusData.routine.name) : 'Daily Targets',
          focusMeta: 'Calories remaining: ' + homeCalRemaining + ' · Protein remaining: ' + homeProteinRemaining + 'g',
          focusHtml: focusHtml,
          weightValue: todayWeight ? (toDisplayWeight(todayWeight) + ' ' + weightUnitLabel()) : 'No Weigh-In',
          weightMeta: (weightInfo && weightInfo.hasData) ? ('7-day avg: ' + toDisplayWeight(weightInfo.avg7) + ' ' + weightUnitLabel()) : 'Log bodyweight to unlock trend',
          momentumValue: adh.workouts + '/' + adh.plan,
          momentumMeta: lastWorkout ? ('Last workout: ' + esc(lastWorkout.name) + ' · ' + esc(fmtS(lastWorkout.date))) : 'Last workout: —'
        });
      }
    }

    if (view === "track") {
 h += '<div class="row tab-switcher" style="gap:8px;margin-top:8px;margin-bottom:8px"><button class="btn bs track-mode'+(trackMode==='workout'?' on':'')+'" data-mode="workout" style="flex:1">Workout</button><button class="btn bs track-mode'+(trackMode==='nutrition'?' on':'')+'" data-mode="nutrition" style="flex:1">Nutrition</button></div>';
    }

    if (view === "track" && trackMode === "workout") {
      h += "<div id=\"dashboard-v2\"></div>";
       var bw = BW[selDate];
             var bwDisp = bw ? toDisplayWeight(bw) : 0;
      h += '<div class="card card-elevated">';
       h += '<div class="row" style="justify-content:space-between;align-items:center">';
      h += '<div><div style="font-size:10px;color:var(--mt);text-transform:uppercase;font-weight:700">⚖️ Body Weight</div>';
    h += bw ? '<div style="font-size:22px;font-weight:900;color:var(--pk)">'+bwDisp+' '+weightUnitLabel()+'</div>' : '<div style="font-size:11px;color:var(--mt)">Not logged</div>';
       h += '</div>';
 h += '<div class="row" style="gap:6px"><input type="number" class="inp" id="bw-inp" style="width:90px" placeholder="'+weightUnitLabel()+'" value="'+(bw ? bwDisp : "")+'"><button class="btn bs" id="bw-btn" style="padding:8px 12px">'+(bw?"✓":"Log")+'</button></div>';
       h += '</div></div>';

      var day = W[selDate] || [];
       h += '<div class="row" style="gap:8px;margin-bottom:8px">';
      h += '<button class="btn bp" id="start-workout-btn" style="flex:1">▶ Start Workout</button>';
      h += '<button class="btn bs" id="finish-workout-btn" style="flex:1">✅ Finish Workout</button>';
      h += '</div>';
      h += '<div class="row" style="justify-content:space-between;margin-top:4px;align-items:center">';
      h += '<div class="sect" style="margin:0">🏋️ Today\'s Workout</div>';
       h += '<div class="row" style="gap:6px">';
      h += '<button class="btn bs" id="share-workout-btn" style="padding:6px 10px;font-size:11px">🤝 Share</button>';
      h += '<button class="btn bp" data-act="add-ex" style="padding:6px 10px;font-size:11px">➕ Add</button>';
       h += '</div>';
       h += '</div><div style="height:8px"></div>';

      if (!day.length) {
        h += '<div class="empty"><div style="font-size:40px;margin-bottom:8px">🏋️</div>No exercises logged yet.</div>';
      } else {
        day.forEach(function(ex, idx){
 var lastSession = getLastExerciseSession(ex.exercise, selDate);
          var lastSets = (lastSession && lastSession.entry && Array.isArray(lastSession.entry.sets)) ? lastSession.entry.sets : [];
 h += '<div class="card exercise-card exercise-card-v2" style="margin-bottom:10px" data-progress-tone="'+progressToneForEntry(ex)+'" data-strength-mode="'+((ex.setStyle==='standard'&&entryStrengthScore(ex)>600)?'strength':'hypertrophy')+'">';
           h += '<div class="row" style="justify-content:space-between;align-items:flex-start">';
          h += '<div><div style="font-size:12px;color:var(--mt);font-weight:700">'+esc(ex.group)+'</div>';
          h += '<div style="font-size:15px;font-weight:900">'+esc(ex.exercise)+'</div>';
                    if (ex.equipment) h += '<div style="font-size:10px;color:var(--mt);font-weight:700;margin-top:2px">🛠 '+esc(ex.equipment)+'</div>';
           if (ex.setStyle && ex.setStyle !== "standard") h += '<div style="font-size:10px;color:var(--bl);font-weight:800;margin-top:2px">'+esc(ex.setStyle === 'drop' ? 'Drop Set' : 'Super Set')+'</div>';
h += '<div style="font-size:11px;color:var(--mt);margin-top:4px">'+ex.sets.map(function(s){
            if (isCardioEntry(ex)) return ((+s.t||0)+' min · '+(+s.d||0)+' mi');
return (s.r||0)+'×'+((+s.w||0)>0? (toDisplayWeight(s.w)+' '+weightUnitLabel()):'BW');
}).join(" · ")+'</div></div>';
           h += '<button class="del" data-act="rm-ex" data-i="'+idx+'">×</button>';
            h += '</div>';
          h += '<div class="row" style="gap:8px;align-items:center;margin-top:8px">';
          h += '<div style="font-size:10px;color:var(--mt);font-weight:700">'+(isCardioEntry(ex)?'Intervals':'Sets')+'</div>';
     h += '<input class="inp mono-number" data-act="set-count" data-i="'+idx+'" type="number" min="1" max="20" value="'+((ex.sets||[]).length||1)+'" style="width:88px;padding:6px 8px">';
           h += '</div>';
 h += '<div class="set-grid" style="margin-top:8px;display:grid;grid-template-columns:44px 1fr 1fr;gap:8px;align-items:center">';
           h += '<div style="font-size:10px;color:var(--mt);font-weight:700">'+(isCardioEntry(ex)?'Int':'Set')+'</div>';
          h += '<div style="font-size:10px;color:var(--mt);font-weight:700">'+(isCardioEntry(ex)?'Time (min)':'Reps')+'</div>';
 h += '<div style="font-size:10px;color:var(--mt);font-weight:700">'+(isCardioEntry(ex)?'Distance (mi)':'Weight ('+weightUnitLabel()+')')+'</div>';
           (ex.sets || []).forEach(function(st, sIdx){
            h += '<div style="font-size:11px;color:var(--mt)">#'+(sIdx+1)+'</div>';
            if (isCardioEntry(ex)) {
              h += '<input class="inp" data-act="set-time" data-i="'+idx+'" data-s="'+sIdx+'" type="number" min="0" step="0.5" value="'+(+st.t||0)+'" style="padding:6px 8px">';
              h += '<input class="inp" data-act="set-distance" data-i="'+idx+'" data-s="'+sIdx+'" type="number" min="0" step="0.05" value="'+(+st.d||0)+'" style="padding:6px 8px">';
            } else {
var lastSet = lastSets[sIdx] || null;
              var lastRepsGhost = lastSet ? (lastSet.r || '') : '';
              var lastWeightGhost = (lastSet && (+lastSet.w || 0) > 0) ? toDisplayWeight(lastSet.w) : 'BW';
  h += '<input class="inp input-large mono-number" data-act="set-reps" data-i="'+idx+'" data-s="'+sIdx+'" type="number" min="0" max="100" value="'+(+st.r||0)+'" style="padding:6px 8px" placeholder="'+lastRepsGhost+'">';
h += '<div class="weight-stepper"><button class="ws-btn" data-act="adjust-weight" data-i="'+idx+'" data-s="'+sIdx+'" data-delta="-5">−5</button><input class="inp input-large mono-number" data-act="set-weight" data-i="'+idx+'" data-s="'+sIdx+'" type="number" min="0" step="'+(USER.weightUnit==='kg'?'1':'2.5')+'" value="'+((+st.w||0)>0?toDisplayWeight(st.w):'')+'" style="padding:6px 8px" placeholder="'+lastWeightGhost+'"><button class="ws-btn" data-act="adjust-weight" data-i="'+idx+'" data-s="'+sIdx+'" data-delta="5">+5</button></div>'; 
            }
});
          h += '</div>';
            h += '<button class="btn bs set-complete" data-act="set-complete" data-i="'+idx+'">Swipe → Complete Set Block</button>';
          if (ex.note) h += '<div style="margin-top:8px;font-size:11px;color:var(--mt);font-style:italic">📝 '+esc(ex.note)+'</div>';
          h += '</div>';
        });
      }

        h += '<div class="row" style="justify-content:center;margin-top:10px">';
      h += '<button class="btn bp" data-act="add-ex" style="padding:10px 14px;font-size:12px">➕ Add Workout</button>';
      h += '</div>';
    }
              
    if (view === "progress") {
      h += '<div class="sect">🧭 Workout Calendar</div>';
      var calendar = buildWorkoutCalendar(30);
      var workoutDays = calendar.cells.filter(function(c){ return !c.blank && c.hasWorkout; }).length;
      h += '<div class="card card-elevated progress-calendar-card">';
      h += '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">';
      h += '<div><div style="font-size:14px;font-weight:900">Last 30 Days</div><div class="home-meta">'+esc(fmtS(calendar.start))+' → '+esc(fmtS(calendar.end))+'</div></div>';
      h += '<div class="progress-calendar-pill">'+workoutDays+' workout day'+(workoutDays===1?'':'s')+'</div>';
      h += '</div>';
      h += '<div class="progress-calendar-grid">';
      ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(lbl){
        h += '<div class="progress-calendar-dow">'+lbl+'</div>';
      });
      calendar.cells.forEach(function(cell){
        if (cell.blank) {
          h += '<div class="progress-calendar-cell blank"></div>';
          return;
        }
        var cls = 'progress-calendar-cell' + (cell.hasWorkout ? ' has-workout' : '') + (cell.date === selDate ? ' selected' : '');
        var title = fmtD(cell.date) + (cell.hasWorkout ? (' • Volume ' + (cell.volume || 0) + ' ' + weightUnitLabel()) : ' • No workout logged');
        h += '<button class="'+cls+'" data-act="jump" data-date="'+cell.date+'" title="'+esc(title)+'">';
        h += '<span class="day">'+cell.day+'</span>';
        h += cell.hasWorkout ? '<span class="marker"></span>' : '<span class="marker marker-off"></span>';
        h += '</button>';
      });
      h += '</div>';
      h += '<div class="home-meta" style="margin-top:10px">Tap a highlighted day to open that session in Track.</div>';
      h += '</div>';
    }
    if (view === "progress") {
      h += '<div class="sect">📈 Progress</div>';
      var bwD = Object.keys(BW).sort();
      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:4px">⚖️ Bodyweight</div>';
      if (bwD.length >= 2) {
        var v = bwD.map(function(d){ return +BW[d]; });
        var cur = v[v.length-1], start = v[0], diff = cur-start;
 h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">Current: <strong style="color:var(--pk)">'+toDisplayWeight(cur)+'</strong> '+weightUnitLabel()+' · Change: <strong>'+(diff>0?'+':'')+toDisplayWeight(diff).toFixed(1)+'</strong></div>';
         h += '<canvas id="bw-ch" style="width:100%;height:180px"></canvas>';
      } else {
        h += '<div style="font-size:11px;color:var(--mt)">Log bodyweight 2+ days.</div>';
      }
      h += '</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">🏆 PRs (Est. 1RM)</div>';
      var prNames = Object.keys(PR).sort(function(a,b){ return (PR[b].e1rm||0)-(PR[a].e1rm||0); });
             syncProgressPRFilter();
      if (!prNames.length) {
        h += '<div style="font-size:11px;color:var(--mt)">No PRs yet. Log weights & reps.</div>';
      } else {
h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">Choose which PRs to show below.</div>';
         h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">';
        h += '<button class="btn bs" id="pr-filter-all" style="padding:5px 10px;font-size:10px">Select all</button>';
        h += '<button class="btn bs" id="pr-filter-none" style="padding:5px 10px;font-size:10px">Clear</button>';
        h += '</div>';
 h += '<div style="margin-bottom:10px">';
        h += '<div style="font-size:10px;color:var(--mt);margin-bottom:4px">PR options (multi-select dropdown)</div>';
        h += '<select class="inp" id="pr-filter-select" multiple size="'+Math.min(8, Math.max(4, prNames.length))+'" style="height:auto">';
         prNames.forEach(function(n){
         var selected = (PROG_PR_FILTER || []).indexOf(n) >= 0 ? ' selected' : '';
          h += '<option value="'+esc(n)+'"'+selected+'>'+esc(n)+'</option>';
        });
          h += '</select>';
        h += '<div style="font-size:10px;color:var(--mt);margin-top:4px">Select multiple PRs in the dropdown to update the list.</div>';
       h += '</div>';

        var visiblePRs = prNames.filter(function(n){ return (PROG_PR_FILTER || []).indexOf(n) >= 0; }).slice(0, 20);
        if (!visiblePRs.length) {
          h += '<div style="font-size:11px;color:var(--mt)">No PRs selected. Pick one or more above.</div>';
        } else {
          visiblePRs.forEach(function(n){
            var p = PR[n];
            h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--c2)">';
            h += '<div><div style="font-size:12px;font-weight:800">'+esc(n)+'</div><div style="font-size:10px;color:var(--mt)">'+esc(fmtS(p.date||tod()))+' · '+toDisplayWeight(p.w)+'×'+p.r+'</div></div>';
            h += '<div style="font-size:15px;font-weight:900;color:var(--yl)">'+toDisplayWeight(p.e1rm)+'</div>';
            h += '</div>';
          });
           
           var prTrend = buildPRTrendData(visiblePRs);
          h += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--c2)">';
          h += '<div style="font-size:12px;font-weight:800;margin-bottom:6px">📉 Selected PR Trend</div>';
          if (prTrend.series.length && prTrend.labels.length >= 2) {
            h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">';
            prTrend.series.forEach(function(s, i){
              var colors = ["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#22d3ee", "#f97316"];
              var color = colors[i % colors.length];
              h += '<div style="font-size:10px;color:var(--mt);display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:999px;background:'+color+';display:inline-block"></span>'+esc(s.name)+'</div>';
            });
            h += '</div>';
            h += '<canvas id="pr-trend-ch" style="width:100%;height:180px"></canvas>';
          } else {
            h += '<div style="font-size:11px;color:var(--mt)">Log selected exercises on at least 2 days to see the trend chart.</div>';
          }
          h += '</div>';
        }
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

       var mSets = setCountsByMuscle(7);
      var targets = { Chest:[10,18], Back:[12,20], Legs:[10,18], Shoulders:[8,16], Arms:[14,28], Core:[6,14], Cardio:[3,12] };
 h += '<div class="card card-elevated">';
       h += '<div style="font-size:13px;font-weight:900;margin-bottom:8px">🧠 Muscle Balance Intelligence (last 7 days)</div>';
      Object.keys(targets).forEach(function(gm){
        var lo = targets[gm][0], hi = targets[gm][1], sets = mSets[gm] || 0;
        var pct = Math.min(100, Math.round((sets / hi) * 100));
        var state = (sets < lo) ? 'under' : (sets > hi ? 'over' : 'balanced');
        var color = state === 'under' ? 'var(--yl)' : (state === 'over' ? 'var(--rd)' : 'var(--gn)');
        var tag = state === 'under' ? 'Underworked' : (state === 'over' ? 'Overworked' : 'On target');
        h += '<div class="wt-row">';
        h += '<div class="wt-head"><span class="wt-name">'+esc(ICO[gm]+' '+gm)+'</span><span class="wt-nums">'+sets+' sets (goal '+lo+'-'+hi+')</span></div>';
        h += '<div class="wt-bar"><div class="wt-fill" style="width:'+pct+'%;background:'+color+'"></div></div>';
        h += '<div style="font-size:10px;color:'+color+';margin-top:3px;font-weight:700">'+tag+'</div>';
        h += '</div>';
      });
      h += '</div>';

      h += '<div class="card card-elevated">';
       h += '<div style="font-size:13px;font-weight:900;margin-bottom:8px">📌 Detailed Weekly Adherence</div>';
      h += '<div style="font-size:11px;color:var(--mt)">Score: <strong style="color:var(--gn)">'+adhPct+'%</strong> · Workouts: '+adh.workouts+'/'+adh.plan+'</div>';
      h += '<div style="font-size:11px;color:var(--mt);margin-top:4px">Recovery / volume guardrail: '+volMsg+'</div>';
      h += '</div>';
    }

    if (view === "track" && trackMode === "nutrition") {
       var dayData = dayNutrition(selDate);
      var totals = dayData.totals;
      var goals = calcAutoGoals();
h += '<div class="sect section-title" style="font-size:20px;letter-spacing:-.02em;text-transform:none;color:var(--text-primary)">Nutrition</div>';
       var calPct = Math.min(100, Math.round((totals.cal / goals.cal) * 100));
      var pPct = Math.min(100, Math.round((totals.p / goals.p) * 100));
      h += '<div class="card card-elevated">';
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
 h += '<div style="height:10px;background:var(--c2);border-radius:999px;overflow:hidden"><div class="macro-fill" style="width:'+calPct+'%"></div></div>';
       h += '<div style="height:8px"></div>';
      h += '<div style="font-size:10px;color:var(--mt);margin-bottom:4px">Protein ('+pPct+'%)</div>';
  h += '<div style="height:10px;background:var(--c2);border-radius:999px;overflow:hidden"><div class="macro-fill" style="width:'+pPct+'%"></div></div>';
       h += '</div>';
      h += '</div>';

        var intelligence = null;
      if (typeof window.initNutritionIntelligence === "function") {
        var bwRows = Object.keys(BW).sort().map(function(d){ return { date: d, weight: +BW[d] || 0 }; });
        var last7 = buildLast7NutritionFromCache();
var adherence = weeklyAdherence();
        intelligence = window.initNutritionIntelligence({
          bodyweightLogs: bwRows,
          goalWeight: +USER.bodyweightGoal || 170,
          weeklyRateTarget: +USER.weekly_rate_target || -0.5,
          calorieTarget: goals.cal,
          autoCalorieAdjustments: !!USER.auto_calorie_adjustments,
          targets: { calories: goals.cal, protein: goals.p, carbs: goals.c, fat: goals.f },
          totals: { calories: totals.cal, protein: totals.p, carbs: totals.c, fat: totals.f },
          logItems: dayData.items,
          last7DaysNutrition: last7,
          hasWorkoutToday: !!((W[selDate] || []).length),
          nextWorkoutInMinutes: ((W[addDays(selDate, 1)] || []).length ? 90 : 999),
          workoutAdherence: Math.round((adherence.workouts / Math.max(1, adherence.plan)) * 100),
          goalType: USER.goal_type || USER.goalMode || "cut"
        });
      }

      if (intelligence && window.NutritionIntelligenceUI) {
        var UI = window.NutritionIntelligenceUI;
        h += UI.NutritionInsightCard('📉 Bodyweight Trend', intelligence.trendInsight.message, intelligence.trendInsight.status === 'on_track' ? 'good' : 'warn');
        if (intelligence.projection) {
          h += UI.NutritionInsightCard('🎯 Goal Projection', 'Projected goal date: ' + intelligence.projection.date + ' (' + intelligence.projection.weeks + ' weeks).', 'neutral');
        }
        h += UI.RemainingMacrosCard(intelligence.remaining);
        h += UI.ProteinScoreRing(intelligence.proteinScore);
        h += UI.CalorieAdjustmentAlert(intelligence.calorieAdjustment);
        h += UI.NutritionInsightCard('🏋️ Workout Nutrition Coach', intelligence.workoutGuidance.message, 'neutral');
        h += UI.NutritionInsightCard('🧬 Physique Progress Panel', intelligence.physiqueStatus + '. Weekly nutrition adherence: ' + intelligence.calorieScore + '%.', 'good');
        h += UI.DailyChecklist([
          { label: 'Hit calories', done: Math.abs(goals.cal - totals.cal) <= 150 },
          { label: 'Hit protein', done: totals.p >= goals.p },
          { label: 'Pre-workout meal logged', done: intelligence.workoutGuidance.phase !== 'pre' },
          { label: 'Post-workout meal logged', done: intelligence.workoutGuidance.phase !== 'post' || totals.p >= (goals.p * 0.7) },
          { label: 'Within weight-trend target', done: intelligence.trendInsight.status === 'on_track' }
        ]);
      }

  h += '<div class="card card-elevated">';
       h += '<div style="font-size:13px;font-weight:900;margin-bottom:4px">➕ Search & Log Food</div>';
  h += '<div style="font-size:11px;color:var(--mt);margin-bottom:10px">Searches 2M+ foods via USDA + Open Food Facts</div>';
  h += '<div id="api-search-root"></div>';
  h += '</div>';

      // Meal presets
      h += '<div class="card card-elevated">';
       h += '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">';
      h += '<div style="font-size:13px;font-weight:800">🍱 Meal Presets</div>';
      h += '<div class="row" style="gap:6px">';
      h += '<button class="btn bs" id="open-custom-meal-btn" style="padding:6px 10px;font-size:11px">➕ New meal</button>';
      h += '<button class="btn bs" id="save-preset-btn" style="padding:6px 10px;font-size:11px">💾 Save today</button>';
      h += '</div>';
      h += '</div>';
      if (!MEAL_PRESETS.length) {
        h += '<div style="font-size:11px;color:var(--mt)">No presets yet.</div>';
      } else {
        MEAL_PRESETS.forEach(function(p){
          h += '<div class="row" style="justify-content:space-between;gap:8px;margin-bottom:6px">';
          h += '<button class="btn bp preset-add" data-id="'+esc(p.id)+'" style="flex:1;padding:8px 10px;font-size:12px;text-align:left">➕ '+esc(p.name)+'</button>';
          h += '<button class="del preset-del" data-id="'+esc(p.id)+'" title="Delete">×</button>';
          h += '</div>';
        });
      }
      if (canScanBarcode()) {
        h += '<div style="height:6px"></div>';
        h += '<button class="btn bs" id="scan-barcode-btn" style="width:100%">📷 Scan Barcode</button>';
        h += '<div style="font-size:10px;color:var(--mt);margin-top:6px">Optional: map barcodes to foods once, then 1-tap add.</div>';
      }
      h += '</div>';


      h += '<div class="card card-elevated">';
       h += '<div style="font-size:13px;font-weight:900;margin-bottom:8px">Food Log</div>';
      if (!dayData.items.length) {
        h += '<div style="font-size:11px;color:var(--mt)">No food logged today.</div>';
      } else {
        dayData.items.slice().sort(function(a,b){ return (+b.at||0)-(+a.at||0); }).forEach(function(it){
          h += '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--c2)">';
          h += '<div style="min-width:0">';
          h += '<div style="font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(it.name)+'</div>';
          var amt = [];
          if (it.grams) amt.push((USER.nutritionUnit === "ounces" ? (Math.round((it.grams / 28.3495) * 10) / 10 + " oz") : (it.grams + "g")));
          if (it.servings) amt.push(it.servings + (USER.nutritionUnit === "bottles" ? " bottle(s)" : " srv"));
          h += '<div style="font-size:10px;color:var(--mt)">'+esc(amt.join(" · "))+'</div>';
          h += '<div style="font-size:10px;color:var(--mt)">'+Math.round(it.cal||0)+' cal · P '+Math.round(it.p||0)+' · C '+Math.round(it.c||0)+' · F '+Math.round(it.f||0)+'</div>';
          h += '</div>';
          h += '<button class="del food-del" data-i="'+(dayData.items.indexOf(it))+'">×</button>';
          h += '</div>';
        });
      }
      h += '</div>';
    }

    if (view === "plan") {
      var dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
         var shortNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      var weekStart = getWeekWindowStart();
      var weekSummary = getPlannedCompletedForWeek();
      h += '<div class="sect">📁 Plan</div>';
      h += '<div class="card card-elevated">';
       h += '<div class="home-card-title" style="margin-bottom:10px">🗓️ Weekly Schedule</div>';
      h += '<div class="home-meta" style="margin-bottom:10px">Tap a day to assign a routine.</div>';
      h += '<div class="plan-week-grid">';
      for (var wd = 0; wd < 7; wd++) {
        var dow = wd === 6 ? 0 : wd + 1;
        var dayDate = addDays(weekStart, wd);
        var rid = RSCHED[String(dow)] || '';
        var rr = (RLIB || []).find(function(item){ return item.id === rid; });
        var isRestDay = isRestScheduleValue(rid);
        var completed = (W[dayDate] || []).length > 0;
        h += '<button class="plan-day'+(completed ? ' done' : '')+(isRestDay ? ' rest' : '')+(planSelectedDow===dow ? ' selected' : '')+'" data-dow="'+dow+'">';
        h += '<div class="plan-day-name">'+shortNames[wd]+'</div>';
        h += '<div class="plan-day-routine">'+esc(isRestDay ? 'Rest Day' : (rr ? rr.name : '—'))+'</div>';
        h += '</button>';
      }
      h += '</div>';
      h += '<div class="home-meta" style="margin-top:10px">Planned: '+weekSummary.planned+' workouts • Completed: '+weekSummary.completed+'</div>';
      var nextPlan = getNextPlannedWorkoutSummary(selDate);
      h += '<div class="home-meta" style="margin-top:6px">Next up: '+(nextPlan ? (esc(nextPlan.day)+' — '+esc(nextPlan.routine)) : '— (tap a day to assign)')+'</div>';
      h += '</div>';

      h += '<div class="card card-elevated">';
       h += '<div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px">';
      h += '<div class="home-card-title">Preset Workout Library</div>';
       h += '<div class="row" style="gap:6px">';
      h += '<button class="btn bs" id="new-routine-btn" style="padding:6px 10px;font-size:11px">➕ New</button>';
      h += '<button class="btn bs" id="save-routine-from-day" style="padding:6px 10px;font-size:11px">💾 Save today</button>';
      h += '</div>';
      h += '</div>';

       (RLIB || []).forEach(function(r, idx){
        var open = !!planAccordionOpen[r.id];
        h += '<div class="routine-acc'+(open ? ' open' : '')+'">';
        h += '<button class="routine-acc-head" data-id="'+esc(r.id)+'">';
        h += '<div><div style="font-size:13px;font-weight:800">'+esc(r.name)+'</div>';
         h += '<div class="home-meta">'+esc((r.focus||[]).join(' · ') || 'Full body')+' · '+r.items.length+' exercises</div></div>';
        h += '<div style="font-size:12px">'+(open ? '▾' : '▸')+'</div>';
        h += '</button>';
        h += '<div class="routine-acc-body">';
        h += '<div class="row" style="gap:6px;flex-wrap:wrap">';
        h += '<button class="btn bp routine-apply" data-id="'+esc(r.id)+'" style="padding:6px 10px;font-size:11px">Use Today</button>';
 h += '<button class="btn bs routine-plan-picker" data-id="'+esc(r.id)+'" style="padding:6px 10px;font-size:11px">Assign to Day</button>';
        h += '<button class="btn bs routine-edit" data-id="'+esc(r.id)+'" style="padding:6px 10px;font-size:11px">Edit</button>';
        h += '<button class="del routine-del" data-id="'+esc(r.id)+'">×</button>';
        h += '</div>';
          h += '</div>';
        h += '</div>';
      });
      h += '</div>';
    }

  if (view === "social" || view === "profile") {
      h += '<div class="sect">'+(view === 'social' ? '🤝 Social' : '👤 Profile')+'</div>';

       if (view === "profile" && (!authSession || !authSession.user)) {
          h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">🔐 Account</div>';
        if (!authReady) {
          h += '<div style="font-size:11px;color:var(--mt)">Checking session…</div>';
        } else if (authBusy) {
          h += '<div style="font-size:11px;color:var(--mt)">Working…</div>';
        } else if (!sb) {
          h += '<div style="font-size:11px;color:var(--mt)">' + esc(authMsg || "Auth not configured.") + '</div>';
        } else {
          h += '<div style="font-size:10px;color:var(--mt);margin-bottom:6px">Create an account or sign in with email/password.</div>';
          h += '<input class="inp" id="auth-email" type="email" placeholder="you@example.com" style="margin-bottom:6px">';
          h += '<input class="inp" id="auth-password" type="password" placeholder="Password" style="margin-bottom:8px">';
          h += '<div class="row" style="gap:6px">';
          h += '<button class="btn bp" id="auth-signup" style="padding:8px 10px">Sign up</button>';
          h += '<button class="btn bs" id="auth-signin" style="padding:8px 10px">Sign in</button>';
          h += '</div>';
        }
        h += '</div>';
      }

            if (view === "social") {
       var socialMe = mySocialSnapshot();
      var lift = SOC.leaderboardLift || "Bench Press";
      var liftChoices = ["Bench Press","Squat","Deadlift","Overhead Press","Barbell Row"];
      var board = leaderboardRows(lift);
        h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">🤝 Social Hub</div>';
      h += '<div style="font-size:11px;color:var(--mt);margin-bottom:8px">Build your profile, add real users by @handle, chat, and share workouts, meals, and PR updates.</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">';
      h += '<div class="meas-item"><div class="meas-val">'+socialMe.workouts+'</div><div class="meas-lbl">My workouts</div></div>';
      h += '<div class="meas-item"><div class="meas-val">'+socialMe.volume.toLocaleString()+'</div><div class="meas-lbl">Total volume</div></div>';
      h += '</div>';
         h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';
      h += '<input class="inp" id="social-name" placeholder="Display name" value="'+esc(SOC.profileName || "You")+'">';
      h += '<input class="inp" id="social-handle" placeholder="@handle" value="'+esc(SOC.handle || "")+'">';
      h += '</div>';
h += '<textarea class="txta" id="social-bio" placeholder="Short bio" style="margin-top:6px">'+esc(SOC.bio || "")+'</textarea>';
      h += '<button class="btn bs" id="save-social-name" style="margin-top:8px;padding:8px 10px">Save profile</button>';
      h += '</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">👥 Friends</div>';
h += '<div style="font-size:11px;font-weight:700;margin-bottom:4px">Send friend request (real user via @handle)</div>';
       h += '<div class="row" style="gap:6px;margin-bottom:8px">';
      h += '<input class="inp" id="friend-handle" placeholder="@handle" style="flex:1">';
      h += '<button class="btn bp" id="add-friend-btn" style="padding:8px 10px">Send</button>';
      h += '</div>';
            h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">Use this once to send requests. Pending and sent requests are listed below.</div>';
      h += '<div style="font-size:11px;font-weight:700;margin-bottom:4px">Pending requests</div>';
      if ((SOC.requests || []).length) {
        (SOC.requests || []).forEach(function(rq, idx){
          h += '<div class="rec-item" style="margin-bottom:6px">';
          h += '<div><strong>'+esc(rq.name)+'</strong> <span style="font-size:10px;color:var(--mt)">'+esc(rq.handle || '')+'</span></div>';
          h += '<div class="row" style="gap:4px">';
          h += '<button class="btn bs accept-request" data-i="'+idx+'" style="padding:5px 8px;font-size:10px">Accept</button>';
          h += '<button class="btn decline-request" style="padding:5px 8px;font-size:10px;background:var(--rd);color:#fff" data-i="'+idx+'">Decline</button>';
          h += '</div></div>';
        });
      } else {
        h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">No pending requests.</div>';
      }
      h += '<div style="font-size:11px;font-weight:700;margin-bottom:4px">Sent requests</div>';
      if ((SOC.sentRequests || []).length) {
        (SOC.sentRequests || []).forEach(function(rq){
          h += '<div class="rec-item" style="margin-bottom:6px">';
          h += '<div><strong>'+esc(rq.name)+'</strong> <span style="font-size:10px;color:var(--mt)">'+esc(rq.handle || '')+'</span></div>';
          h += '<div style="font-size:10px;color:var(--mt)">pending</div>';
          h += '</div>';
        });
      } else {
        h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">No outgoing requests.</div>';
      }
     h += '<div style="font-size:11px;font-weight:700;margin-bottom:4px">Your friends</div>';
      if ((SOC.friends || []).length) {
        (SOC.friends || []).forEach(function(fr, idx){
          h += '<div class="rec-item" style="margin-bottom:6px">';
h += '<div><strong>'+esc(fr.name)+'</strong><div style="font-size:10px;color:var(--mt)">'+esc(fr.handle || '')+' · Bench '+(+((fr.lifts||{})["Bench Press"])||0)+' · Squat '+(+((fr.lifts||{}).Squat)||0)+' · Deadlift '+(+((fr.lifts||{}).Deadlift)||0)+'</div></div>';
          h += '<div class="row" style="gap:4px">';
           h += '<button class="del social-rm" data-i="'+idx+'">×</button>';
          h += '</div>';
                     h += '</div>';
        });
          } else {
        h += '<div style="font-size:10px;color:var(--mt);margin-bottom:8px">No friends yet.</div>';
      }
      h += '</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">💬 Messages</div>';
      h += '<div class="row" style="gap:6px;align-items:center;margin-bottom:6px">';
      h += '<select class="inp" id="msg-friend" style="flex:1"><option value="">Select friend</option>';
      (SOC.friends || []).forEach(function(fr){
        h += '<option value="'+esc(fr.id)+'">'+esc(fr.name)+'</option>';
      });
      h += '</select>';
      h += '<button class="btn bs" id="send-msg-btn" style="padding:8px 10px">Send</button></div>';
      h += '<textarea class="txta" id="msg-body" placeholder="Send a message, plan a lift, or check in on meals/workouts."></textarea>';
      h += '<div id="msg-thread" style="margin-top:8px">';
      h += '<div style="font-size:10px;color:var(--mt)">Pick a friend to view recent messages.</div>';
      h += '</div></div>';
       
      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">🏆 Leaderboard</div>';
      h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">';
      liftChoices.forEach(function(l){
        h += '<button class="btn bs social-lift'+(lift===l?' on':'')+'" data-lift="'+esc(l)+'" style="padding:6px 10px;font-size:11px">'+esc(l)+'</button>';
      });
      h += '</div>';
      board.forEach(function(row, i){
        h += '<div class="rec-item" style="margin-bottom:6px;'+(row.isMe?'border:1px solid var(--bl)':'')+'">';
        h += '<div><span style="font-weight:900">#'+(i+1)+'</span> '+esc(row.name)+(row.isMe?' <span style="font-size:10px;color:var(--bl)">(you)</span>':'')+'</div>';
        h += '<div style="font-size:12px;font-weight:800">'+(row.score ? row.score+' e1RM' : '—')+'</div>';
        h += '</div>';
      });
      h += '</div>';

      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:8px">📣 Shared Feed</div>';
h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">';
      h += '<button class="btn bs" id="share-social-summary" style="padding:8px 10px">Share profile</button>';
      h += '<button class="btn bs" id="share-workout-post" style="padding:8px 10px">Share workout</button>';
      h += '<button class="btn bs" id="share-meal-post" style="padding:8px 10px">Share meal</button>';
      h += '<button class="btn bs" id="share-pr-post" style="padding:8px 10px">Share PR</button>';
      h += '</div>';
       if (!(SOC.feed || []).length) {
h += '<div style="font-size:11px;color:var(--mt)">No shared updates yet. Share your workout, meals, or PRs to start your feed.</div>';      
       } else {
        (SOC.feed || []).slice(0, 16).forEach(function(item){
           h += '<div class="card" style="margin-bottom:6px;padding:10px">';
h += '<div style="font-size:11px;font-weight:800">'+esc(item.from || 'Athlete')+' <span style="font-size:10px;color:var(--mt);font-weight:600">'+esc(item.type || 'update')+'</span></div>';
           h += '<div style="font-size:10px;color:var(--mt)">'+esc(item.date || '')+'</div>';
          h += '<div style="font-size:11px;margin-top:4px">'+esc(item.text || '')+'</div>';
          h += '</div>';
        });
      }
      h += '</div>';
                     }

      if (view === "profile") {
      h += '<div class="card"><div style="font-size:13px;font-weight:900;margin-bottom:10px">Settings</div>';
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Training sessions/week</div><input id="set-sess" class="inp" type="number" min="0" max="14" value="'+(USER.sessionsPerWeek||5)+'"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Steps/day</div><input id="set-steps" class="inp" type="number" min="0" max="30000" step="500" value="'+(USER.stepsPerDay||10000)+'"></div>';
      h += '</div>';
      h += '<div style="height:10px"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:6px">Goal</div>';
      var gm = USER.goalMode || "cut";
h += '<select class="inp" id="set-goal"><option value="cut"'+(gm==='cut'?' selected':'')+'>cut</option><option value="maintain"'+(gm==='maintain'?' selected':'')+'>maintain</option><option value="bulk"'+(gm==='bulk'?' selected':'')+'>bulk</option></select>';
      h += '</div>';
      h += '<div style="height:10px"></div>';
      h += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:6px">Goal pace</div>';
      var ag = USER.goalPace || USER.cutAggressiveness || "moderate";
      h += '<select class="inp" id="set-goal-pace"><option value="performance"'+(ag==='performance'?' selected':'')+'>performance</option><option value="moderate"'+(ag==='moderate'?' selected':'')+'>moderate</option><option value="aggressive"'+(ag==='aggressive'?' selected':'')+'>aggressive</option></select>';
      h += '</div>';
      h += '<div style="height:10px"></div>';
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
    }

    app.innerHTML = h;
    if (view === "track" && trackMode === "nutrition") {
  var apiRoot = document.getElementById("api-search-root");
  if (apiRoot && typeof initSearchFood === "function") {
    apiRoot.innerHTML = "";
    initSearchFood(apiRoot, {
      onFoodLog: function(food, entry) {
        window._IronLogApp.addFoodEntry(entry);
      }
    });
  }
}
     app.classList.remove("view-transition-out");
    app.classList.add("view-transition-in");
    setTimeout(function(){ app.classList.remove("view-transition-in"); }, 220);
    bindEvents();

      if (view === "track" && trackMode === "workout" && lastHomeSuggestion) {
      showToast('Suggestion: add '+lastHomeSuggestion.sets+' sets for '+lastHomeSuggestion.group+'.');
      lastHomeSuggestion = null;
    }
     
   if (window.IronLogDashboard) {
      window.IronLogDashboard.initDashboard({
        view: view,
        analytics: buildDashboardAnalytics(),
        onQuickStart: function(){
          var weekday = new Date(selDate+'T00:00:00').getDay();
          var rid = RSCHED[String(weekday)] || RSCHED[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday]];
          if (rid) {
            applyRoutineById(rid);
          } else if (confirm('No routine planned. Start an empty workout?')) {
            openAddExerciseModal();
          }
        },
        onProfileSaved: function(fd){
          USER.trainingGoal = fd.get('goal');
          USER.experienceLevel = fd.get('experience');
          USER.sessionsPerWeek = parseInt(fd.get('days'), 10) || USER.sessionsPerWeek;
          USER.bodyweightGoal = parseFloat(fd.get('goal_weight')) || USER.bodyweightGoal;
          saveAll();
          render();
        }
      });
      window.IronLogDashboard.initExerciseIntelligence();
    }

    if (view === "progress") {
      var bwD2 = Object.keys(BW).sort();
if (bwD2.length >= 2) drawChart("bw-ch", bwD2.map(fmtS), bwD2.map(function(d){ return toDisplayWeight(BW[d]); }));

      var prTrendData = buildPRTrendData((PROG_PR_FILTER || []).slice(0, 20));
      if (prTrendData.series.length && prTrendData.labels.length >= 2) {
        drawMultiChart("pr-trend-ch", prTrendData.labels, prTrendData.series);
      }
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
html += '<div style="margin-bottom:10px"><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Weight unit for this workout</div><select class="inp" id="ae-weight-unit"><option value="lbs"'+(USER.weightUnit==='lbs'?' selected':'')+'>lbs</option><option value="kg"'+(USER.weightUnit==='kg'?' selected':'')+'>kg</option></select></div>';
      html += '<div style="margin-bottom:10px"><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Equipment</div><select class="inp" id="ae-equipment">';
    html += '<option value="">No equipment selected</option>';
    EQUIPMENT_OPTIONS.forEach(function(opt){ html += '<option value="'+esc(opt)+'">'+esc(opt)+'</option>'; });
    html += '</select></div>';
     html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">';
    html += '<div><div id="ae-sets-label" style="font-size:10px;color:var(--mt);margin-bottom:4px">Sets</div><input class="inp" id="ae-sets" type="number" min="1" max="10" value="3"></div>';
    html += '<div><div id="ae-metric1-label" style="font-size:10px;color:var(--mt);margin-bottom:4px">Reps</div><input class="inp" id="ae-reps" type="number" min="0" step="1" value="8"></div>';
html += '<div><div id="ae-metric2-label" style="font-size:10px;color:var(--mt);margin-bottom:4px">Weight (' + weightUnitLabel() + ')</div><input class="inp" id="ae-w" type="number" min="0" step="5" placeholder="optional"></div>';
     html += '</div>';

     html += '<div style="height:10px"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Set Type</div><select class="inp" id="ae-set-style"><option value="standard">Standard Sets</option><option value="drop">Drop Set</option><option value="super">Super Set</option></select></div>';

    html += '<div id="ae-last-session" class="card" style="margin-top:10px;display:none;padding:8px"></div>';

     html += '<div style="height:10px"></div>';
    html += '<div><div style="font-size:10px;color:var(--mt);margin-bottom:4px">Note (optional)</div><textarea class="txta" id="ae-note" placeholder="e.g., RPE 8, paused reps..."></textarea></div>';

    html += '<div class="row" style="gap:8px;justify-content:flex-end;margin-top:12px">';
    html += '<button class="btn bs" id="ae-cancel">Cancel</button>';
    html += '<button class="btn bp" id="ae-add">Add</button>';
    html += '</div>';

    html += '</div>';

    showModal(html);

    var hintEl = document.getElementById("ae-hint");
      var lastSessionEl = document.getElementById("ae-last-session");
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
        toDisplayWeight(sug.last.w)+'×'+sug.last.r+
        ' · Try <strong>'+toDisplayWeight(sug.opt1.w)+'×'+sug.opt1.r+'</strong> or <strong>'+toDisplayWeight(sug.opt2.w)+'×'+sug.opt2.r+'</strong>';
    }

      function updateLastSessionHint() {
      if (!lastSessionEl) return;
      var exSel2 = document.getElementById("ae-ex");
      var exName = exSel2 ? exSel2.value : "";
      var last = lastExerciseSession(exName);
      if (!last || !last.entry) {
        lastSessionEl.style.display = "none";
        lastSessionEl.innerHTML = "";
        return;
      }
      var styleName = (last.entry.setStyle === "drop") ? "Drop Set" : (last.entry.setStyle === "super" ? "Super Set" : "Standard");
      var setLines = (last.entry.sets || []).map(function(s, i){
        if (isCardioEntry(last.entry)) return '#'+(i+1)+' '+((+s.t||0)+' min · '+(+s.d||0)+' mi');
return '#'+(i+1)+' '+(+s.r||0)+' reps @ '+((+s.w||0)>0 ? (toDisplayWeight(s.w)+' '+weightUnitLabel()) : 'BW');
      }).join(' · ');
      lastSessionEl.style.display = "block";
      var equipmentLine = last.entry.equipment ? ('<div style="font-size:10px;color:var(--mt);margin-top:2px">🛠 '+esc(last.entry.equipment)+'</div>') : '';
         lastSessionEl.innerHTML = '<div style="font-size:10px;color:var(--mt);font-weight:700">Last time for this exercise</div>'+
        '<div style="font-size:11px;font-weight:800;margin-top:2px">'+esc(fmtD(last.date))+' · '+styleName+'</div>'+
               equipmentLine+
            '<div style="font-size:11px;color:var(--mt);margin-top:3px">'+esc(setLines)+'</div>';
    }
     function syncAddModalFields() {
      var grp = (document.getElementById("ae-group") || {}).value || "Chest";
      var isCardio = (grp === "Cardio");
      var l1 = document.getElementById("ae-metric1-label");
      var l2 = document.getElementById("ae-metric2-label");
      var setsLbl = document.getElementById("ae-sets-label");
      var repInp = document.getElementById("ae-reps");
      var wtInp = document.getElementById("ae-w");
      if (setsLbl) setsLbl.textContent = isCardio ? "Intervals" : "Sets";
      if (l1) l1.textContent = isCardio ? "Time (min)" : "Reps";
   var unitSel = document.getElementById("ae-weight-unit");
      var modalWeightUnit = normalizeWeightUnit(unitSel ? unitSel.value : USER.weightUnit);
 if (l2) l2.textContent = isCardio ? "Distance (mi)" : "Weight ("+weightUnitLabel(modalWeightUnit)+")";
        if (repInp) {
        repInp.step = isCardio ? "0.5" : "1";
        repInp.max = isCardio ? "600" : "50";
        if (isCardio && (!repInp.value || +repInp.value === 8)) repInp.value = "20";
      }
      if (wtInp) {
wtInp.step = isCardio ? "0.05" : (modalWeightUnit === "kg" ? "1" : "5");
         if (isCardio && (!wtInp.value || +wtInp.value === 0)) wtInp.value = "2";
         if (!isCardio && +wtInp.value === 0) wtInp.value = "";
      }
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
    syncAddModalFields();
      updateHint();
     gSel.addEventListener("change", function(){ fillExercises(this.value); syncAddModalFields(); updateHint(); });
       updateLastSessionHint();
     gSel.addEventListener("change", function(){ fillExercises(this.value); syncAddModalFields(); updateHint(); updateLastSessionHint(); });
    }
 var aeWeightUnit = document.getElementById("ae-weight-unit");
    if (aeWeightUnit) aeWeightUnit.addEventListener("change", syncAddModalFields);
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
       updateLastSessionHint();
    });

    var exSel = document.getElementById("ae-ex");
 if (exSel) exSel.addEventListener("change", function(){ updateHint(); updateLastSessionHint(); });
    updateLastSessionHint();
     
    var cancel = document.getElementById("ae-cancel");
    if (cancel) cancel.addEventListener("click", closeModal);

    var add = document.getElementById("ae-add");
    if (add) add.addEventListener("click", function(){
      var grp = (document.getElementById("ae-group") || {}).value || "Chest";
      var ex = (document.getElementById("ae-ex") || {}).value || "Bench Press";
      var setsN = parseInt((document.getElementById("ae-sets") || {}).value, 10) || 3;
      var isCardio = (grp === "Cardio");
      var reps = parseFloat((document.getElementById("ae-reps") || {}).value) || (isCardio ? 20 : 8);
      var wt = parseFloat((document.getElementById("ae-w") || {}).value) || 0;
    var chosenWeightUnit = normalizeWeightUnit((document.getElementById("ae-weight-unit") || {}).value || USER.weightUnit);
      USER.weightUnit = chosenWeightUnit;
       var wtStored = isCardio ? wt : toStoredWeight(wt);
             var setStyle = (document.getElementById("ae-set-style") || {}).value || "standard";
     var equipment = ((document.getElementById("ae-equipment") || {}).value || "").trim();
       var note = ((document.getElementById("ae-note") || {}).value || "").trim();

      ensureDay(selDate);
var entry = { group: grp, exercise: ex, sets: [], note: note, setStyle: setStyle, equipment: equipment };
       for (var i=0;i<setsN;i++) {
        if (isCardio) entry.sets.push({ t: Math.max(0, Math.round(reps * 10) / 10), d: Math.max(0, Math.round(wt * 100) / 100) });
 else entry.sets.push({ r: Math.max(0, Math.round(reps)), w: Math.max(0, Math.round(wtStored * 10) / 10) });
       }

      W[selDate].push(entry);
      updatePRFromEntry(selDate, entry);
      saveAll();
      closeModal();
      render();
    });
  }

  function openAuthDialog() {
    var html = '';
    html += '<div style="padding:14px;min-width:280px;max-width:420px">';
    html += '<div style="font-size:16px;font-weight:900;margin-bottom:10px">🔐 Sign in</div>';
    html += '<input class="inp" id="auth-email" type="email" placeholder="you@example.com" style="margin-bottom:8px">';
    html += '<input class="inp" id="auth-password" type="password" placeholder="Password" style="margin-bottom:8px">';
    html += '<label style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--mt);margin-bottom:10px">';
    html += '<input id="auth-remember" type="checkbox" ' + (rememberedDevice ? 'checked' : '') + '> Remember this device';
    html += '</label>';
    html += '<div class="row" style="gap:8px">';
    html += '<button class="btn bp" id="auth-signin" style="flex:1">Sign in</button>';
    html += '<button class="btn bs" id="auth-signup" style="flex:1">Create account</button>';
    html += '</div>';
    if (authMsg) html += '<div style="font-size:10px;color:var(--mt);margin-top:6px">' + esc(authMsg) + '</div>';
    html += '<div class="row" style="justify-content:flex-end;margin-top:12px">';
    html += '<button class="btn bs" id="auth-close">Close</button>';
    html += '</div></div>';
    showModal(html);

    var close = document.getElementById('auth-close');
    if (close) close.onclick = closeModal;
    var signIn = document.getElementById('auth-signin');
    if (signIn) signIn.onclick = function(){ runAuthAction('signin'); };
    var signUp = document.getElementById('auth-signup');
    if (signUp) signUp.onclick = function(){ runAuthAction('signup'); };
  }
   
   // -----------------------------
  // Events
  // -----------------------------
  function bindEvents() {
    var prev = document.getElementById("d-prev");
    var next = document.getElementById("d-next");
   if (prev) prev.onclick = function(){ selDate = addDays(selDate, -1); planSelectedDow = new Date(selDate + "T00:00:00").getDay(); sv("il_selDate", selDate); queueRender(60); };
    if (next) next.onclick = function(){ selDate = addDays(selDate, 1); planSelectedDow = new Date(selDate + "T00:00:00").getDay(); sv("il_selDate", selDate); queueRender(60); };
     
    var themeBtn = document.getElementById("thm-btn");
    if (themeBtn) themeBtn.onclick = function(){
      TH = (TH === "dark") ? "light" : "dark";
      saveAll();
      render();
    };

    document.querySelectorAll(".nb").forEach(function(btn){
      btn.onclick = function(){
        var nextView = this.getAttribute("data-v") || "home";
        if (nextView === view) return;
        var appEl = document.getElementById("app");
        if (appEl) appEl.classList.add("view-transition-out");
        view = nextView;
        sv("il_view", view);
        document.querySelectorAll(".nb").forEach(function(b){ b.classList.remove("on"); });
        this.classList.add("on");
        queueRender(90);
      };
    });
    document.querySelectorAll(".nb").forEach(function(btn){
      btn.classList.toggle("on", (btn.getAttribute("data-v") === view));
    });
  if (window.IronLogAnimations) {
      window.IronLogAnimations.addPressFeedback('.nb, .btn, .thm');
      if (view === 'home') window.IronLogAnimations.animateInStagger('.dashboard-stagger', 60);
    }
     
     var profileBtn = document.getElementById("profile-btn");
    if (profileBtn) profileBtn.onclick = function(){
      view = "profile";
      saveAll();
      render();
    };

    document.querySelectorAll(".track-mode").forEach(function(btn){
      btn.onclick = function(){
        trackMode = this.getAttribute("data-mode") || "workout";
        saveAll();
        render();
      };
    });

    var homeStartWorkoutBtn = document.getElementById("home-start-workout");
    if (homeStartWorkoutBtn) homeStartWorkoutBtn.onclick = function(){
      view = "track";
      trackMode = "workout";
      saveAll();
      render();
    };

     var homeFocusViewAllBtn = document.getElementById("home-focus-viewall");
    if (homeFocusViewAllBtn) homeFocusViewAllBtn.onclick = function(){
      var all = buildTodayFocusData().items || [];
      var rows = all.map(function(item){
        return '<div class="focus-modal-row"><div><strong>'+esc(item.group)+'</strong><div class="home-meta">'+item.current+'/'+item.target+' weekly sets • add '+item.deficit+'</div></div><div class="home-meta">score '+item.score+'</div></div>';
      }).join("");
      showModal('<div style="padding:6px 2px"><div style="font-size:16px;font-weight:900;margin-bottom:10px">All focus items</div>' + (rows || '<div class="home-meta">No focus items right now.</div>') + '<button class="btn bs" id="focus-close" style="width:100%;margin-top:12px">Done</button></div>');
      var closeBtn = document.getElementById("focus-close");
      if (closeBtn) closeBtn.onclick = closeModal;
    };

    var homeLogFoodBtn = document.getElementById("home-log-food");
    if (homeLogFoodBtn) homeLogFoodBtn.onclick = function(){
      view = "track";
      trackMode = "nutrition";
      saveAll();
      render();
    };

    var homeWeightToggleBtn = document.getElementById("home-weight-toggle");
    if (homeWeightToggleBtn) homeWeightToggleBtn.onclick = function(){
      homeWeightEntryOpen = !homeWeightEntryOpen;
      render();
    };

    document.querySelectorAll('.home-focus-action').forEach(function(btn){
      btn.onclick = function(){
        var group = this.getAttribute("data-group") || "Chest";
        var sets = parseInt(this.getAttribute("data-sets"), 10) || 3;
        lastHomeSuggestion = { group: group, sets: sets };
        view = "track";
        trackMode = "workout";
        saveAll();
        render();
        showToast('Suggestion: add '+sets+' sets for '+group+'.');
      };
    });
     
     var openLoginScreenBtn = document.getElementById("open-login-screen");
    if (openLoginScreenBtn) openLoginScreenBtn.onclick = function(){
      openAuthDialog();
    };
     
    var authSignUpBtn = document.getElementById("auth-signup");
    if (authSignUpBtn) authSignUpBtn.onclick = function(){ runAuthAction("signup"); };

    var authSignInBtn = document.getElementById("auth-signin");
    if (authSignInBtn) authSignInBtn.onclick = function(){ runAuthAction("signin"); };

    var authSignOutBtn = document.getElementById("auth-signout");
    if (authSignOutBtn) authSignOutBtn.onclick = runSignOut;

    var authSignOutTopBtn = document.getElementById("auth-signout-top");
    if (authSignOutTopBtn) authSignOutTopBtn.onclick = runSignOut;
     
     var bwBtn = document.getElementById("bw-btn");
    if (bwBtn) bwBtn.onclick = function(){
      var inp = document.getElementById("bw-inp");
      var v = inp ? parseFloat(inp.value) : 0;
     if (!v || v < 20) return alert("Enter a valid weight ("+weightUnitLabel()+").");
      BW[selDate] = toStoredWeight(v);
      saveAll();
      render();
    };

   document.querySelectorAll('[data-act="add-ex"]').forEach(function(btn){
      btn.onclick = openAddExerciseModal;
    });
     var startWorkoutBtn = document.getElementById("start-workout-btn");
    if (startWorkoutBtn) startWorkoutBtn.onclick = function(){
      openAddExerciseModal();
    };

    var finishWorkoutBtn = document.getElementById("finish-workout-btn");
    if (finishWorkoutBtn) finishWorkoutBtn.onclick = function(){
      alert("Workout saved for " + fmtD(selDate) + ". Great work!");
    };
     
var shareWorkoutBtn = document.getElementById("share-workout-btn");
    if (shareWorkoutBtn) shareWorkoutBtn.onclick = shareTodayWorkout;
     
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
 document.querySelectorAll('[data-act="set-reps"], [data-act="set-weight"], [data-act="set-time"], [data-act="set-distance"], [data-act="set-count"]').forEach(function(inp){
    inp.onchange = function(){
        var exIdx = parseInt(this.getAttribute("data-i"), 10);
        var setIdx = parseInt(this.getAttribute("data-s"), 10);
var act = this.getAttribute("data-act");
        if (isNaN(exIdx)) return;
       var day = W[selDate] || [];
        var ex = day[exIdx];
if (!ex || !ex.sets) return;

        if (act === "set-count") {
          var newCount = Math.max(1, Math.min(20, parseInt(this.value, 10) || 1));
          var curCount = ex.sets.length || 0;
          if (newCount > curCount) {
            var isCardio = isCardioEntry(ex);
            var seed = ex.sets[curCount - 1] || (isCardio ? { t: 20, d: 0 } : { r: 8, w: 0 });
            while (ex.sets.length < newCount) {
              ex.sets.push(isCardio ? { t: +seed.t || 0, d: +seed.d || 0 } : { r: +seed.r || 0, w: +seed.w || 0 });
            }
          } else if (newCount < curCount) {
            ex.sets = ex.sets.slice(0, newCount);
          }
          this.value = String(newCount);
          updatePRFromEntry(selDate, ex);
          saveAll();
          render();
          return;
        }

        if (isNaN(setIdx) || !ex.sets[setIdx]) return;
       var v = parseFloat(this.value) || 0;
        if (act === "set-reps") ex.sets[setIdx].r = Math.max(0, Math.round(v));
else if (act === "set-weight") ex.sets[setIdx].w = Math.max(0, Math.round(toStoredWeight(v) * 10) / 10);
else if (act === "set-time") ex.sets[setIdx].t = Math.max(0, Math.round(v * 10) / 10);
        else if (act === "set-distance") ex.sets[setIdx].d = Math.max(0, Math.round(v * 100) / 100);
        updatePRFromEntry(selDate, ex);
        saveAll();
        render();
      };
    });

      document.querySelectorAll('[data-act="adjust-weight"]').forEach(function(btn){
      btn.onclick = function(){
        var i = this.getAttribute('data-i');
        var s = this.getAttribute('data-s');
        var delta = parseFloat(this.getAttribute('data-delta') || '0') || 0;
        var target = document.querySelector('[data-act="set-weight"][data-i="'+i+'"][data-s="'+s+'"]');
        if (!target) return;
        var cur = parseFloat(target.value || '0') || 0;
        target.value = Math.max(0, cur + delta);
        target.dispatchEvent(new Event('change'));
      };
    });

    document.querySelectorAll('[data-act="set-complete"]').forEach(function(btn){
      btn.onclick = function(){
        this.classList.add('set-complete-done');
        showToast('Set block completed ✅');
      };
    });
     
    document.querySelectorAll('[data-act="jump"]').forEach(function(btn){
      btn.onclick = function(){
        var d = this.getAttribute("data-date");
        if (!d) return;
        selDate = d;
view = "track";
        trackMode = "workout";
         sv("il_selDate", selDate);
        sv("il_view", view);
        document.querySelectorAll(".nb").forEach(function(b){
          b.classList.toggle("on", (b.getAttribute("data-v") === "track"));
        });
        render();
      };
    });

    var addFoodBtn = document.getElementById("add-food-btn");
    if (addFoodBtn) addFoodBtn.onclick = function(){
      var nameEl = document.getElementById("food-name");
      var amountEl = document.getElementById("food-amount");

      var name = (nameEl && nameEl.value ? nameEl.value : "").trim();
      if (!name) return alert("Enter a food name.");

      var food = findFoodByName(name);
      if (!food) return alert("Food not found. Try selecting from the dropdown suggestions.");

      var amount = parseFloat(amountEl && amountEl.value ? amountEl.value : "") || 0;
     var foodUnit = normalizeNutritionUnit(((document.getElementById("food-unit") || {}).value) || USER.nutritionUnit);
      USER.nutritionUnit = foodUnit;
       var grams = 0, servings = 0;
       if (foodUnit === "ounces") grams = amount * 28.3495;
      else if (foodUnit === "bottles") servings = amount;
      else grams = amount;

      var calc = calcItem(food, grams, servings);
if (!calc) return alert("Enter an amount.");
       
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
       if (amountEl) amountEl.value = "";

      saveAll();
      render();
    };
    // Barcode scan (optional)
    var scanBtn = document.getElementById("scan-food-btn");
    if (scanBtn) scanBtn.addEventListener("click", scanFoodBarcode);
    var customFoodBtn = document.getElementById("open-custom-food-btn");
    if (customFoodBtn) customFoodBtn.addEventListener("click", openCustomFoodModal);
    var customMealBtn = document.getElementById("open-custom-meal-btn");
    if (customMealBtn) customMealBtn.addEventListener("click", openCustomMealPresetModal);

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
     
var newRoutineBtn = document.getElementById("new-routine-btn");
    if (newRoutineBtn) newRoutineBtn.onclick = function(){ openRoutineBuilder(); };

    var saveRoutineBtn = document.getElementById("save-routine-from-day");
    if (saveRoutineBtn) saveRoutineBtn.onclick = function(){ saveDayAsRoutine(selDate); };

    document.querySelectorAll(".routine-edit").forEach(function(btn){
      btn.onclick = function(){
        var id = this.getAttribute("data-id");
        if (id) openRoutineBuilder(id);
      };
    });

    document.querySelectorAll(".routine-apply").forEach(function(btn){
      btn.onclick = function(){
        var id = this.getAttribute("data-id");
        if (id) applyRoutineToDate(id, selDate);
      };
    });
    document.querySelectorAll(".routine-acc-head").forEach(function(btn){
       btn.onclick = function(){
        var id = this.getAttribute("data-id");
        if (!id) return;
        planAccordionOpen[id] = !planAccordionOpen[id];
        render();
      };
    });

    document.querySelectorAll(".plan-day").forEach(function(btn){
      btn.onclick = function(){
        var dow = parseInt(this.getAttribute("data-dow"), 10);
        if (isNaN(dow)) return;
        planSelectedDow = dow;
        document.querySelectorAll('.plan-day').forEach(function(el){
          el.classList.toggle('selected', parseInt(el.getAttribute('data-dow'), 10) === dow);
        });
        var options = '<option value="">— None —</option><option value="__REST__">Rest Day</option>';
        (RLIB || []).forEach(function(r){ options += '<option value="'+esc(r.id)+'">'+esc(r.name)+'</option>'; });
        showModal('<div style="padding:4px 2px"><div style="font-size:15px;font-weight:900;margin-bottom:10px">Assign routine</div>'+
          '<select class="inp" id="plan-day-select" style="width:100%;text-align:left">'+options+'</select>'+
          '<div class="row" style="gap:8px;margin-top:12px"><button class="btn bs" id="plan-cancel" style="flex:1">Cancel</button><button class="btn bp" id="plan-save" style="flex:1">Save</button></div></div>');
        var sel = document.getElementById('plan-day-select');
        if (sel) sel.value = RSCHED[String(dow)] || '';
        var cancelBtn = document.getElementById('plan-cancel');
        if (cancelBtn) cancelBtn.onclick = function(){ closeModal(); render(); };
        var saveBtn = document.getElementById('plan-save');
        if (saveBtn) saveBtn.onclick = function(){
          var picked = (document.getElementById('plan-day-select') || {}).value || '';
          if (picked) RSCHED[String(dow)] = picked;
          else delete RSCHED[String(dow)];
          saveAll();
          closeModal();
          render();
        };
      };
    });

    document.querySelectorAll(".routine-plan-picker").forEach(function(btn){
      btn.onclick = function(){
        var id = this.getAttribute("data-id");
        if (!id) return;
        showModal('<div style="padding:4px 2px"><div style="font-size:15px;font-weight:900;margin-bottom:10px">Assign to day</div>'+
          '<div class="plan-assign-grid">'+
          '<button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="1">Mon</button><button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="2">Tue</button><button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="3">Wed</button><button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="4">Thu</button><button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="5">Fri</button><button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="6">Sat</button><button class="btn bs plan-assign-day" data-id="'+esc(id)+'" data-day="0">Sun</button>'+
          '</div><button class="btn bs" id="plan-close" style="width:100%;margin-top:10px">Done</button></div>');
        var closeBtn = document.getElementById('plan-close');
        if (closeBtn) closeBtn.onclick = closeModal;
        document.querySelectorAll('.plan-assign-day').forEach(function(dayBtn){
          dayBtn.onclick = function(){
            var rid = this.getAttribute('data-id');
            var day = this.getAttribute('data-day');
            if (!rid || day === null) return;
            RSCHED[String(day)] = rid;
            saveAll();
            this.classList.add('on');
          };
        });
      };
    });
    document.querySelectorAll(".routine-del").forEach(function(btn){
      btn.onclick = function(){
        var id = this.getAttribute("data-id");
        if (!id) return;
        if ((id || "").indexOf("r_") !== 0 || id === "r_push" || id === "r_pull" || id === "r_legs" || id === "r_full") {
          return alert("Default routines cannot be deleted.");
        }
        if (!confirm("Delete this routine?")) return;
        RLIB = RLIB.filter(function(r){ return r.id !== id; });
        Object.keys(RSCHED).forEach(function(k){ if (RSCHED[k] === id) delete RSCHED[k]; });
        saveAll();
        render();
      };
    });

     var prFilterSelect = document.getElementById("pr-filter-select");
    if (prFilterSelect) prFilterSelect.onchange = function(){
      PROG_PR_FILTER = Array.prototype.slice.call(this.selectedOptions || []).map(function(opt){
        return opt.value;
      });
      saveAll();
      render();
    };
    var prAll = document.getElementById("pr-filter-all");
    if (prAll) prAll.onclick = function(){
      PROG_PR_FILTER = Object.keys(PR).sort(function(a,b){ return (PR[b].e1rm||0)-(PR[a].e1rm||0); });
      saveAll();
      render();
    };
    var prNone = document.getElementById("pr-filter-none");
    if (prNone) prNone.onclick = function(){
      PROG_PR_FILTER = [];
      saveAll();
      render();
    };
document.querySelectorAll(".food-del").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        if (isNaN(i)) return;
        if (!NLOG[selDate]) return;
        NLOG[selDate].splice(i, 1);
                 refreshDailyNutritionCache(selDate);
        saveAll();
        render();
      };
    });
var saveSocialName = document.getElementById("save-social-name");
    if (saveSocialName) saveSocialName.onclick = function(){
      var name = ((document.getElementById("social-name")||{}).value || "").trim();
       var handle = ((document.getElementById("social-handle")||{}).value || "").trim();
      var bio = ((document.getElementById("social-bio")||{}).value || "").trim();
      var cleanHandle = normalizeHandle(handle);
       SOC.profileName = name || "You";
      SOC.handle = cleanHandle ? ("@" + cleanHandle) : "";
      SOC.bio = bio;
      if (socialReady()) {
        ensureSocialProfile().then(function(){
          return loadSocialGraph();
        }).finally(function(){
          saveAll();
          render();
        });
        return;
      } 
       saveAll();
      render();
    };

     function sendRealFriendRequest(inputValue) {
      if (!socialReady()) return Promise.resolve(false);
      var uid = myUserId();
    var q = String(inputValue || "").trim();
      if (!q) return Promise.resolve(false)
      var clean = normalizeHandle(q);
      if (!clean) return Promise.resolve(false);
         
        var pickBestHandleMatch = function(rows, cleanHandle) {
        var best = null;
        var wanted = normalizeHandle(cleanHandle);
        (rows || []).forEach(function(row){
          if (!row || !row.id) return;
          if (!best) best = row;
          var rowHandle = normalizeHandle(row.handle || "");
          if (rowHandle && rowHandle === wanted) best = row;
        });
        return best;
      };

      var lookupByHandle = function(handleValue) {
        return sb.from("profiles").select("id,display_name,handle").ilike("handle", handleValue).limit(20).then(function(res){
           if (res && res.error) throw res.error;
          return pickBestHandleMatch(res.data, clean);
        });
      };
        
      var lookup = function() {
        if (socialSupportsHandle) {
 var patterns = [clean, "@" + clean, "%" + clean + "%", "%@" + clean + "%"];
          var found = null;
          var i = 0;
          var run = function() {
            if (found || i >= patterns.length) return Promise.resolve(found);
            var pat = patterns[i++];
            return lookupByHandle(pat).then(function(row){
              if (row) found = row;
              return run();
            });
          };
          return run().catch(function(err){
            if (isMissingHandleColumnError(err)) {
              socialSupportsHandle = false;
              return lookup();
            }
            throw err;
          });
        }
              return sb.from("profiles").select("id,display_name").ilike("display_name", "%" + q + "%").limit(10).then(function(res){
          if (res && res.error) throw res.error;
          return (res.data && res.data[0]) ? res.data[0] : null;
        });
      };

      return ensureSocialProfile().then(function(){
         return lookup();
      }).then(function(target){
        if (!target) throw new Error("No user found for that handle. Ask them to save their Social profile handle first.");
        if (target.id === uid) throw new Error("You cannot send a friend request to yourself.");
        return sb.from("friendships").select("user_id,friend_id").eq("user_id", uid).eq("friend_id", target.id).maybeSingle().then(function(frRes){
          if (frRes && frRes.error && frRes.error.code !== "PGRST116") throw frRes.error;
          if (frRes && frRes.data) throw new Error("You are already friends with this user.");
          return sb.from("friend_requests").select("id").eq("requester_id", uid).eq("addressee_id", target.id).eq("status", "pending").maybeSingle();
        }).then(function(existingOut){
          if (existingOut && existingOut.error && existingOut.error.code !== "PGRST116") throw existingOut.error;
          if (existingOut && existingOut.data) throw new Error("Friend request already sent.");
          return sb.from("friend_requests").select("id").eq("requester_id", target.id).eq("addressee_id", uid).eq("status", "pending").maybeSingle();
        }).then(function(existingIn){
          if (existingIn && existingIn.error && existingIn.error.code !== "PGRST116") throw existingIn.error;
          if (existingIn && existingIn.data) throw new Error("This user already sent you a request — accept it from Pending requests.");
          return sb.from("friend_requests").insert({ requester_id: uid, addressee_id: target.id, status: "pending" });
        });
      }).then(function(ins){
        if (ins && ins.error) throw ins.error;
        return loadSocialGraph().then(function(){ return true; });
      });
    }
     
    var addFriendBtn = document.getElementById("add-friend-btn");
    if (addFriendBtn) addFriendBtn.onclick = function(){
       var handleInput = ((document.getElementById("friend-handle")||{}).value || "").trim();
       if (!handleInput) return alert("Enter a user handle (example: @alex).");
      if (!socialReady()) return alert("Sign in first to send real friend requests.");
      sendRealFriendRequest(handleInput).then(function(ok){
        if (ok) {
          alert("Friend request sent.");
          render();
     }
          }).catch(function(err){
        alert((err && err.message) ? err.message : "Could not send friend request.");
      });
    };

     document.querySelectorAll(".accept-request").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        if (isNaN(i)) return;
        var rq = (SOC.requests || [])[i];
        if (!rq) return;
        if (socialReady() && rq.user_id) {
          var uid = myUserId();
var rqId = parseInt(rq.id, 10);
          var acceptQuery = sb.from("friend_requests").update({ status: "accepted" }).eq("addressee_id", uid);
          if (!isNaN(rqId)) {
            acceptQuery = acceptQuery.eq("id", rqId);
          } else {
            acceptQuery = acceptQuery.eq("requester_id", rq.user_id).eq("status", "pending");
          }
          acceptQuery.then(function(res){
           if (res && res.error) throw res.error;
            return sb.from("friendships").upsert(
               { user_id: uid, friend_id: rq.user_id },
              { onConflict: "user_id,friend_id" }
            );
          }).then(function(up){
            if (up && up.error) throw up.error;
            return loadSocialGraph();
          }).then(function(){
            render();
          }).catch(function(err){
            alert((err && err.message) ? err.message : "Could not accept request.");
          });
          return;
        }
        alert("Sign in to accept real friend requests.");
      };
    });

    document.querySelectorAll(".decline-request").forEach(function(btn){
      btn.onclick = function(){
        var i = parseInt(this.getAttribute("data-i"), 10);
        if (isNaN(i)) return;
        var rq = (SOC.requests || [])[i];
if (!rq) return;

        var rqId = parseInt(rq.id, 10);
        var isLegacyLocalRequest = isNaN(rqId) && !rq.user_id;
        if (isLegacyLocalRequest) {
          SOC.requests.splice(i, 1);
          saveAll();
          render();
          alert("Removed old offline friend request.");
          return;
        }

        if (socialReady() && rq.id) {
         var uid = myUserId();
var declineQuery = sb.from("friend_requests").update({ status: "declined" }).eq("addressee_id", uid);
          if (!isNaN(rqId)) {
            declineQuery = declineQuery.eq("id", rqId);
          } else if (rq.user_id) {
            declineQuery = declineQuery.eq("requester_id", rq.user_id).eq("status", "pending");
          } else {
            SOC.requests.splice(i, 1);
            saveAll();
            render();
            alert("Removed old offline friend request.");
            return;
          }
          declineQuery.then(function(res){
            if (res && res.error) throw res.error;
            return sb.from("friendships").delete().eq("user_id", fr.id).eq("friend_id", uid);
          }).then(function(res2){
            if (res2 && res2.error) throw res2.error;
            return loadSocialGraph();
          }).then(function(){ render(); }).catch(function(err){
            alert((err && err.message) ? err.message : "Could not remove friend.");
          });
          return;
        }
        if (fr && SOC.messages) delete SOC.messages[fr.id]; 
        SOC.friends.splice(i, 1);
        saveAll();
        render();
      };
    });

    document.querySelectorAll(".social-lift").forEach(function(btn){
      btn.onclick = function(){
        SOC.leaderboardLift = this.getAttribute("data-lift") || "Bench Press";
        saveAll();
        render();
      };
    });

    var sendMsgBtn = document.getElementById("send-msg-btn");
    if (sendMsgBtn) sendMsgBtn.onclick = function(){
      var fid = ((document.getElementById("msg-friend")||{}).value || "").trim();
      var body = ((document.getElementById("msg-body")||{}).value || "").trim();
      if (!fid) return alert("Pick a friend to message.");
      if (!body) return alert("Write a message first.");
      if (socialReady()) {
        sb.from("messages").insert({ sender_id: myUserId(), recipient_id: fid, body: body }).then(function(res){
          if (res && res.error) throw res.error;
          return loadSocialGraph();
        }).then(function(){ render(); }).catch(function(err){
          alert((err && err.message) ? err.message : "Could not send message.");
        });
        return;
      }
      SOC.messages = SOC.messages || {};
      SOC.messages[fid] = SOC.messages[fid] || [];
      SOC.messages[fid].push({ from: SOC.profileName || "You", text: body, at: Date.now() });
      SOC.messages[fid] = SOC.messages[fid].slice(-30);
      saveAll();
      render();
    };

    function createPostAndRefresh(kind, txt, dateVal) {
      if (socialReady()) {
        return sb.from("social_posts").insert({
          user_id: myUserId(),
          type: kind,
          body: txt,
          post_date: dateVal || tod()
        }).then(function(res){
          if (res && res.error) throw res.error;
          return loadSocialGraph();
        });
      }
      pushFeed(kind, txt, { date: dateVal || tod() });
      return Promise.resolve();
    }

    var socialShare = document.getElementById("share-social-summary");
    if (socialShare) socialShare.onclick = function(){
      var me = mySocialSnapshot();
      var top = (me.prs || []).slice(0, 3).map(function(x){ return x.exercise + " " + x.e1rm; }).join(" · ");
     var txt = "Profile snapshot: " + me.workouts + " workouts, " + Math.round(toDisplayWeight(me.volume)) + " "+weightUnitLabel()+" volume, " + me.sets + " sets." + (top ? " Top PRs: " + top : "");
      createPostAndRefresh("profile", txt, tod()).then(function(){ saveAll(); render(); }).catch(function(err){ alert((err && err.message) ? err.message : "Could not share profile."); });
    };

  var shareWorkoutPost = document.getElementById("share-workout-post");
    if (shareWorkoutPost) shareWorkoutPost.onclick = function(){
      var txt = createPostText("workout");
      if (!txt) return alert("Log a workout for the selected day first.");
      createPostAndRefresh("workout", txt, selDate).then(function(){ saveAll(); render(); }).catch(function(err){ alert((err && err.message) ? err.message : "Could not share workout."); });
    };

    var shareMealPost = document.getElementById("share-meal-post");
    if (shareMealPost) shareMealPost.onclick = function(){
      var txt = createPostText("meal");
      if (!txt) return alert("Log food for the selected day first.");
      createPostAndRefresh("meal", txt, selDate).then(function(){ saveAll(); render(); }).catch(function(err){ alert((err && err.message) ? err.message : "Could not share meal."); });
    };

    var sharePrPost = document.getElementById("share-pr-post");
    if (sharePrPost) sharePrPost.onclick = function(){
      var txt = createPostText("pr");
      if (!txt) return alert("Log some strength PRs first.");
      createPostAndRefresh("pr", txt, tod()).then(function(){ saveAll(); render(); }).catch(function(err){ alert((err && err.message) ? err.message : "Could not share PR."); });
    };

    var msgFriendSel = document.getElementById("msg-friend");
    var msgThread = document.getElementById("msg-thread");
    function renderMsgThread() {
      if (!msgFriendSel || !msgThread) return;
      var fid = msgFriendSel.value;
      if (!fid) {
        msgThread.innerHTML = '<div style="font-size:10px;color:var(--mt)">Pick a friend to view recent messages.</div>';
        return;
      }
      var logs = (SOC.messages && SOC.messages[fid]) ? SOC.messages[fid] : [];
      if (!logs.length) {
        msgThread.innerHTML = '<div style="font-size:10px;color:var(--mt)">No messages yet. Start the conversation.</div>';
        return;
      }
      msgThread.innerHTML = logs.slice(-8).map(function(m){
        return '<div class="rec-item" style="margin-bottom:5px"><div><strong>'+esc(m.from || "Athlete")+'</strong><div style="font-size:11px">'+esc(m.text || "")+'</div></div></div>';
      }).join('');
    }
    if (msgFriendSel) {
      msgFriendSel.onchange = renderMsgThread;
      renderMsgThread();
    }

    var saveSet = document.getElementById("save-settings");
    if (saveSet) saveSet.onclick = function(){
      var sess = parseInt((document.getElementById("set-sess")||{}).value, 10);
      var steps = parseInt((document.getElementById("set-steps")||{}).value, 10);
      if (!isNaN(sess)) USER.sessionsPerWeek = Math.max(0, Math.min(14, sess));
      if (!isNaN(steps)) USER.stepsPerDay = Math.max(0, Math.min(30000, steps));
      USER.goalMode = ((document.getElementById("set-goal")||{}).value || "cut");
      USER.goalPace = ((document.getElementById("set-goal-pace")||{}).value || "moderate");
      USER.cutAggressiveness = USER.goalPace;
     
       saveAll();
      alert("Saved!");
      render();
    };

    var exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.onclick = function(){
var data = { W:W, BW:BW, PR:PR, NLOG:NLOG, DN_CACHE:DN_CACHE, NFOODS:NFOODS, USER:USER, TH:TH, SOC:SOC, RLIB:RLIB, RSCHED:RSCHED };
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
                     if (data.DN_CACHE) DN_CACHE = data.DN_CACHE;
          if (data.NFOODS) NFOODS = data.NFOODS;
          if (data.USER) USER = data.USER;
                     sanitizeWorkoutState();
          sanitizeNutritionState();
          if (data.TH) TH = data.TH;
           if (data.SOC) SOC = normalizeSOC(data.SOC);
          if (data.RLIB) RLIB = data.RLIB;
          if (data.RSCHED) RSCHED = data.RSCHED;
          normalizeRoutines();
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
 W = {}; BW = {}; PR = {}; NLOG = {}; DN_CACHE = {}; SOC = normalizeSOC(); RLIB = DEFAULT_ROUTINES.slice(); RSCHED = {};
       sanitizeWorkoutState();
       sanitizeNutritionState();
      saveAll();
      render();
    };
  }

  document.querySelectorAll(".nb").forEach(function(btn){
    btn.classList.toggle("on", (btn.getAttribute("data-v") === view));
  });

  applyTheme();
    sanitizeWorkoutState();
   sanitizeNutritionState();
normalizeRoutines();  
saveAll();
   initAuth();
  render();
   // Expose render + addFoodEntry for module bridging
window._ilRender = function() { render(); };

window._IronLogApp = {
  addFoodEntry: function(logEntry) {
    if (!logEntry) return;
    ensureDay(selDate);

    // Enrich the entry with an id if missing
    if (!logEntry.id) logEntry.id = uid();
    if (!logEntry.at)  logEntry.at  = Date.now();

    NLOG[selDate].push(logEntry);
         refreshDailyNutritionCache(selDate);
    saveAll();
    render();
  },

  getSelDate:    function() { return selDate; },
  getNutritionGoals: function() { return calcAutoGoals(); },
  getDayTotals:  function(ds) { return dayNutrition(ds || selDate).totals; }
};
});
