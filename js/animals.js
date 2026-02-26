// ═══════════════════════════════════════════
// PEDAL OR DIE — animals.js  (Phase 4)
// All 7 animal types with encounter mechanics,
// day-scaling difficulty, loot drops, flee logic
// ═══════════════════════════════════════════

const Animals = {

  // ── All animal types ──────────────────────
  types: {
    wolf: {
      id: 'wolf', name: 'Mutated Wolf', emoji: '🐺',
      baseStrength: 15, speed: 'fast',
      locations: ['forest', 'abandoned_farm'],
      raidWeight: 30,
      encounterWeight: 25,
      fleeThreshold: 0.3,   // flees when below 30% HP
      drops: [
        { resource: 'rope',  amount: [1,2], chance: 0.6 },
        { resource: 'cloth', amount: [1,2], chance: 0.4 }
      ],
      encounterText: [
        'A mutated wolf snarls from the treeline!',
        'Yellow eyes watch you from the shadows...',
        'A wolf pack circles you — pedal FASTER!'
      ],
      fleeText: 'The wolf whimpers and retreats!'
    },

    boar: {
      id: 'boar', name: 'Wild Boar', emoji: '🐗',
      baseStrength: 20, speed: 'medium',
      locations: ['forest', 'abandoned_farm'],
      raidWeight: 25,
      encounterWeight: 20,
      fleeThreshold: 0.0,   // never flees
      drops: [
        { resource: 'food',  amount: [2,4], chance: 0.7 },
        { resource: 'rope',  amount: [1,2], chance: 0.3 }
      ],
      encounterText: [
        'A massive boar charges out of the bushes!',
        'Tusks glint in the light — it\'s a big one!',
        'The ground shakes as a boar rushes you!'
      ],
      fleeText: 'The boar squeals and crashes into the undergrowth.'
    },

    rat: {
      id: 'rat', name: 'Giant Rat', emoji: '🐀',
      baseStrength: 5, speed: 'fast',
      locations: ['city_ruins', 'junkyard', 'gas_station', 'hospital'],
      raidWeight: 40,
      encounterWeight: 35,
      fleeThreshold: 0.5,   // cowardly, flees at 50%
      drops: [
        { resource: 'cloth',     amount: [1,2], chance: 0.5 },
        { resource: 'chemicals', amount: [1,1], chance: 0.2 }
      ],
      encounterText: [
        'A rat the size of a dog lunges at you!',
        'Dozens of giant rats swarm from a drain!',
        'Something skitters in the rubble... too big to be normal.'
      ],
      fleeText: 'The rats scatter into the darkness!'
    },

    insect: {
      id: 'insect', name: 'Giant Insect', emoji: '🦟',
      baseStrength: 10, speed: 'fast',
      locations: ['forest', 'cave', 'abandoned_farm'],
      raidWeight: 20,
      encounterWeight: 20,
      fleeThreshold: 0.2,
      drops: [
        { resource: 'chemicals', amount: [1,2], chance: 0.5 },
        { resource: 'medicine',  amount: [1,1], chance: 0.3 }
      ],
      encounterText: [
        'A chittering insect the size of a dog drops from a tree!',
        'The air fills with buzzing — giant insects inbound!',
        'Something with too many legs blocks your path!'
      ],
      fleeText: 'The insects scatter back into the canopy.'
    },

    bear: {
      id: 'bear', name: 'Mutated Bear', emoji: '🐻',
      baseStrength: 50, speed: 'slow',
      locations: ['forest', 'cave'],
      raidWeight: 10,
      encounterWeight: 8,
      fleeThreshold: 0.15,
      drops: [
        { resource: 'food',  amount: [3,6], chance: 0.8 },
        { resource: 'rope',  amount: [2,3], chance: 0.5 },
        { resource: 'cloth', amount: [2,4], chance: 0.4 }
      ],
      encounterText: [
        'A MASSIVE mutated bear rears up on its hind legs!',
        'The forest goes silent... then a bear roars!',
        'Something huge is following you through the trees...'
      ],
      fleeText: 'The bear lumbers away, growling.'
    },

    bird: {
      id: 'bird', name: 'Mutated Bird', emoji: '🦅',
      baseStrength: 12, speed: 'very_fast',
      locations: ['city_ruins', 'military_base', 'junkyard'],
      raidWeight: 15,
      encounterWeight: 18,
      fleeThreshold: 0.4,
      drops: [
        { resource: 'electronics', amount: [1,2], chance: 0.4 },
        { resource: 'rope',        amount: [1,2], chance: 0.5 }
      ],
      encounterText: [
        'A hawk with a 3-metre wingspan dives at you!',
        'Shrieking mutant birds swarm from a rooftop!',
        'Shadow passes overhead — something big is circling...'
      ],
      fleeText: 'The birds wheel away, screeching.'
    },

    zombie_dog: {
      id: 'zombie_dog', name: 'Zombie Hound', emoji: '🐕',
      baseStrength: 18, speed: 'fast',
      locations: ['hospital', 'military_base', 'city_ruins'],
      raidWeight: 20,
      encounterWeight: 15,
      fleeThreshold: 0.0,   // never gives up
      drops: [
        { resource: 'medicine', amount: [1,3], chance: 0.6 },
        { resource: 'cloth',    amount: [1,2], chance: 0.4 }
      ],
      encounterText: [
        'A zombie-infected dog lunges from a doorway!',
        'Pack of undead hounds blocks the corridor!',
        'Growling from all sides — zombie dogs have surrounded you!'
      ],
      fleeText: 'The zombie hound collapses, twitching.'
    },

    boss_mutant: {
      id: 'boss_mutant', name: '??? UNKNOWN', emoji: '👾',
      baseStrength: 100, speed: 'medium',
      locations: ['military_base', 'cave'],
      raidWeight: 2,
      encounterWeight: 2,
      fleeThreshold: 0.0,
      drops: [
        { resource: 'electronics', amount: [4,8],  chance: 0.9 },
        { resource: 'chemicals',   amount: [3,6],  chance: 0.8 },
        { resource: 'medicine',    amount: [3,5],  chance: 0.7 },
        { resource: 'metal',       amount: [5,10], chance: 0.9 }
      ],
      encounterText: [
        'Something HUGE moves in the shadows — not animal, not human...',
        'The ground shakes. A massive mutated creature blocks your path!',
        'WARNING: APEX PREDATOR DETECTED'
      ],
      fleeText: 'The creature retreats into the darkness, watching...'
    }
  },

  // ── Get scaled strength (harder over time) ─
  getStrength(animalId) {
    const animal = this.types[animalId];
    if (!animal) return 10;
    const day      = State.data?.world?.day || 1;
    const scale    = 1 + (day - 1) * 0.08;   // +8% per day
    return Math.round(animal.baseStrength * scale);
  },

  // ── Pick random raid animal ────────────────
  randomRaidAnimal() {
    const pool = Object.values(this.types).map(a => ({
      item: { ...a, strength: this.getStrength(a.id) },
      weight: a.raidWeight
    }));
    return Utils.weightedRandom(pool);
  },

  // ── Pick encounter animal for a location ──
  randomEncounterAnimal(locationId) {
    const candidates = Object.values(this.types)
      .filter(a => a.locations.includes(locationId));
    if (!candidates.length) return null;

    const pool = candidates.map(a => ({
      item:   { ...a, strength: this.getStrength(a.id) },
      weight: a.encounterWeight
    }));
    return Utils.weightedRandom(pool);
  },

  // ── Roll loot drops from an animal ────────
  rollDrops(animalId) {
    const animal = this.types[animalId];
    if (!animal) return {};
    const loot = {};
    animal.drops.forEach(drop => {
      if (Math.random() < drop.chance) {
        const amt = Utils.randInt(drop.amount[0], drop.amount[1]);
        loot[drop.resource] = (loot[drop.resource] || 0) + amt;
      }
    });
    return loot;
  },

  // ── Random encounter text ─────────────────
  getEncounterText(animalId) {
    const a = this.types[animalId];
    if (!a) return 'Something stirs in the darkness...';
    return a.encounterText[Utils.randInt(0, a.encounterText.length - 1)];
  },

  display(id) {
    const a = this.types[id];
    return a ? `${a.emoji} ${a.name}` : '? Unknown';
  }
};
