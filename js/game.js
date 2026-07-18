import { BOSSES, CLASSES, DUNGEON_RANKS, ENEMIES, EXERCISES, ITEM_BASES, REWARD_GIFTS } from './data.js';

export const ATTR_LABELS = {
  strength: 'Fuerza', vitality: 'Vitalidad', agility: 'Agilidad', intelligence: 'Inteligencia', perception: 'Percepción', willpower: 'Voluntad'
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (array) => array[Math.floor(Math.random() * array.length)];

export function effectiveDayKey(date = new Date()) {
  const shifted = new Date(date.getTime() - 7 * 60 * 60 * 1000);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
}

export function nextReset(date = new Date()) {
  const result = new Date(date);
  result.setHours(7, 0, 0, 0);
  if (date >= result) result.setDate(result.getDate() + 1);
  return result;
}

export function ensureDaily(state, now = new Date()) {
  const key = effectiveDayKey(now);
  if (state.daily?.dayKey === key) return false;
  state.daily = generateDailyMission(state.player, key);
  return true;
}

export function generateDailyMission(player, dayKey) {
  const selected = [...EXERCISES].sort(() => Math.random() - .5).slice(0, player.level < 4 ? 4 : 5);
  const fitnessScale = 1;
  const exercises = selected.map(exercise => {
    const stat = player.attributes[exercise.attr] || 5;
    const growth = Math.floor((player.level - 1) / 2) + Math.floor(stat / 6);
    const target = clamp(Math.round((exercise.base + exercise.step * growth) * fitnessScale), exercise.base, exercise.max);
    return { ...exercise, target, progress: 0 };
  });
  return { dayKey, status: 'available', startedAt: null, deadline: null, completedAt: null, exercises, reward: null };
}

export function startDaily(state, now = new Date()) {
  if (state.daily.status !== 'available') return false;
  state.daily.status = 'active';
  state.daily.startedAt = now.toISOString();
  state.daily.deadline = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  state.history.unshift({ at: now.toISOString(), type: 'mission-start', text: 'Misión diaria iniciada.' });
  return true;
}

export function dailyExpired(state, now = new Date()) {
  return state.daily?.status === 'active' && now > new Date(state.daily.deadline);
}

export function expireDaily(state, now = new Date()) {
  if (!dailyExpired(state, now)) return false;
  state.daily.status = 'failed';
  state.history.unshift({ at: now.toISOString(), type: 'mission-fail', text: 'Misión diaria no completada dentro del límite.' });
  return true;
}

export function updateExercise(state, exerciseId, delta) {
  if (state.daily?.status !== 'active') return;
  const exercise = state.daily.exercises.find(item => item.id === exerciseId);
  if (!exercise) return;
  const step = ['plank'].includes(exercise.id) ? 5 : 1;
  exercise.progress = clamp(exercise.progress + delta * step, 0, exercise.target);
}

export function missionReady(state) {
  return state.daily?.status === 'active' && state.daily.exercises.every(item => item.progress >= item.target);
}

export function completeDaily(state, now = new Date()) {
  if (!missionReady(state) || dailyExpired(state, now)) return null;
  state.player.level += 1;
  state.player.attributePoints += 1;
  const reward = generateDailyReward(state.player);
  applyReward(state, reward);
  state.daily.status = 'completed';
  state.daily.completedAt = now.toISOString();
  state.daily.reward = reward;
  state.player.classMastery += 8;
  state.history.unshift({ at: now.toISOString(), type: 'mission-complete', text: `Misión completada. Nivel ${state.player.level}.` });
  return reward;
}

function generateDailyReward(player) {
  const gift = pick(REWARD_GIFTS);
  const amount = randomInt(gift.min, gift.max);
  const keyFound = Math.random() < .12;
  const reward = { type: gift.type, label: gift.label, amount, keyFound };
  if (gift.type === 'item') reward.item = generateItem(rankFromLevel(player.level), player.level);
  return reward;
}

function applyReward(state, reward) {
  if (reward.type === 'gold') state.player.gold += reward.amount;
  if (reward.type === 'potion') state.player.potions += reward.amount;
  if (reward.type === 'attribute') state.player.attributePoints += reward.amount;
  if (reward.type === 'item') state.player.inventory.push(reward.item);
  if (reward.keyFound) state.player.keys += 1;
}

export function playerRank(level) {
  if (level >= 45) return 'S';
  if (level >= 30) return 'A';
  if (level >= 20) return 'B';
  if (level >= 12) return 'C';
  if (level >= 6) return 'D';
  return 'E';
}

export function rankFromLevel(level) {
  const roll = Math.random();
  const bias = Math.min(level / 65, .55);
  if (roll < .01 + bias * .08) return 'S';
  if (roll < .05 + bias * .15) return 'A';
  if (roll < .16 + bias * .22) return 'B';
  if (roll < .36 + bias * .28) return 'C';
  if (roll < .66) return 'D';
  return 'E';
}

export function unlockDungeon(state, now = new Date()) {
  if (state.player.keys < 1) return null;
  state.player.keys -= 1;
  const rank = rankFromLevel(state.player.level);
  const config = DUNGEON_RANKS[rank];
  const rooms = randomInt(config.rooms[0], config.rooms[1]);
  const names = ['Cripta del eco roto', 'Torre de la luna negra', 'Foso de los olvidados', 'Bosque de cristal muerto', 'Ciudadela sin aurora', 'Santuario de las cadenas'];
  const dungeon = {
    id: crypto.randomUUID(), name: pick(names), rank, level: Math.max(1, state.player.level + randomInt(-2, 3)),
    rooms, status: 'unlocked', unlockedAt: now.toISOString(), completedAt: null,
    enemies: Array.from({ length: rooms - 1 }, () => ({ ...pick(ENEMIES) })), boss: { ...pick(BOSSES) }
  };
  state.dungeons.unshift(dungeon);
  state.history.unshift({ at: now.toISOString(), type: 'dungeon-unlock', text: `Mazmorra ${rank} desbloqueada: ${dungeon.name}.` });
  return dungeon;
}

export function activeDungeon(state) {
  return state.dungeons.find(dungeon => ['unlocked', 'running'].includes(dungeon.status));
}

export function getPlayerPower(player) {
  const attrs = player.attributes;
  const classData = CLASSES[player.classId] || CLASSES.unawakened;
  const classBonus = Object.entries(classData.bonuses || {}).reduce((sum, [key, val]) => sum + (attrs[key] + val) * 1.2, 0);
  const base = attrs.strength * 2.2 + attrs.agility * 1.7 + attrs.intelligence * 1.5 + attrs.perception * 1.3 + attrs.willpower + classBonus + player.level * 3;
  const equipment = Object.values(player.equipment).filter(Boolean).reduce((sum, item) => sum + item.power, 0);
  return Math.round(base + equipment);
}

export function getPlayerMaxHp(player) {
  const classBoost = player.classId === 'warden' ? 1.15 : 1;
  const equipment = Object.values(player.equipment).filter(Boolean).reduce((sum, item) => sum + (item.hp || 0), 0);
  return Math.round((80 + player.level * 8 + player.attributes.vitality * 11 + equipment) * classBoost);
}

export function createCombat(state, dungeon) {
  dungeon.status = 'running';
  const playerPower = getPlayerPower(state.player);
  const maxHp = getPlayerMaxHp(state.player);
  const enemies = [...dungeon.enemies.map((enemy, index) => buildEnemy(enemy, dungeon, index, false)), buildEnemy(dungeon.boss, dungeon, dungeon.rooms - 1, true)];
  return { dungeonId: dungeon.id, room: 0, turn: 0, playerHp: maxHp, playerMaxHp: maxHp, playerPower, enemies, logs: [], status: 'running', cooldown: 0, guard: false };
}

function buildEnemy(enemy, dungeon, index, boss) {
  const rankConfig = DUNGEON_RANKS[dungeon.rank];
  const scaling = (dungeon.level * 3.1 + 18) * rankConfig.power * (1 + index * .05);
  return { ...enemy, boss, maxHp: Math.round(scaling * (boss ? 4.4 : 2.15)), hp: Math.round(scaling * (boss ? 4.4 : 2.15)), power: Math.round(scaling * (boss ? .54 : .38)) };
}

export function combatStep(state, combat) {
  if (combat.status !== 'running') return { done: true };
  const enemy = combat.enemies[combat.room];
  combat.turn += 1;
  const player = state.player;
  const classData = CLASSES[player.classId] || CLASSES.unawakened;
  let playerDamage = Math.round(combat.playerPower * randomFloat(.62, .9));
  let logClass = 'log-hit';
  let action = `Atacas e infliges ${playerDamage} de daño.`;

  const perceptionCrit = clamp(player.attributes.perception * .006, .03, .23);
  const classCrit = player.classId === 'shadowblade' ? .12 : 0;
  if (Math.random() < perceptionCrit + classCrit) {
    playerDamage = Math.round(playerDamage * 1.65);
    logClass = 'log-crit'; action = `¡Impacto crítico! Infliges ${playerDamage} de daño.`;
  }

  if (combat.cooldown <= 0 && player.classId !== 'unawakened' && Math.random() < .34) {
    const skill = classData.skills.find(item => item.type === 'ACTIVA');
    playerDamage = Math.round(combat.playerPower * (skill?.multiplier || 1.5));
    combat.cooldown = skill?.cooldown || 3;
    logClass = 'log-skill'; action = `${skill?.name}: ${playerDamage} de daño.`;
    if (player.classId === 'warden') combat.guard = true;
  } else combat.cooldown = Math.max(0, combat.cooldown - 1);

  enemy.hp = Math.max(0, enemy.hp - playerDamage);
  combat.logs.push({ text: action, className: logClass });

  if (enemy.hp <= 0) {
    combat.logs.push({ text: `${enemy.name} ha sido derrotado.`, className: 'log-win' });
    if (combat.room >= combat.enemies.length - 1) {
      combat.status = 'won';
      return { done: true, won: true };
    }
    combat.room += 1;
    combat.logs.push({ text: `Sala ${combat.room + 1}: aparece ${combat.enemies[combat.room].name}.`, className: 'log-danger' });
    return { done: false, roomChanged: true };
  }

  let enemyDamage = Math.round(enemy.power * randomFloat(.72, 1.12));
  if (enemy.effect === 'furia' && enemy.hp < enemy.maxHp * .4) enemyDamage = Math.round(enemyDamage * 1.35);
  if (combat.guard) { enemyDamage = Math.round(enemyDamage * .4); combat.guard = false; }
  const dodgeChance = clamp(player.attributes.agility * .005, .02, .24) + (player.classId === 'shadowblade' ? .05 : 0);
  if (Math.random() < dodgeChance) {
    combat.logs.push({ text: `Esquivas el ataque de ${enemy.name}.`, className: 'log-skill' });
  } else {
    combat.playerHp = Math.max(0, combat.playerHp - enemyDamage);
    combat.logs.push({ text: `${enemy.name} te inflige ${enemyDamage} de daño.`, className: 'log-danger' });
  }
  if (combat.playerHp <= 0) { combat.status = 'lost'; return { done: true, won: false }; }
  return { done: false };
}

export function resolveDungeonWin(state, dungeon, combat, now = new Date()) {
  const config = DUNGEON_RANKS[dungeon.rank];
  const levels = randomInt(config.levelReward[0], config.levelReward[1]);
  state.player.level += levels;
  state.player.attributePoints += Math.max(1, Math.floor(levels / 2));
  state.player.classMastery += levels * 6;
  const item = generateItem(dungeon.rank, dungeon.level);
  state.player.inventory.push(item);
  state.player.gold += dungeon.level * 22;
  dungeon.status = 'completed'; dungeon.completedAt = now.toISOString();
  state.history.unshift({ at: now.toISOString(), type: 'dungeon-win', text: `${dungeon.name} completada. +${levels} niveles.` });
  return { levels, item, gold: dungeon.level * 22 };
}

export function applyDungeonPenalty(state, dungeon, reason = 'defeat', now = new Date()) {
  const lostLevels = Math.min(2, Math.max(0, state.player.level - 1));
  state.player.level = Math.max(1, state.player.level - 2);
  const attributes = Object.keys(state.player.attributes).sort(() => Math.random() - .5).slice(0, 2);
  attributes.forEach(key => { state.player.attributes[key] = Math.max(1, state.player.attributes[key] - 1); });
  let lostItem = null;
  if (state.player.inventory.length && Math.random() < .3) {
    const index = randomInt(0, state.player.inventory.length - 1);
    lostItem = state.player.inventory.splice(index, 1)[0];
  } else if (Math.random() < .15) {
    const equippedSlots = Object.entries(state.player.equipment).filter(([, item]) => item);
    if (equippedSlots.length) {
      const [slot, item] = pick(equippedSlots); lostItem = item; state.player.equipment[slot] = null;
    }
  }
  dungeon.status = 'unlocked';
  dungeon.attempts = (dungeon.attempts || 0) + 1;
  dungeon.lastAttemptAt = now.toISOString();
  state.history.unshift({ at: now.toISOString(), type: 'dungeon-loss', text: `${reason === 'abandon' ? 'Mazmorra abandonada' : 'Derrota'}. -${lostLevels} niveles. El portal sigue abierto.` });
  return { lostLevels, attributes, lostItem };
}

export function generateItem(rank = 'E', level = 1) {
  const rarityByRank = { E: 'common', D: 'uncommon', C: 'rare', B: 'rare', A: 'epic', S: 'legendary' };
  const rarity = rarityByRank[rank] || 'common';
  const rarityFactor = { common: 1, uncommon: 1.3, rare: 1.7, epic: 2.25, legendary: 3.1 }[rarity];
  const slot = pick(Object.keys(ITEM_BASES));
  const power = Math.round((4 + level * 1.8) * rarityFactor);
  return { id: crypto.randomUUID(), name: pick(ITEM_BASES[slot]), slot, rarity, rank, level, power, hp: slot === 'armor' ? Math.round(power * 1.7) : 0 };
}

export function equipItem(state, itemId) {
  const index = state.player.inventory.findIndex(item => item.id === itemId);
  if (index < 0) return false;
  const item = state.player.inventory[index];
  const previous = state.player.equipment[item.slot];
  state.player.equipment[item.slot] = item;
  state.player.inventory.splice(index, 1);
  if (previous) state.player.inventory.push(previous);
  return true;
}

export function unequipItem(state, slot) {
  const item = state.player.equipment[slot];
  if (!item) return false;
  state.player.inventory.push(item); state.player.equipment[slot] = null; return true;
}

export function spendAttributePoint(state, attribute) {
  if (state.player.attributePoints < 1 || !(attribute in state.player.attributes)) return false;
  state.player.attributePoints -= 1; state.player.attributes[attribute] += 1; return true;
}

export function canChooseClass(player) { return player.level >= 5 && player.classId === 'unawakened'; }
export function chooseClass(state, classId) {
  if (!canChooseClass(state.player) || !CLASSES[classId] || classId === 'unawakened') return false;
  state.player.classId = classId;
  Object.entries(CLASSES[classId].bonuses).forEach(([key, value]) => { state.player.attributes[key] += value; });
  state.history.unshift({ at: new Date().toISOString(), type: 'class', text: `Clase desbloqueada: ${CLASSES[classId].name}.` });
  return true;
}

export function formatDuration(ms) {
  const safe = Math.max(0, ms);
  const hours = Math.floor(safe / 3600000);
  const minutes = Math.floor((safe % 3600000) / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function randomFloat(min, max) { return Math.random() * (max - min) + min; }
