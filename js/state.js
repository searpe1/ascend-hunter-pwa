const STORAGE_KEY = 'ascend-hunter-state-v1';

export const defaultState = () => ({
  version: 1,
  initialized: false,
  player: {
    name: 'Sergio', level: 1, xp: 0, gold: 120, keys: 1, potions: 1,
    classId: 'unawakened', classMastery: 0, attributePoints: 0,
    attributes: { strength: 5, vitality: 5, agility: 5, intelligence: 5, perception: 5, willpower: 5 },
    equipment: { weapon: null, armor: null, boots: null, ring: null },
    inventory: []
  },
  daily: null,
  dungeons: [],
  history: [],
  settings: { sound: true },
  ui: { activeView: 'mission' }
});

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return migrate({ ...defaultState(), ...parsed, player: { ...defaultState().player, ...parsed.player } });
  } catch (error) {
    console.warn('No se pudo cargar el estado', error);
    return defaultState();
  }
}

function migrate(state) {
  state.player.attributes = { ...defaultState().player.attributes, ...(state.player.attributes || {}) };
  state.player.equipment = { ...defaultState().player.equipment, ...(state.player.equipment || {}) };
  state.player.inventory ||= [];
  state.dungeons ||= [];
  state.history ||= [];
  return state;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return defaultState();
}
