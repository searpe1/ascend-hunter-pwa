export const EXERCISES = [
  { id: 'squats', name: 'Sentadillas', unit: 'repeticiones', attr: 'strength', base: 12, step: 2, max: 70 },
  { id: 'pushups', name: 'Flexiones adaptadas', unit: 'repeticiones', attr: 'strength', base: 6, step: 1, max: 45 },
  { id: 'plank', name: 'Plancha', unit: 'segundos', attr: 'vitality', base: 20, step: 5, max: 180 },
  { id: 'walk', name: 'Caminar a ritmo vivo', unit: 'minutos', attr: 'agility', base: 8, step: 1, max: 45 },
  { id: 'mobility', name: 'Movilidad articular', unit: 'minutos', attr: 'perception', base: 4, step: 1, max: 15 },
  { id: 'burpees', name: 'Burpees adaptados', unit: 'repeticiones', attr: 'agility', base: 4, step: 1, max: 30 },
  { id: 'lunges', name: 'Zancadas alternas', unit: 'repeticiones', attr: 'vitality', base: 8, step: 2, max: 50 }
];

export const CLASSES = {
  unawakened: {
    id: 'unawakened', name: 'Sin despertar', description: 'Tu poder todavía no ha tomado una forma definida.',
    bonuses: {}, skills: [{ name: 'Determinación', type: 'PASIVA', description: '+3% de probabilidad de resistir una derrota.' }]
  },
  vanguard: {
    id: 'vanguard', name: 'Vanguardia', description: 'Combate frontal, potencia física y golpes devastadores.',
    bonuses: { strength: 3, vitality: 1 }, skills: [
      { name: 'Impacto quebrador', type: 'ACTIVA', description: 'Golpe de 175% de poder. Recarga: 3 turnos.', multiplier: 1.75, cooldown: 3 },
      { name: 'Inercia de combate', type: 'PASIVA', description: '+10% de daño después de recibir un impacto.' }
    ]
  },
  shadowblade: {
    id: 'shadowblade', name: 'Filo Umbrío', description: 'Velocidad, críticos y ataques que atraviesan defensas.',
    bonuses: { agility: 3, perception: 1 }, skills: [
      { name: 'Paso espectral', type: 'ACTIVA', description: 'Dos ataques de 90% con alta probabilidad crítica.', multiplier: 1.8, cooldown: 4 },
      { name: 'Punto ciego', type: 'PASIVA', description: '+12% de probabilidad de crítico.' }
    ]
  },
  warden: {
    id: 'warden', name: 'Guardián', description: 'Resistencia extrema, bloqueo y contraataque.',
    bonuses: { vitality: 3, willpower: 1 }, skills: [
      { name: 'Bastión', type: 'ACTIVA', description: 'Reduce el próximo daño un 60% y contraataca.', multiplier: 1.15, cooldown: 3 },
      { name: 'Núcleo férreo', type: 'PASIVA', description: '+15% de vida máxima en mazmorras.' }
    ]
  },
  arcanist: {
    id: 'arcanist', name: 'Arcanista', description: 'Poder mental, efectos de estado y daño explosivo.',
    bonuses: { intelligence: 3, willpower: 1 }, skills: [
      { name: 'Pulso astral', type: 'ACTIVA', description: 'Daño de 150% e ignora parte de la armadura.', multiplier: 1.5, cooldown: 3 },
      { name: 'Flujo continuo', type: 'PASIVA', description: '10% de posibilidad de reiniciar una habilidad.' }
    ]
  }
};

export const ENEMIES = [
  { name: 'Lobo de ceniza', icon: 'W', trait: 'Feroz', effect: 'sangrado' },
  { name: 'Esqueleto centinela', icon: 'S', trait: 'Blindado', effect: 'bloqueo' },
  { name: 'Araña del vacío', icon: 'A', trait: 'Venenosa', effect: 'veneno' },
  { name: 'Orco saqueador', icon: 'O', trait: 'Brutal', effect: 'aturdimiento' },
  { name: 'Espectro hueco', icon: 'E', trait: 'Etéreo', effect: 'evasión' },
  { name: 'Gólem rúnico', icon: 'G', trait: 'Colosal', effect: 'armadura' },
  { name: 'Caballero caído', icon: 'C', trait: 'Duelista', effect: 'contraataque' }
];

export const BOSSES = [
  { name: 'Rey Astado de la Cripta', icon: '♜', trait: 'Regente', effect: 'furia' },
  { name: 'Matriarca Tejedora', icon: '✣', trait: 'Ancestral', effect: 'veneno' },
  { name: 'Guardián del Eclipse', icon: '◈', trait: 'Inmortal', effect: 'renacer' },
  { name: 'Titán de Obsidiana', icon: '◆', trait: 'Cataclismo', effect: 'armadura' }
];

export const DUNGEON_RANKS = {
  E: { color: '#95a5bd', power: .72, rooms: [2, 3], levelReward: [1, 1], itemRarity: 'common' },
  D: { color: '#62f5a8', power: .9, rooms: [3, 4], levelReward: [1, 2], itemRarity: 'uncommon' },
  C: { color: '#62e5ff', power: 1.1, rooms: [4, 5], levelReward: [2, 3], itemRarity: 'rare' },
  B: { color: '#6a86ff', power: 1.35, rooms: [5, 6], levelReward: [3, 4], itemRarity: 'rare' },
  A: { color: '#9f73ff', power: 1.68, rooms: [6, 7], levelReward: [4, 6], itemRarity: 'epic' },
  S: { color: '#ffb66e', power: 2.1, rooms: [7, 9], levelReward: [7, 10], itemRarity: 'legendary' }
};

export const ITEM_BASES = {
  weapon: ['Espada de la grieta', 'Guanteletes cinéticos', 'Daga del umbral', 'Báculo de resonancia'],
  armor: ['Coraza de placas nocturnas', 'Abrigo de cazador', 'Arnés del bastión', 'Manto resonante'],
  boots: ['Botas de persecución', 'Grebas del coloso', 'Pasos silenciosos', 'Calzado de flujo'],
  ring: ['Anillo del despertar', 'Sello del depredador', 'Aro de vitalidad', 'Nexo arcano']
};

export const REWARD_GIFTS = [
  { type: 'gold', label: 'Créditos del sistema', min: 60, max: 180 },
  { type: 'potion', label: 'Poción de recuperación', min: 1, max: 2 },
  { type: 'attribute', label: 'Punto de atributo', min: 1, max: 1 },
  { type: 'item', label: 'Cofre de equipo', min: 1, max: 1 }
];
