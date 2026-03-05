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

    // ── 10 NEW MONSTERS ────────────────────────────────────────────────────

    swarm: {
      id: 'swarm', name: 'Tick Swarm', emoji: '🕷',
      baseStrength: 8, speed: 'very_fast',
      locations: ['forest', 'cave', 'abandoned_farm'],
      raidWeight: 35, encounterWeight: 30,
      fleeThreshold: 0.6,
      drops: [
        { resource: 'chemicals', amount: [1,2], chance: 0.5 },
        { resource: 'cloth',     amount: [1,1], chance: 0.4 }
      ],
      encounterText: [
        'A seething cloud of mutant ticks erupts from the bark!',
        'The ground moves — it\'s alive with crawling ticks!',
        'Biting. Everywhere. BITING.'
      ],
      fleeText: 'The swarm scatters into cracks in the earth.'
    },

    serpent: {
      id: 'serpent', name: 'Venom Serpent', emoji: '🐍',
      baseStrength: 22, speed: 'fast',
      locations: ['forest', 'abandoned_farm', 'cave'],
      raidWeight: 18, encounterWeight: 16,
      fleeThreshold: 0.2,
      drops: [
        { resource: 'chemicals', amount: [2,4], chance: 0.7 },
        { resource: 'medicine',  amount: [1,2], chance: 0.4 }
      ],
      encounterText: [
        'A massive venom serpent drops from the canopy!',
        'Yellow eyes glint between the roots — a huge snake!',
        'It rattles. Louder. LOUDER.'
      ],
      fleeText: 'The serpent coils back and vanishes into the undergrowth.'
    },

    scorpion: {
      id: 'scorpion', name: 'Acid Scorpion', emoji: '🦂',
      baseStrength: 35, speed: 'medium',
      locations: ['cave', 'junkyard', 'gas_station'],
      raidWeight: 14, encounterWeight: 12,
      fleeThreshold: 0.15,
      drops: [
        { resource: 'chemicals', amount: [3,5], chance: 0.8 },
        { resource: 'medicine',  amount: [1,3], chance: 0.5 }
      ],
      encounterText: [
        'An armoured scorpion the size of a dog snaps its claws!',
        'Acid drips from its stinger — it\'s going to strike!',
        'The cave floor cracks as something huge scuttles toward you.'
      ],
      fleeText: 'The scorpion retreats into a crevice, hissing.'
    },

    crab: {
      id: 'crab', name: 'Mutant Crab', emoji: '🦀',
      baseStrength: 45, speed: 'slow',
      locations: ['city_ruins', 'junkyard', 'gas_station'],
      raidWeight: 10, encounterWeight: 9,
      fleeThreshold: 0.0,
      drops: [
        { resource: 'metal',  amount: [3,6], chance: 0.8 },
        { resource: 'food',   amount: [2,4], chance: 0.6 },
        { resource: 'rope',   amount: [1,3], chance: 0.4 }
      ],
      encounterText: [
        'A mutant crab the size of a car scuttles from the wreckage!',
        'Its shell is reinforced with scrap metal — natural armour!',
        'CLACK CLACK CLACK — something giant is closing in sideways.'
      ],
      fleeText: 'The crab retreats back into the rubble pile.'
    },

    blob: {
      id: 'blob', name: 'Acid Blob', emoji: '🟢',
      baseStrength: 30, speed: 'slow',
      locations: ['hospital', 'cave', 'city_ruins'],
      raidWeight: 12, encounterWeight: 10,
      fleeThreshold: 0.0,
      drops: [
        { resource: 'chemicals', amount: [4,7], chance: 0.9 },
        { resource: 'medicine',  amount: [2,4], chance: 0.5 }
      ],
      encounterText: [
        'A pulsing translucent blob oozes from the drain!',
        'It burns through metal on contact — don\'t let it touch you!',
        'The floor is melting where it slides...'
      ],
      fleeText: 'The blob dissolves through a crack in the floor.'
    },

    phantom: {
      id: 'phantom', name: 'Shadow Phantom', emoji: '👻',
      baseStrength: 55, speed: 'very_fast',
      locations: ['hospital', 'cave', 'city_ruins'],
      raidWeight: 8, encounterWeight: 7,
      fleeThreshold: 0.35,
      drops: [
        { resource: 'electronics', amount: [2,4], chance: 0.6 },
        { resource: 'chemicals',   amount: [2,3], chance: 0.5 },
        { resource: 'medicine',    amount: [1,3], chance: 0.4 }
      ],
      encounterText: [
        'A spectral shape coalesces from the dark — is it even real?',
        'Your instruments go haywire. Something\'s here that shouldn\'t be.',
        'Cold. Instantly bone-deep cold. It\'s behind you.'
      ],
      fleeText: 'The phantom dissolves into mist and silence.'
    },

    golem: {
      id: 'golem', name: 'Scrap Golem', emoji: '🤖',
      baseStrength: 75, speed: 'slow',
      locations: ['junkyard', 'military_base', 'city_ruins'],
      raidWeight: 6, encounterWeight: 5,
      fleeThreshold: 0.0,
      drops: [
        { resource: 'metal',       amount: [6,12], chance: 0.95 },
        { resource: 'electronics', amount: [4,8],  chance: 0.8 },
        { resource: 'rope',        amount: [2,4],  chance: 0.5 }
      ],
      encounterText: [
        'A walking heap of scrap and rebar LURCHES toward you!',
        'Steam hisses from its joints — it\'s been built to kill.',
        'The whole junkyard is shaking. Something assembled itself.'
      ],
      fleeText: 'The golem ceases movement and collapses into a heap.'
    },

    hydra: {
      id: 'hydra', name: 'Sewer Hydra', emoji: '🐲',
      baseStrength: 90, speed: 'medium',
      locations: ['city_ruins', 'hospital', 'cave'],
      raidWeight: 4, encounterWeight: 4,
      fleeThreshold: 0.1,
      drops: [
        { resource: 'food',      amount: [4,8],  chance: 0.7 },
        { resource: 'chemicals', amount: [4,7],  chance: 0.8 },
        { resource: 'rope',      amount: [3,5],  chance: 0.6 },
        { resource: 'medicine',  amount: [3,5],  chance: 0.6 }
      ],
      encounterText: [
        'THREE heads rise from the sewage — a hydra mutation!',
        'Cut one head off and two grow back... probably.',
        'The sewer wall explodes. Something massive and many-headed emerges.'
      ],
      fleeText: 'The hydra retreats underground with a thunderous splash.'
    },

    wraith: {
      id: 'wraith', name: 'Cyber Wraith', emoji: '💀',
      baseStrength: 120, speed: 'fast',
      locations: ['military_base', 'command_bunker', 'endgame_transmission'],
      raidWeight: 3, encounterWeight: 3,
      fleeThreshold: 0.0,
      drops: [
        { resource: 'military_chip', amount: [2,5],  chance: 0.85 },
        { resource: 'electronics',   amount: [5,10], chance: 0.9 },
        { resource: 'chemicals',     amount: [3,6],  chance: 0.7 }
      ],
      encounterText: [
        'A digital ghost of a soldier flickers into view — weapons raised.',
        'WARNING: MILITARY AI CONSTRUCT — LETHAL ENGAGEMENT AUTHORISED.',
        'Its skull face glows red in the dark. It has been waiting.'
      ],
      fleeText: 'The wraith fragments into static and disappears.'
    },

    titan: {
      id: 'titan', name: 'APEX TITAN', emoji: '👹',
      baseStrength: 200, speed: 'slow',
      locations: ['endgame_transmission', 'command_bunker', 'military_base'],
      raidWeight: 1, encounterWeight: 1,
      fleeThreshold: 0.0,
      drops: [
        { resource: 'military_chip', amount: [5,10],  chance: 1.0 },
        { resource: 'electronics',   amount: [8,15],  chance: 1.0 },
        { resource: 'chemicals',     amount: [6,12],  chance: 1.0 },
        { resource: 'medicine',      amount: [5,10],  chance: 0.9 },
        { resource: 'metal',         amount: [10,20], chance: 1.0 }
      ],
      encounterText: [
        'THE GROUND SPLITS. AN APEX TITAN RISES.',
        'It is three metres tall and accelerating toward you.',
        'YOUR INSTRUMENTS FAIL. YOUR BODY SHAKES. PEDAL.'
      ],
      fleeText: 'Impossible. It retreats. Watching. Learning.'
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
    const day   = State.data?.world?.day || 1;
    const scale = Math.min(5.0, 1 + (day - 1) * 0.08);  // +8%/day, capped at 5× (day ~51)
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
