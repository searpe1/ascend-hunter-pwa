import { CLASSES, DUNGEON_RANKS } from './data.js';
import { ATTR_LABELS, activeDungeon, applyDungeonPenalty, canChooseClass, chooseClass, combatStep, completeDaily, createCombat, effectiveDayKey, ensureDaily, equipItem, expireDaily, formatDuration, getPlayerPower, missionReady, nextReset, playerRank, resolveDungeonWin, spendAttributePoint, startDaily, unequipItem, unlockDungeon, updateExercise } from './game.js';
import { loadState, resetState, saveState } from './state.js';

let state = loadState();
let combat = null;
let combatTimer = null;
const main = document.getElementById('mainContent');
const modal = document.getElementById('modalRoot');
const toasts = document.getElementById('toastRoot');

ensureDaily(state); expireDaily(state); bindChrome();
state.initialized ? render() : onboarding();
setInterval(tick, 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);

function bindChrome() {
  document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => { state.ui.activeView = b.dataset.view; save(); render(); });
  document.getElementById('profileButton').onclick = () => { state.ui.activeView = 'character'; save(); render(); };
  document.getElementById('soundButton').onclick = () => { state.settings.sound = !state.settings.sound; save(); chrome(); tone(560); toast(`Sonido ${state.settings.sound ? 'activado' : 'desactivado'}`); };
}
function tick() {
  if (ensureDaily(state) || expireDaily(state)) { save(); render(); }
  const el = document.querySelector('[data-live-timer]');
  if (el && state.daily.status === 'active') el.textContent = formatDuration(new Date(state.daily.deadline) - new Date());
  const reset = document.querySelector('[data-reset-timer]');
  if (reset) reset.textContent = formatDuration(nextReset() - new Date());
}
function save() { saveState(state); }
function chrome() {
  const name = state.player.name || 'Cazador';
  document.getElementById('topPlayerName').textContent = name;
  document.getElementById('avatarInitial').textContent = name[0].toUpperCase();
  document.getElementById('topRank').textContent = `RANGO ${playerRank(state.player.level)}`;
  document.getElementById('soundButton').textContent = state.settings.sound ? '♪' : '×';
}
function render() {
  chrome();
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === state.ui.activeView));
  ({ mission: missionView, dungeons: dungeonView, character: characterView, inventory: inventoryView }[state.ui.activeView] || missionView)();
}
function hero() {
  const p = state.player;
  return `<section class="hero"><div><small>ESTADO DEL CAZADOR</small><h1>${esc(p.name)}</h1><p>${CLASSES[p.classId].name} · Poder ${getPlayerPower(p)} · Rango ${playerRank(p.level)}</p></div><div class="level"><span>NIVEL</span><strong>${p.level}</strong></div></section>`;
}
function missionView() {
  const d = state.daily;
  let body = '';
  if (d.status === 'available') body = `<div class="timer">02:00:00</div><p>El límite comienza al aceptar.</p>${exerciseRows(false)}<button id="start" class="primary">ACEPTAR MISIÓN</button>`;
  else if (d.status === 'active') body = `<div class="timer" data-live-timer>${formatDuration(new Date(d.deadline)-new Date())}</div><p>Completa todos los objetivos antes de que termine el tiempo.</p>${exerciseRows(true)}<button id="complete" class="primary" ${missionReady(state)?'':'disabled'}>COMPLETAR Y RECLAMAR</button>`;
  else if (d.status === 'completed') body = `<div class="timer success">COMPLETADA</div><p>Nueva misión en <span data-reset-timer>${formatDuration(nextReset()-new Date())}</span></p><div class="cards"><article><span>Ascenso</span><b>+1 nivel</b></article><article><span>Regalo</span><b>${esc(d.reward?.label||'Recompensa')}</b></article><article><span>Llave</span><b>${d.reward?.keyFound?'ENCONTRADA':'No'}</b></article></div>`;
  else body = `<div class="timer danger">FALLIDA</div><p>Se renovará a las 07:00. <span data-reset-timer></span></p>${exerciseRows(false)}`;
  main.innerHTML = `${hero()}<header class="section"><h2>MISIÓN DIARIA</h2><span>${effectiveDayKey()}</span></header><section class="panel"><small>OBJETIVO OBLIGATORIO</small><h2>Forja del cuerpo</h2>${body}</section><header class="section"><h2>RECURSOS</h2></header><div class="cards"><article><span>Llaves</span><b>${state.player.keys}</b></article><article><span>Créditos</span><b>${state.player.gold}</b></article><article><span>Pociones</span><b>${state.player.potions}</b></article><article><span>Puntos</span><b>${state.player.attributePoints}</b></article></div>`;
  document.getElementById('start')?.addEventListener('click',()=>{startDaily(state);save();tone(520);render();toast('La cuenta atrás ha comenzado');});
  document.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{updateExercise(state,b.dataset.ex,+b.dataset.delta);save();missionView();});
  document.getElementById('complete')?.addEventListener('click',()=>{const r=completeDaily(state);if(r){save();render();message('MISIÓN COMPLETADA',`Subes un nivel.<br>Recompensa: <b>${esc(r.label)}</b> × ${r.amount}.${r.keyFound?'<br><b class="success">Has conseguido una llave.</b>':''}`);}});
}
function exerciseRows(active) {
  return `<div class="list">${state.daily.exercises.map(x=>`<article class="row"><div><b>${x.name}</b><span>${active?`Objetivo: ${x.target}`:`${x.target} ${x.unit}`} · ${ATTR_LABELS[x.attr]}</span></div>${active?`<div class="counter"><button data-ex="${x.id}" data-delta="-1">−</button><b>${x.progress}</b><button data-ex="${x.id}" data-delta="1">+</button></div>`:''}</article>`).join('')}</div>`;
}
function dungeonView() {
  const d = activeDungeon(state);
  const done = state.dungeons.filter(x=>x.status==='completed');
  main.innerHTML = `${hero()}<header class="section"><h2>PORTALES</h2><span>${state.player.keys} llaves</span></header>${d?dungeonCard(d,true):`<section class="empty"><div class="portal">⌁</div><h3>No hay portal abierto</h3><p>Usa una llave para generar una mazmorra aleatoria que permanecerá disponible hasta completarla.</p><button id="unlock" class="primary" ${state.player.keys?'':'disabled'}>USAR UNA LLAVE</button></section>`}<header class="section"><h2>COMPLETADAS</h2><span>${done.length}</span></header>${done.map(x=>dungeonCard(x,false)).join('')||'<section class="empty">Todavía no has cerrado ningún portal.</section>'}`;
  document.getElementById('unlock')?.addEventListener('click',()=>{const x=unlockDungeon(state);if(x){save();render();toast(`Portal de rango ${x.rank} detectado`);}});
  document.querySelector('[data-enter]')?.addEventListener('click',()=>startCombat(d));
  document.querySelector('[data-abandon]')?.addEventListener('click',()=>confirmBox('ABANDONAR MAZMORRA','Perderás dos niveles, dos atributos y quizá equipo.',()=>loseDungeon(d,'abandon')));
}
function dungeonCard(d,actions) {
  return `<section class="dungeon" style="--rank:${DUNGEON_RANKS[d.rank].color}"><small>RANGO ${d.rank} · ${d.status==='completed'?'COMPLETADA':'DISPONIBLE'}</small><h2>${esc(d.name)}</h2><p>Nivel ${d.level} · ${d.rooms} salas · Jefe: ${esc(d.boss.name)}</p>${actions?'<button class="primary" data-enter>ENTRAR</button><button class="dangerButton" data-abandon>ABANDONAR</button>':''}</section>`;
}
function characterView() {
  const p=state.player,c=CLASSES[p.classId];
  main.innerHTML=`${hero()}<header class="section"><h2>ATRIBUTOS</h2><span>${p.attributePoints} puntos</span></header><div class="stats">${Object.entries(p.attributes).map(([k,v])=>`<article><span>${ATTR_LABELS[k]}</span><b>${v}</b>${p.attributePoints?`<button data-stat="${k}">+</button>`:''}</article>`).join('')}</div><header class="section"><h2>CLASE</h2><span>Maestría ${p.classMastery}</span></header><section class="panel"><small>${p.classId==='unawakened'?'DESPERTAR PENDIENTE':'CLASE ACTIVA'}</small><h2>${c.name}</h2><p>${c.description}</p>${c.skills.map(s=>`<article class="skill"><b>${s.name}</b><span>${s.type}</span><p>${s.description}</p></article>`).join('')}${canChooseClass(p)?'<button id="classQuest" class="primary">ELEGIR CLASE</button>':p.level<5?'<button disabled>SE DESBLOQUEA EN NIVEL 5</button>':''}</section><button id="settings">AJUSTES Y REINICIO</button>`;
  document.querySelectorAll('[data-stat]').forEach(b=>b.onclick=()=>{spendAttributePoint(state,b.dataset.stat);save();characterView();});
  document.getElementById('classQuest')?.addEventListener('click',classModal);
  document.getElementById('settings').onclick=settingsModal;
}
function inventoryView() {
  const slots={weapon:'ARMA',armor:'ARMADURA',boots:'BOTAS',ring:'ACCESORIO'};
  main.innerHTML=`${hero()}<header class="section"><h2>EQUIPO</h2></header><div class="equipment">${Object.entries(slots).map(([s,l])=>{const i=state.player.equipment[s];return`<article><small>${l}</small><b>${i?esc(i.name):'Vacío'}</b><span>${i?`+${i.power} poder`:'Sin bonificación'}</span>${i?`<button data-unequip="${s}">QUITAR</button>`:''}</article>`}).join('')}</div><header class="section"><h2>INVENTARIO</h2><span>${state.player.inventory.length}</span></header><div class="list">${state.player.inventory.map(i=>`<article class="row"><div><b>${esc(i.name)}</b><span>Rango ${i.rank} · +${i.power} poder</span></div><button data-equip="${i.id}">EQUIPAR</button></article>`).join('')||'<section class="empty">Consigue objetos en misiones y mazmorras.</section>'}</div>`;
  document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{equipItem(state,b.dataset.equip);save();inventoryView();});
  document.querySelectorAll('[data-unequip]').forEach(b=>b.onclick=()=>{unequipItem(state,b.dataset.unequip);save();inventoryView();});
}
function startCombat(d) {
  combat=createCombat(state,d);save();
  modal.innerHTML=`<div class="backdrop"><section class="modal"><small>COMBATE AUTOMÁTICO</small><h2>${esc(d.name)}</h2><div id="arena"></div><button id="combatAbandon" class="dangerButton">ABANDONAR</button></section></div>`;
  drawCombat(); document.getElementById('combatAbandon').onclick=()=>{clearInterval(combatTimer);modal.innerHTML='';loseDungeon(d,'abandon');};
  combatTimer=setInterval(()=>{const r=combatStep(state,combat);drawCombat();tone(r.won?760:280);if(r.done){clearInterval(combatTimer);setTimeout(()=>{modal.innerHTML='';r.won?winDungeon(d):loseDungeon(d,'defeat');},500);}},850);
}
function drawCombat(){const e=combat.enemies[combat.room];document.getElementById('arena').innerHTML=`<div class="fighters"><article><div class="avatar">${esc(state.player.name[0])}</div><b>${esc(state.player.name)}</b><progress max="${combat.playerMaxHp}" value="${combat.playerHp}"></progress><span>${combat.playerHp} PS</span></article><strong>VS</strong><article><div class="avatar enemy">${e.icon}</div><b>${esc(e.name)}</b><progress max="${e.maxHp}" value="${e.hp}"></progress><span>${e.hp} PS</span></article></div><div class="log">${combat.logs.slice(-12).map(x=>`<p>${esc(x.text)}</p>`).join('')}</div>`;}
function winDungeon(d){const r=resolveDungeonWin(state,d,combat);combat=null;save();render();message('MAZMORRA COMPLETADA',`El portal se cierra para siempre.<br><b>+${r.levels} niveles</b><br>+${r.gold} créditos<br>${esc(r.item.name)}`);}
function loseDungeon(d,reason){const p=applyDungeonPenalty(state,d,reason);combat=null;save();render();message('PENALIZACIÓN',`Has perdido ${p.lostLevels} niveles. Bajan ${p.attributes.map(x=>ATTR_LABELS[x]).join(' y ')}.${p.lostItem?`<br>Equipo perdido: ${esc(p.lostItem.name)}`:''}<br>El portal sigue abierto.`);}
function classModal(){const options=Object.values(CLASSES).filter(x=>x.id!=='unawakened');modal.innerHTML=`<div class="backdrop"><section class="modal"><button data-close>×</button><small>MISIÓN DE CLASE</small><h2>Elige tu senda</h2>${options.map(x=>`<article class="classChoice"><h3>${x.name}</h3><p>${x.description}</p><button data-class="${x.id}">ELEGIR</button></article>`).join('')}</section></div>`;modal.querySelector('[data-close]').onclick=close;modal.querySelectorAll('[data-class]').forEach(b=>b.onclick=()=>{if(chooseClass(state,b.dataset.class)){save();close();render();toast('Clase desbloqueada');}});}
function settingsModal(){modal.innerHTML=`<div class="backdrop"><section class="modal"><button data-close>×</button><h2>Ajustes</h2><label><input id="sound" type="checkbox" ${state.settings.sound?'checked':''}> Sonido</label><p>El progreso se guarda en este dispositivo.</p><button id="reset" class="dangerButton">BORRAR PROGRESO</button></section></div>`;modal.querySelector('[data-close]').onclick=close;document.getElementById('sound').onchange=e=>{state.settings.sound=e.target.checked;save();chrome();};document.getElementById('reset').onclick=()=>confirmBox('BORRAR PROGRESO','Esta acción no se puede deshacer.',()=>{state=resetState();close();onboarding();});}
function onboarding(){const t=document.getElementById('onboardingTemplate');modal.innerHTML='<div class="backdrop onboardingBack"></div>';modal.firstChild.append(t.content.cloneNode(true));document.getElementById('onboardingForm').onsubmit=e=>{e.preventDefault();state.player.name=document.getElementById('onboardingName').value.trim()||'Cazador';const f=document.getElementById('onboardingFitness').value;if(f==='beginner')Object.keys(state.player.attributes).forEach(k=>state.player.attributes[k]=4);if(f==='trained')Object.keys(state.player.attributes).forEach(k=>state.player.attributes[k]=7);state.initialized=true;state.daily=null;ensureDaily(state);save();close();render();};}
function message(title,html){modal.innerHTML=`<div class="backdrop"><section class="modal"><small>MENSAJE DEL SISTEMA</small><h2>${title}</h2><p>${html}</p><button data-close class="primary">ACEPTAR</button></section></div>`;modal.querySelector('[data-close]').onclick=close;}
function confirmBox(title,text,ok){modal.innerHTML=`<div class="backdrop"><section class="modal"><h2>${title}</h2><p>${text}</p><div class="actions"><button data-close>CANCELAR</button><button id="confirm" class="dangerButton">CONFIRMAR</button></div></section></div>`;modal.querySelector('[data-close]').onclick=close;document.getElementById('confirm').onclick=()=>{close();ok();};}
function close(){modal.innerHTML='';}
function toast(text){const e=document.createElement('div');e.className='toast';e.textContent=text;toasts.append(e);setTimeout(()=>e.remove(),2800);}
function tone(f=440){if(!state.settings.sound)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.value=.035;o.connect(g).connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.08);o.stop(c.currentTime+.08);}catch{}}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
