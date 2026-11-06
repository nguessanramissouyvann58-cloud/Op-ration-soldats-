(()=>{
const $=id=>document.getElementById(id);
const defs={
 barracks:{name:'Caserne',emoji:'🏠',cost:300},gym:{name:'Centre physique',emoji:'🏃',cost:400},
 school:{name:'Centre de formation',emoji:'🎓',cost:400},clinic:{name:'Infirmerie',emoji:'🏥',cost:350},
 garage:{name:'Garage',emoji:'🚙',cost:450},command:{name:'Quartier général',emoji:'🏢',cost:500}
};
const defaultState=()=>({day:1,money:5000,soldiers:8,morale:80,endurance:20,training:20,health:100,xp:0,buildings:{},completed:[],logs:['Bienvenue, Commandant ! Ta base vient d’être créée.']});
let state=defaultState(),selected=null,toastTimer;
const plots=Array.from({length:16},(_,i)=>({id:i,row:Math.floor(i/4),col:i%4}));
function count(type){return Object.values(state.buildings).filter(x=>x===type).length}
function log(msg){state.logs.unshift(msg);state.logs=state.logs.slice(0,6);showToast(msg);render()}
function showToast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300)}
function renderPlots(){
 const root=$('plots');root.innerHTML='';
 plots.forEach(p=>{
  const x=50+(p.col-p.row)*11.5,y=22+(p.col+p.row)*13.2;
  const type=state.buildings[p.id],button=document.createElement('button');
  button.className='plot '+(type?'built':'empty')+(selected===p.id?' selected':'');
  button.style.left=x+'%';button.style.top=y+'%';
  button.innerHTML='<span class="ground"></span>'+(type?'<span class="building">'+defs[type].emoji+'</span><span class="name">'+defs[type].name+'</span>':'<span class="name">＋ Construire</span>');
  button.setAttribute('aria-label',type?defs[type].name:'Parcelle libre');
  button.addEventListener('click',()=>{
   if(type){showToast(defs[type].name+' : bâtiment opérationnel.');return}
   if(!selectedType){showToast('Choisis d’abord un bâtiment dans le menu Construire.');return}
   const d=defs[selectedType];if(state.money<d.cost){showToast('Crédits insuffisants.');return}
   state.money-=d.cost;state.buildings[p.id]=selectedType;const name=d.name;selectedType=null;selected=null;log(name+' construit avec succès !');
  });
  root.appendChild(button);
 });
}
let selectedType=null;
function renderChoices(){
 const root=$('buildingChoices');root.innerHTML='';
 Object.entries(defs).forEach(([key,d])=>{
  const b=document.createElement('button');b.className='buildchoice'+(selectedType===key?' selected':'');
  b.innerHTML='<span>'+d.emoji+'</span>'+d.name+'<br><small>'+d.cost.toLocaleString('fr-FR')+' crédits</small>';
  b.addEventListener('click',()=>{selectedType=key;$('buildHint').textContent='Sélectionné : '+d.name+'. Touche une parcelle libre sur la carte.';renderChoices();renderPlots()});
  root.appendChild(b);
 });
}
function renderMissions(){
 const missions=[
  {id:'relief',name:'Aide aux populations',desc:'Distribuer des ressources dans une zone isolée.',req:4,need:'command'},
  {id:'rescue',name:'Recherche et sauvetage',desc:'Organiser une opération de secours après une catastrophe.',req:8,need:'clinic'},
  {id:'convoy',name:'Convoi humanitaire',desc:'Acheminer du matériel vers un village isolé.',req:14,need:'garage'}
 ];
 const root=$('missions');root.innerHTML='';
 missions.forEach(m=>{
  const ready=state.soldiers>=Math.ceil(m.req/2)&&state.endurance+state.training+state.xp>=m.req*3&&count(m.need)>0;
  const done=state.completed.includes(m.id),el=document.createElement('div');el.className='mission';
  el.innerHTML='<strong>'+(done?'✅ ':ready?'🟢 ':'🔒 ')+m.name+'</strong><p>'+m.desc+'</p><p>Équipe : '+m.req+' points de préparation · '+(done?'Terminée':ready?'Prête':'Formation ou infrastructure requise')+'</p>';
  const b=document.createElement('button');b.textContent=done?'Mission terminée':ready?'Lancer la mission':'Préparation insuffisante';b.disabled=!ready||done;
  b.addEventListener('click',()=>{state.completed.push(m.id);state.xp+=5;state.money+=250;state.morale=Math.min(100,state.morale+4);log('Mission « '+m.name+' » accomplie ! +250 crédits et +5 expérience.');});
  el.appendChild(b);root.appendChild(el);
 });
}
function render(){
 $('money').textContent=state.money.toLocaleString('fr-FR');$('soldiers').textContent=state.soldiers;$('morale').textContent=state.morale+'%';$('day').textContent=String(state.day).padStart(2,'0');
 $('endurance').textContent=state.endurance;$('training').textContent=state.training;$('health').textContent=state.health+'%';$('xp').textContent=state.xp;
 const objectiveCount=Number(count('barracks')>0)+Number(count('gym')>0);
 $('objectiveProgress').textContent=objectiveCount+' / 2 infrastructures construites';
 $('objective').textContent=objectiveCount===2?'Objectif initial accompli : développe ta base !':'Construire une caserne et un centre physique';
 $('trainingInfo').textContent='Centre physique : '+count('gym')+' · Centre de formation : '+count('school')+' · Infirmerie : '+count('clinic');
 $('log').innerHTML=state.logs.map(x=>'<div>• '+x.replace(/</g,'&lt;')+'</div>').join('');
 renderChoices();renderPlots();renderMissions();
}
$('recruit').addEventListener('click',()=>{if(!count('barracks'))return showToast('Construis une caserne avant de recruter.');if(state.money<100)return showToast('Crédits insuffisants.');if(state.soldiers>=60)return showToast('Capacité maximale atteinte.');state.money-=100;state.soldiers++;log('Un nouveau soldat rejoint l’académie.');});
$('train').addEventListener('click',()=>{if(!count('gym')&&!count('school'))return showToast('Construis un centre d’entraînement.');if(state.money<50)return showToast('Crédits insuffisants.');state.money-=50;state.endurance+=count('gym')*2;state.training+=count('school')*2;state.morale=Math.min(100,state.morale+1);log('Entraînement collectif terminé : les capacités progressent.');});
$('nextDay').addEventListener('click',()=>{state.day++;state.money+=150+count('command')*50;state.endurance+=count('gym');state.training+=count('school');state.health=Math.min(100,state.health+count('clinic')*2);state.morale=Math.min(100,state.morale+1);log('Jour '+state.day+' : production et entraînement quotidiens effectués.');});
function save(){try{localStorage.setItem('operationSoldatSaveV1',JSON.stringify(state));$('saveStatus').textContent='Partie sauvegardée sur cet appareil ✓';showToast('Sauvegarde effectuée !')}catch(e){showToast('Sauvegarde indisponible dans ce navigateur.')}}
$('save').addEventListener('click',save);
$('reset').addEventListener('click',()=>{if(!confirm('Recommencer une nouvelle partie ? La sauvegarde actuelle sera remplacée.'))return;state=defaultState();selectedType=null;selected=null;save();render();showToast('Nouvelle base créée. Bon commandement !')});
try{const raw=localStorage.getItem('operationSoldatSaveV1');if(raw){const parsed=JSON.parse(raw);if(parsed&&parsed.buildings&&Number.isFinite(parsed.money))state=parsed}}catch(e){}
render();
})();