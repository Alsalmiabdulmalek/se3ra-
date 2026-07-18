import { validateNutrition, scaleNutrition, autoTargets, emptyMicros } from './nutrients.js';
import { searchIngredients, getIngredient, normalize, INGREDIENTS } from './ingredients.js';
import { setLang, plural, t, STR_KEYS } from './i18n.js';
import { mergeStates } from './cloud.js';

let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log('  ✗',m);} };
const near=(a,b,e=0.5)=>Math.abs(a-b)<=e;

// validateNutrition clamps
let v = validateNutrition({calories:-5, protein:10, carbs:20, fat:5, micros:{satfat:99, sugar:99, sodium:-10}});
ok(v.calories===0,'neg calories -> 0');
ok(v.micros.satfat<=v.fat,'satfat clamped to fat');
ok(v.micros.sugar<=v.carbs,'sugar clamped to carbs');
ok(v.micros.sodium===0,'neg sodium -> 0');

// scaleNutrition proportional
const base={calories:100,protein:10,carbs:20,fat:5,micros:{sodium:200,fiber:4}};
const s=scaleNutrition(base,2.5);
ok(near(s.calories,250),'scale calories x2.5');
ok(near(s.micros.sodium,500),'scale micro sodium x2.5');
ok(near(s.protein,25),'scale protein x2.5');

// search ranking: بيض (egg) must beat سمك أبيض (white fish contains بيض mid-word)
const r = searchIngredients('بيض','all',[]);
const eggIdx = r.findIndex(x=>x.id==='egg');
const fishIdx = r.findIndex(x=>x.id==='tilapia_ckd');
ok(eggIdx>-1,'egg found for بيض');
ok(eggIdx < fishIdx || fishIdx===-1,'egg ranks above white fish for بيض');

// raw & cooked both present
ok(getIngredient('rice_w_raw')&&getIngredient('rice_w_ckd'),'rice raw+cooked present');
ok(getIngredient('ck_breast_raw')&&getIngredient('ck_breast_ckd'),'chicken raw+cooked present');

// egg has unit (per-piece logging), per-100g values
const egg=getIngredient('egg');
ok(egg.unit&&egg.unit.g===50,'egg unit 50g');
ok(egg.calories>120&&egg.calories<160,'egg per-100g calories ~143 ('+egg.calories+')');

// normalize
ok(normalize('أبيض')===normalize('ابيض'),'alef hamza normalized');
ok(normalize('طماطة')===normalize('طماطه'),'ta marbuta normalized');

// i18n plural (Arabic)
setLang('ar');
ok(plural('meal',1).includes('وجبة'),'ar 1 -> وجبة ('+plural('meal',1)+')');
ok(plural('meal',2).includes('وجبتان'),'ar 2 -> وجبتان ('+plural('meal',2)+')');
ok(plural('meal',5).includes('وجبات'),'ar 5 -> وجبات ('+plural('meal',5)+')');
ok(plural('day',11).length>0,'ar 11 days ok ('+plural('day',11)+')');
setLang('en');
ok(plural('meal',1)==='1 meal','en 1 meal');
ok(plural('meal',3)==='3 meals','en 3 meals');

// i18n key parity ar/en (spot check none missing translation)
setLang('ar'); const arMiss = STR_KEYS.filter(k=>!t(k)||t(k)===k);
ok(arMiss.length===0,'all AR keys resolve ('+arMiss.slice(0,5)+')');

// autoTargets: male 25y 175cm 70kg moderate maintain
const at = autoTargets({age:25,sex:'male',heightCm:175,weightKg:70,activity:'moderate',goal:'maintain'});
// BMR=10*70+6.25*175-5*25+5=700+1093.75-125+5=1673.75 ; TDEE=*1.55=2594.3 -> round10
ok(near(at.calories,2590,15),'auto calories ~2590 ('+at.calories+')');
ok(at.protein===112,'auto protein 1.6*70=112 ('+at.protein+')');
ok(at.micro.sodium===2300,'auto sodium fixed 2300');
ok(at.micro.iron===8,'auto iron male 8');
const atF = autoTargets({age:30,sex:'female',heightCm:165,weightKg:60,activity:'light',goal:'lose'});
ok(atF.micro.iron===18,'auto iron female<51 =18');
ok(atF.calories>=1200,'auto calories floor 1200 ('+atF.calories+')');

// label per-serving -> per-100g conversion sanity (simulate)
// serving 28g, 120 kcal per serving -> per100g = 120*100/28 = 428.6
const f=100/28; ok(near(120*f,428.6,1),'per-serving->per100g math');

// mergeStates union by id
const a={settings:{_updated:100,ai:{keys:{claude:'K'}}},days:{'2026-07-15':{meals:[{id:'m1',calories:100}]}},weights:[{id:'w1',kg:70}],favorites:[],customIngredients:[]};
const bb={settings:{_updated:200,ai:{keys:{}}},days:{'2026-07-15':{meals:[{id:'m2',calories:200}]}},weights:[{id:'w1',kg:70},{id:'w2',kg:69}],favorites:[],customIngredients:[]};
const mg=mergeStates(a,bb);
ok(mg.days['2026-07-15'].meals.length===2,'merge unions meals by id ('+mg.days['2026-07-15'].meals.length+')');
ok(mg.weights.length===2,'merge dedupes weights by id ('+mg.weights.length+')');
ok(mg.settings._updated===200,'merge newest settings win');
ok(mg.settings.ai.keys.claude==='K','merge keeps local api keys');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
