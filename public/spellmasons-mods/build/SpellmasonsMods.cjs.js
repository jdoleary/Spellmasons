"use strict";
const {
  PixiUtils: PixiUtils$5,
  rand: rand$5,
  cardUtils: cardUtils$j,
  commonTypes: commonTypes$u,
  cards: cards$r
} = globalThis.SpellmasonsAPI;
const { randFloat: randFloat$1 } = rand$5;
const { refundLastSpell: refundLastSpell$n } = cards$r;
const { containerSpells: containerSpells$3 } = PixiUtils$5;
const Unit$o = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$3, playDefaultSpellSFX: playDefaultSpellSFX$h } = cardUtils$j;
const { CardCategory: CardCategory$u, probabilityMap: probabilityMap$u, CardRarity: CardRarity$t } = commonTypes$u;
const cardId$i = "Undead Blade";
const damageDone$2 = 60;
const animationPath$4 = "spellUndeadBlade";
const delayBetweenAnimationsStart$1 = 400;
const spell$t = {
  card: {
    id: cardId$i,
    category: CardCategory$u.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$u[CardRarity$t.COMMON],
    thumbnail: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
    animationPath: animationPath$4,
    sfx: "hurt",
    description: [`Deals ${damageDone$2} to summoned units and resurrected units only.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !u.originalLife);
      let delayBetweenAnimations = delayBetweenAnimationsStart$1;
      for (let q = 0; q < quantity; q++) {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$h(card, prediction);
          for (let unit of targets) {
            const spellEffectImage = oneOffImage$3(unit, animationPath$4, containerSpells$3);
            if (spellEffectImage) {
              spellEffectImage.sprite.rotation = randFloat$1(-Math.PI / 6, Math.PI / 6);
              if (q % 2 == 0) {
                spellEffectImage.sprite.scale.x = -1;
              }
            }
            Unit$o.takeDamage({
              unit,
              amount: damageDone$2,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
          await new Promise((resolve) => setTimeout(resolve, delayBetweenAnimations));
          delayBetweenAnimations *= 0.8;
          delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
        } else {
          for (let unit of targets) {
            Unit$o.takeDamage({
              unit,
              amount: damageDone$2,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
        }
      }
      if (targets.length == 0) {
        refundLastSpell$n(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const mod$4 = {
  modName: "Undead Blade",
  author: "Jordan O'Leary",
  description: "A spell that does lots of damage to summons and resurrected units",
  screenshot: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
  spells: [
    spell$t
  ],
  // The spritesheet is created with TexturePacker: https://www.codeandweb.com/texturepacker
  spritesheet: "spellmasons-mods/undead_blade/undead_blade.json"
};
const {
  cardUtils: cardUtils$i,
  commonTypes: commonTypes$t,
  cards: cards$q,
  cardsUtil: cardsUtil$7,
  FloatingText: FloatingText$6
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$m } = cards$q;
const Unit$n = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$g } = cardUtils$i;
const { CardCategory: CardCategory$t, probabilityMap: probabilityMap$t, CardRarity: CardRarity$s } = commonTypes$t;
const cardId$h = "Decay";
const spell$s = {
  card: {
    id: cardId$h,
    category: CardCategory$t.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$t[CardRarity$s.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDecay.png",
    sfx: "poison",
    description: [`Causes the target to take damage equal to the number of decay stacks squared at the start of their turn. The target then gains another stack.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$m(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$g(card, prediction);
        }
        for (let unit of targets) {
          Unit$n.addModifier(unit, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$7
  },
  events: {
    onTurnStart: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$h];
      if (modifier && !!Math.pow(modifier.quantity, 2) && !prediction) {
        Unit$n.takeDamage({ unit, amount: Math.pow(modifier.quantity, 2) }, underworld, prediction);
        FloatingText$6.default({
          coords: unit,
          text: `${Math.pow(modifier.quantity, 2)} decay damage`,
          style: { fill: "#525863", strokeThickness: 1 }
        });
        modifier.quantity++;
      }
    }
  }
};
function add$7(unit, _underworld, _prediction, quantity) {
  cardsUtil$7.getOrInitModifier(unit, cardId$h, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$h);
  });
}
const {
  cardUtils: cardUtils$h,
  commonTypes: commonTypes$s,
  cards: cards$p
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$l } = cards$p;
const Unit$m = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$f } = cardUtils$h;
const { CardCategory: CardCategory$s, probabilityMap: probabilityMap$s, CardRarity: CardRarity$r } = commonTypes$s;
const cardId$g = "Dominate";
const healthThreshhold = 0.25;
const spell$r = {
  card: {
    id: cardId$g,
    category: CardCategory$s.Soul,
    supportQuantity: false,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2.5,
    probability: probabilityMap$s[CardRarity$r.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDominate.png",
    sfx: "suffocate",
    description: [`Converts an enemy to fight for you if they are below ${healthThreshhold * 100}% health.`],
    //Wololo
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && u.health <= u.healthMax * healthThreshhold && u.faction !== state.casterUnit.faction);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$f(card, prediction);
      }
      for (let unit of targets) {
        Unit$m.changeFaction(unit, state.casterUnit.faction);
      }
      if (targets.length == 0) {
        refundLastSpell$l(state, prediction, "No low health targets to convert, mana refunded");
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$g,
  commonTypes: commonTypes$r,
  cards: cards$o,
  cardsUtil: cardsUtil$6
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$k } = cards$o;
const Unit$l = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$e } = cardUtils$g;
const { CardCategory: CardCategory$r, probabilityMap: probabilityMap$r, CardRarity: CardRarity$q } = commonTypes$r;
const cardId$f = "Ensnare";
const spell$q = {
  card: {
    id: cardId$f,
    category: CardCategory$r.Curses,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$r[CardRarity$q.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconEnsnare.png",
    sfx: "",
    description: [`Prevents the target from moving for one turn. Furthur casts increase duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$k(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$e(card, prediction);
        }
        for (let unit of targets) {
          Unit$l.addModifier(unit, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$6,
    remove: remove$3
  },
  events: {
    onTurnEnd: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$f];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$l.removeModifier(unit, cardId$f, underworld);
        }
      }
    }
  }
};
function add$6(unit, underworld, prediction, quantity) {
  cardsUtil$6.getOrInitModifier(unit, cardId$f, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit.staminaMax
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$f);
    unit.stamina = 0;
    unit.staminaMax = 0;
  });
}
function remove$3(unit, underworld) {
  if (unit.modifiers && unit.modifiers[cardId$f]) {
    const originalStamina = unit.modifiers[cardId$f].originalstat;
    if (originalStamina && unit.staminaMax == 0) {
      unit.staminaMax = originalStamina;
    }
  }
}
const {
  cardUtils: cardUtils$f,
  commonTypes: commonTypes$q,
  cards: cards$n,
  FloatingText: FloatingText$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$j } = cards$n;
globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$d } = cardUtils$f;
const { CardCategory: CardCategory$q, probabilityMap: probabilityMap$q, CardRarity: CardRarity$p } = commonTypes$q;
const Events = globalThis.SpellmasonsAPI.Events;
const cardId$e = "Fast Forward";
const spell$p = {
  card: {
    id: cardId$e,
    category: CardCategory$q.Soul,
    //Theres no "other" category
    supportQuantity: false,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$q[CardRarity$p.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFastForward.png",
    sfx: "push",
    //TODO
    description: [`Shunt the target forward through time. Causes progression of spell effects but does not affect cooldowns.`],
    //TODO: better deffinition
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$d(card, prediction);
        for (let unit of targets) {
          setTimeout(() => {
            FloatingText$5.default({
              coords: unit,
              text: `Fast Forward`,
              style: { fill: "#ff0000", strokeThickness: 1 }
            });
          }, 200);
          procEvents(unit, underworld, prediction);
        }
      } else {
        for (let unit of targets) {
          procEvents(unit, underworld, prediction);
        }
      }
      if (targets.length == 0) {
        refundLastSpell$j(state, prediction, "No targets chosen, mana refunded");
      }
      return state;
    }
  }
};
async function procEvents(unit, underworld, prediction) {
  for (let i = 0; i < unit.events.length; i++) {
    const eventName = unit.events[i];
    if (eventName) {
      const fns = Events.default.onTurnStartSource[eventName];
      if (fns) {
        await fns(unit, underworld, prediction);
      }
    }
  }
  for (let i = 0; i < unit.events.length; i++) {
    const eventName = unit.events[i];
    if (eventName) {
      const fne = Events.default.onTurnEndSource[eventName];
      if (fne) {
        await fne(unit, underworld, prediction);
      }
    }
  }
}
const {
  Particles: Particles$5,
  particleEmitter: particleEmitter$2
} = globalThis.SpellmasonsAPI;
function makeFlameStrikeWithParticles(position, prediction, resolver) {
  if (prediction || globalThis.headless) {
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = Particles$5.createParticleTexture();
  if (!texture) {
    Particles$5.logNoTextureWarning("makeFlameStrikeAttack");
    return;
  }
  const config2 = particleEmitter$2.upgradeConfig({
    autoUpdate: true,
    "alpha": {
      "start": 0.425,
      "end": 0.25
    },
    "scale": {
      "start": 1.5,
      "end": 3,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#ebc323",
      "end": "#e63e1c"
    },
    "speed": {
      "start": 400,
      "end": 0,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": -500
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 80,
      "max": 100
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 0.5,
      "max": 1.3
    },
    "blendMode": "normal",
    "frequency": 4e-3,
    "emitterLifetime": 1.2,
    "maxParticles": 230,
    "pos": {
      "x": 0,
      "y": -300
    },
    "addAtBack": false,
    "spawnType": "rect",
    "spawnRect": {
      "x": -5,
      "y": 180,
      "w": 10,
      "h": 0
    }
  }, [texture]);
  Particles$5.simpleEmitter(position, config2, resolver);
}
const {
  cardUtils: cardUtils$e,
  commonTypes: commonTypes$p,
  PlanningView: PlanningView$1,
  cards: cards$m
} = globalThis.SpellmasonsAPI;
const { drawUICircle } = PlanningView$1;
const Unit$k = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$c } = cardUtils$e;
const { refundLastSpell: refundLastSpell$i } = cards$m;
const { CardCategory: CardCategory$p, probabilityMap: probabilityMap$p, CardRarity: CardRarity$o } = commonTypes$p;
const cardId$d = "FlameStrike";
const damageMain = 40;
const damageSplash = 10;
const splashRadius = 64;
const spell$o = {
  card: {
    id: cardId$d,
    category: CardCategory$p.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$p[CardRarity$o.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFlameStrike.png",
    sfx: "burst",
    description: [`Deals ${damageMain} damage to the target and ${damageSplash} damage to nearby targets in a small area.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise((resolve) => {
        const targets = state.targetedUnits.filter((u) => u.alive);
        const adjustedRadius = getAdjustedRadius(state.aggregator.radiusBoost);
        if (targets.length == 0) {
          refundLastSpell$i(state, prediction);
          resolve();
        }
        for (let unit of targets) {
          const explosionTargets = underworld.getUnitsWithinDistanceOfTarget(unit, adjustedRadius, prediction);
          const quantityAdjustedDamageMain = damageMain * quantity;
          const quantityAdjustedDamageSplash = damageSplash * quantity;
          if (!prediction && !globalThis.headless) {
            playDefaultSpellSFX$c(card, prediction);
            setTimeout(() => {
              explosionTargets.forEach((t) => {
                const damage = t == unit ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
                Unit$k.takeDamage({ unit: t, amount: damage, sourceUnit: state.casterUnit }, underworld, prediction);
              });
              resolve();
            }, 400);
            makeFlameStrikeWithParticles(unit, prediction);
          } else {
            if (prediction) {
              drawUICircle(globalThis.predictionGraphicsRed, unit, adjustedRadius, 13981270);
            }
            explosionTargets.forEach((t) => {
              const damage = t == unit ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
              Unit$k.takeDamage({ unit: t, amount: damage, sourceUnit: state.casterUnit }, underworld, prediction);
            });
            resolve();
          }
        }
      });
      return state;
    }
  }
};
function getAdjustedRadius(radiusBoost2 = 0) {
  return splashRadius * (1 + 0.5 * radiusBoost2);
}
const {
  cardUtils: cardUtils$d,
  commonTypes: commonTypes$o,
  cards: cards$l,
  cardsUtil: cardsUtil$5,
  JImage: JImage$2,
  JAudio: JAudio$4,
  FloatingText: FloatingText$4
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$h } = cards$l;
const Unit$j = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$b } = cardUtils$d;
const { CardCategory: CardCategory$o, probabilityMap: probabilityMap$o, CardRarity: CardRarity$n } = commonTypes$o;
const cardId$c = "Grace";
var healingAmount$1 = -40;
const spell$n = {
  card: {
    id: cardId$c,
    category: CardCategory$o.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$o[CardRarity$n.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconGrace.png",
    sfx: "purify",
    //TODO
    description: [`Heals the target for ${-healingAmount$1} after 3 turns. Stacks increase the amount, but do not change duration`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$h(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$b(card, prediction);
        }
        for (let unit of targets) {
          Unit$j.addModifier(unit, card.id, underworld, prediction, 0, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$5
  },
  events: {
    onTurnStart: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$c];
      if (modifier) {
        modifier.graceCountdown--;
        updateTooltip$2(unit);
        if (modifier.graceCountdown <= 0) {
          let healing = calculateGraceHealing(modifier.graceQuantity);
          Unit$j.takeDamage({ unit, amount: healing }, underworld, prediction);
          if (!prediction) {
            FloatingText$4.default({
              coords: unit,
              text: `Grace +${-healing} health`,
              style: { fill: "#40a058", strokeThickness: 1 }
            });
            JImage$2.addOneOffAnimation(unit, "potionPickup", {}, { animationSpeed: 0.3, loop: false });
            JAudio$4.playSFXKey("potionPickupHealth");
          }
          Unit$j.removeModifier(unit, cardId$c, underworld);
        }
      }
    }
  }
};
function add$5(unit, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$5.getOrInitModifier(unit, cardId$c, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$c);
  });
  if (!modifier.graceCountdown) {
    modifier.graceCountdown = 3;
  }
  modifier.graceQuantity = (modifier.graceQuantity || 0) + extra.amount;
  if (!prediction) {
    updateTooltip$2(unit);
  }
}
function updateTooltip$2(unit) {
  const modifier = unit.modifiers && unit.modifiers[cardId$c];
  if (modifier) {
    modifier.tooltip = `${modifier.graceCountdown} turns until healed for ${-calculateGraceHealing(modifier.graceQuantity)}`;
  }
}
function calculateGraceHealing(graceQuantity) {
  return graceQuantity * healingAmount$1;
}
const {
  cardUtils: cardUtils$c,
  commonTypes: commonTypes$n,
  cards: cards$k,
  Particles: Particles$4,
  FloatingText: FloatingText$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$g } = cards$k;
const Unit$i = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$a } = cardUtils$c;
const { CardCategory: CardCategory$n, probabilityMap: probabilityMap$n, CardRarity: CardRarity$m, UnitType: UnitType$4 } = commonTypes$n;
const cardId$b = "Harvest";
const manaRegain = 20;
const spell$m = {
  card: {
    id: cardId$b,
    category: CardCategory$n.Mana,
    supportQuantity: false,
    manaCost: 0,
    healthCost: 35,
    expenseScaling: 1,
    probability: probabilityMap$n[CardRarity$m.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconHarvest.png",
    sfx: "sacrifice",
    description: [`Consumes target corpse for ${manaRegain} mana. Does not work on player corpses. Unstackable.

Tastes like chicken.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      let totalManaHarvested = 0;
      const targets = state.targetedUnits.filter((u) => !u.alive && u.unitType != UnitType$4.PLAYER_CONTROLLED && u.flaggedForRemoval != true);
      for (let unit of targets) {
        totalManaHarvested += manaRegain * quantity;
        const manaTrailPromises = [];
        if (!prediction) {
          manaTrailPromises.push(Particles$4.makeManaTrail(unit, state.casterUnit, underworld, "#e4ffee", "#40ff66", targets.length * quantity));
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$a(card, prediction);
        }
        for (let unit of targets) {
          Unit$i.cleanup(unit);
        }
        state.casterUnit.mana += totalManaHarvested;
      });
      if (targets.length == 0 && !totalManaHarvested) {
        refundLastSpell$g(state, prediction, "No corpses, health refunded");
      }
      if (!prediction && !!totalManaHarvested) {
        FloatingText$3.default({
          coords: state.casterUnit,
          text: `${totalManaHarvested} Mana Harvested`,
          style: { fill: "blue", strokeThickness: 1 }
        });
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$b,
  commonTypes: commonTypes$m,
  cards: cards$j,
  cardsUtil: cardsUtil$4,
  FloatingText: FloatingText$2
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$f } = cards$j;
const Unit$h = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$9 } = cardUtils$b;
const { CardCategory: CardCategory$m, probabilityMap: probabilityMap$m, CardRarity: CardRarity$l } = commonTypes$m;
const cardId$a = "Regenerate";
const spell$l = {
  card: {
    id: cardId$a,
    category: CardCategory$m.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$m[CardRarity$l.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconRegen.png",
    sfx: "heal",
    //TODO
    description: [`Heals the target for 10 health at the end of their turn for 5 turns. Stacks increase the amount and refresh the duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$f(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$9(card, prediction);
        }
        for (let unit of targets) {
          Unit$h.addModifier(unit, card.id, underworld, prediction, 5, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$4,
    remove: remove$2
  },
  events: {
    onTurnEnd: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$a];
      if (modifier) {
        const healing = healingAmount(modifier.regenCounter);
        Unit$h.takeDamage({ unit, amount: healing }, underworld, prediction);
        modifier.quantity--;
        if (!prediction) {
          updateTooltip$1(unit);
          FloatingText$2.default({
            coords: unit,
            text: `Regenerate +${-healing} health`,
            style: { fill: "#40a058", strokeThickness: 1 }
          });
        }
        if (modifier.quantity <= 0) {
          Unit$h.removeModifier(unit, cardId$a, underworld);
        }
      }
    }
  }
};
function remove$2(unit, underworld) {
  const modifier = unit.modifiers[cardId$a];
  if (modifier) {
    modifier.regenCounter = 0;
  }
}
function add$4(unit, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$4.getOrInitModifier(unit, cardId$a, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$a);
  });
  if (modifier.quantity > 5) {
    modifier.quantity = 5;
  }
  if (!prediction) {
    modifier.regenCounter = (modifier.regenCounter || 0) + extra.amount;
    updateTooltip$1(unit);
  }
}
function healingAmount(castquantity) {
  let healing = -10;
  if (castquantity > 0) {
    healing = castquantity * -10;
  }
  return healing;
}
function updateTooltip$1(unit) {
  const modifier = unit.modifiers && unit.modifiers[cardId$a];
  if (modifier) {
    modifier.tooltip = `Healing ${-healingAmount(modifier.regenCounter)} every ${modifier.quantity} turns`;
  }
}
const {
  cardUtils: cardUtils$a,
  commonTypes: commonTypes$l,
  cards: cards$i,
  cardsUtil: cardsUtil$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$e } = cards$i;
const Unit$g = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$8 } = cardUtils$a;
const { CardCategory: CardCategory$l, probabilityMap: probabilityMap$l, CardRarity: CardRarity$k } = commonTypes$l;
const cardId$9 = "Pacify";
const spell$k = {
  card: {
    id: cardId$9,
    category: CardCategory$l.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$l[CardRarity$k.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconPacify.png",
    sfx: "",
    description: [`Prevents the target from attacking for one turn. Stacks increase duration. Does not affect Support Class units such as summoners or priests.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !(u.unitSubType == 3));
      if (targets.length == 0) {
        refundLastSpell$e(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$8(card, prediction);
        }
        for (let unit of targets) {
          Unit$g.addModifier(unit, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$3,
    remove: remove$1
  },
  events: {
    onTurnEnd: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$9];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$g.removeModifier(unit, cardId$9, underworld);
        }
      }
    }
  }
};
function add$3(unit, underworld, prediction, quantity) {
  cardsUtil$3.getOrInitModifier(unit, cardId$9, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit.attackRange
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$9);
    unit.attackRange = 0;
  });
}
function remove$1(unit, underworld) {
  if (unit.modifiers && unit.modifiers[cardId$9]) {
    const originalRange = unit.modifiers[cardId$9].originalstat;
    if (originalRange && unit.attackRange == 0) {
      unit.attackRange = originalRange;
    }
  }
}
const {
  cardUtils: cardUtils$9,
  commonTypes: commonTypes$k,
  cards: cards$h,
  Particles: Particles$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$d } = cards$h;
const Unit$f = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$7 } = cardUtils$9;
const { CardCategory: CardCategory$k, probabilityMap: probabilityMap$k, CardRarity: CardRarity$j } = commonTypes$k;
const cardId$8 = "Vengeance";
const spell$j = {
  card: {
    id: cardId$8,
    category: CardCategory$k.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$k[CardRarity$j.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconVengeance.png",
    sfx: "hurt",
    description: [`Deals damage equal to your missing health. This harms you first if you are targeted, then enemies.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const targets = state.targetedUnits.filter((u) => u.alive);
      let [potentialCaster] = targets.filter((u) => u == state.casterUnit);
      if (!!potentialCaster && targets[0] != state.casterUnit) {
        targets.splice(targets.indexOf(state.casterUnit), 1);
        targets.unshift(state.casterUnit);
      }
      if (targets.length == 0 || state.casterUnit.health == state.casterUnit.healthMax) {
        refundLastSpell$d(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        const manaTrailPromises = [];
        if (!prediction) {
          for (let i = 0; i < quantity; i++) {
            manaTrailPromises.push(Particles$3.makeManaTrail(state.casterUnit, unit, underworld, "#ef4242", "#400d0d", targets.length * quantity));
          }
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$7(card, prediction);
        }
        for (let q = 0; q < quantity; q++) {
          for (let unit of targets) {
            Unit$f.takeDamage({ unit, amount: damageDone$1(state), sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
          }
        }
      });
      return state;
    }
  }
};
function damageDone$1(state) {
  let damageMain2 = state.casterUnit.healthMax - state.casterUnit.health;
  damageMain2 = Math.max(0, damageMain2);
  return damageMain2;
}
const mod$3 = {
  modName: "Wode's Grimoire",
  author: "Blood Spartan",
  description: "Adds 10 new spells to your arsenal.",
  //TODO make word good
  screenshot: "spellmasons-mods/Wodes_Grimoire/graphics/icons/Wodes_grimoire_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$s,
    spell$r,
    spell$q,
    spell$p,
    //Very buggy, absolutly no idea how I got this working, but it does /shrug
    spell$o,
    spell$n,
    spell$m,
    spell$l,
    spell$k,
    //Stasis, //Not working as intended, can still be pushed
    spell$j
  ],
  // This spritesheet allows spell icons to be used in player thought bubbles in multiplayer
  spritesheet: "spellmasons-mods/Wodes_Grimoire/graphics/wodes_grimoire_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$4,
  cardUtils: cardUtils$8,
  commonTypes: commonTypes$j,
  cards: cards$g
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$c } = cards$g;
const { containerSpells: containerSpells$2 } = PixiUtils$4;
const Unit$e = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$2 } = cardUtils$8;
const { CardCategory: CardCategory$j, probabilityMap: probabilityMap$j, CardRarity: CardRarity$i } = commonTypes$j;
const animationPath$3 = "VampBite";
const cardId$7 = "Vampire Bite";
const spell$i = {
  card: {
    id: cardId$7,
    category: CardCategory$j.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$j[CardRarity$i.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/VampireBite.png",
    animationPath: animationPath$3,
    sfx: "hurt",
    description: [`Deals 10 to the target and heals you for up to 50% damage done. Healing is not affected by modifiers, including blood curse`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$c(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        if (state.casterUnit.health < state.casterUnit.healthMax) {
          if (unit.health < 10 * quantity) {
            state.casterUnit.health += unit.health / 2;
          } else {
            state.casterUnit.health += 5 * quantity;
          }
          if (state.casterUnit.health > state.casterUnit.healthMax) {
            state.casterUnit.health = state.casterUnit.healthMax;
          }
        }
        if (!prediction) {
          oneOffImage$2(unit, animationPath$3, containerSpells$2);
        }
        Unit$e.takeDamage({ unit, amount: 10 * quantity, sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
      }
      state.casterUnit.health -= state.casterUnit.health % 1;
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 400);
        });
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$7,
  commonTypes: commonTypes$i,
  cards: cards$f,
  VisualEffects: VisualEffects$3,
  config: config$2,
  math: math$3,
  Pickup: Pickup$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$b } = cards$f;
const { playDefaultSpellSFX: playDefaultSpellSFX$6 } = cardUtils$7;
const { CardCategory: CardCategory$i, probabilityMap: probabilityMap$i, CardRarity: CardRarity$h } = commonTypes$i;
const cardId$6 = "Summon Trap";
const spell$h = {
  card: {
    id: cardId$6,
    category: CardCategory$i.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$i[CardRarity$h.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/SummonTrap.png",
    sfx: "hurt",
    description: [`Summons a trap that does 30 damage when stepped on`],
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const summonLocation = {
        x: state.castLocation.x,
        y: state.castLocation.y
      };
      for (let unit of underworld.units) {
        if (unit.alive && math$3.distance(unit, summonLocation) < config$2.COLLISION_MESH_RADIUS) {
          refundLastSpell$b(state, prediction, "Invalid summon location, mana refunded.");
          return state;
        }
      }
      if (underworld.isCoordOnWallTile(summonLocation)) {
        if (prediction)
          ;
        else {
          refundLastSpell$b(state, prediction, "Invalid summon location, mana refunded.");
        }
        return state;
      }
      playDefaultSpellSFX$6(card, prediction);
      const index = 0;
      if (!prediction) {
        VisualEffects$3.skyBeam(summonLocation);
        const pickup = underworld.spawnPickup(index, summonLocation, prediction);
        if (pickup) {
          Pickup$3.setPower(pickup, quantity);
        }
      } else {
        const pickup = underworld.spawnPickup(index, summonLocation, prediction);
        if (pickup) {
          Pickup$3.setPower(pickup, quantity);
        }
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$h,
  cards: cards$e
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$a } = cards$e;
const Unit$d = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$h, probabilityMap: probabilityMap$h, CardRarity: CardRarity$g } = commonTypes$h;
const retaliate = 0.15;
const cardId$5 = "Sadism";
const spell$g = {
  card: {
    id: cardId$5,
    category: CardCategory$h.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$h[CardRarity$g.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Sadism.png",
    sfx: "hurt",
    description: [`Damage to target equal to its attack, you receive ${retaliate * 100}% of that attack damage`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$a(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        let damage = unit.damage * quantity;
        Unit$d.takeDamage({ unit, amount: damage, fromVec2: state.casterUnit, sourceUnit: state.casterUnit }, underworld, prediction);
        Unit$d.takeDamage({ unit: state.casterUnit, amount: damage * retaliate }, underworld, prediction);
      }
      state.casterUnit.health -= state.casterUnit.health % 1;
      return state;
    }
  }
};
const {
  particleEmitter: particleEmitter$1,
  Particles: Particles$2,
  PixiUtils: PixiUtils$3,
  cardUtils: cardUtils$6,
  commonTypes: commonTypes$g,
  cards: cards$d,
  cardsUtil: cardsUtil$2,
  FloatingText: FloatingText$1,
  ParticleCollection: ParticleCollection$1
} = globalThis.SpellmasonsAPI;
const BURNING_RAGE_PARTICLE_EMITTER_NAME = "BURNING_RAGE";
function makeBurningRageParticles(follow, underworld, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles$2.createParticleTexture();
  if (!texture) {
    Particles$2.logNoTextureWarning("makeBurningRageParticles");
    return;
  }
  const particleConfig = particleEmitter$1.upgradeConfig({
    autoUpdate: true,
    "alpha": {
      "start": 1,
      "end": 0
    },
    "scale": {
      "start": 1,
      "end": 0.25,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#9e1818",
      "end": "#ffee00"
    },
    "speed": {
      "start": 20,
      "end": 60,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": -50
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 265,
      "max": 275
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 1,
      "max": 1.5
    },
    "blendMode": "normal",
    "frequency": 0.45,
    "emitterLifetime": -1,
    "maxParticles": 20,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "circle",
    "spawnCircle": {
      "x": 0,
      "y": 0,
      "r": 25
    }
  }, [texture]);
  if (PixiUtils$3.containerUnits) {
    const wrapped = Particles$2.wrappedEmitter(particleConfig, PixiUtils$3.containerUnits);
    if (wrapped) {
      const { container, emitter } = wrapped;
      emitter.name = BURNING_RAGE_PARTICLE_EMITTER_NAME;
      underworld.particleFollowers.push({
        displayObject: container,
        emitter,
        target: follow
      });
    } else {
      console.error("Failed to create BurnigRage particle emitter");
    }
  } else {
    return;
  }
}
const { refundLastSpell: refundLastSpell$9 } = cards$d;
const Unit$c = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$5 } = cardUtils$6;
const { CardCategory: CardCategory$g, probabilityMap: probabilityMap$g, CardRarity: CardRarity$f } = commonTypes$g;
const damageMultiplier$1 = 8;
const attackMultiplier = 5;
const cardId$4 = "Burning Rage";
const spell$f = {
  card: {
    id: cardId$4,
    category: CardCategory$g.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$g[CardRarity$f.RARE],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Burninig_rage.png",
    sfx: "poison",
    description: [`Each stack causes target to take ${damageMultiplier$1} damage, but also increases the target's damage by ${attackMultiplier}. Staks increase each turn`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$9(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$5(card, prediction);
        }
        for (let unit of targets) {
          Unit$c.addModifier(unit, card.id, underworld, prediction, quantity);
          unit.damage += quantity * attackMultiplier;
        }
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      }
      return state;
    }
  },
  modifiers: {
    add: add$2,
    remove
  },
  events: {
    onTurnStart: async (unit, underworld, prediction) => {
      const modifier = unit.modifiers[cardId$4];
      if (modifier && !prediction) {
        Unit$c.takeDamage({ unit, amount: modifier.quantity * damageMultiplier$1 }, underworld, prediction);
        FloatingText$1.default({
          coords: unit,
          text: `${modifier.quantity * damageMultiplier$1} rage damage`,
          style: { fill: "red", strokeThickness: 1 }
        });
        unit.damage += attackMultiplier;
        modifier.quantity++;
      }
    }
  }
};
function add$2(unit, underworld, prediction, quantity) {
  cardsUtil$2.getOrInitModifier(unit, cardId$4, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit, cardId$4);
    makeBurningRageParticles(unit, underworld, prediction);
  });
}
function remove(unit, underworld) {
  unit.damage -= unit.modifiers[cardId$4].quantity * attackMultiplier;
  unit.damage = Math.max(unit.damage, 0);
  for (let follower of underworld.particleFollowers) {
    if (follower.emitter.name === BURNING_RAGE_PARTICLE_EMITTER_NAME && follower.target == unit) {
      ParticleCollection$1.stopAndDestroyForeverEmitter(follower.emitter);
      break;
    }
  }
}
const {
  commonTypes: commonTypes$f,
  cards: cards$c,
  cardsUtil: cardsUtil$1,
  FloatingText
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$8 } = cards$c;
const Unit$b = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$f, probabilityMap: probabilityMap$f, CardRarity: CardRarity$e } = commonTypes$f;
const maxDuration = 3;
const distanceToDamageRatio = 0.05;
const cardId$3 = "Caltrops";
const spell$e = {
  card: {
    id: cardId$3,
    category: CardCategory$f.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$f[CardRarity$e.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/" + cardId$3 + ".png",
    sfx: "hurt",
    description: [`Target takes some damage it moves. Stacks, casting again replenishes duration up to ${maxDuration} turns. (Updates on turn change, recasts or damage)`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$8(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit of targets) {
        Unit$b.addModifier(unit, cardId$3, underworld, prediction, maxDuration, { amount: quantity });
        if (!prediction) {
          triggerDistanceDamage(unit, underworld, prediction);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$1
  },
  events: {
    //onMove: (unit, newLocation) => {triggerDistanceDamage(unit);return newLocation},
    onTakeDamage: (unit, amount2, underworld, prediction) => {
      triggerDistanceDamage(unit, underworld, prediction);
      return amount2;
    },
    onTurnStart: async (unit, underworld, prediction) => {
      triggerDistanceDamage(unit, underworld, prediction);
    },
    onTurnEnd: async (unit, underworld, prediction) => {
      triggerDistanceDamage(unit, underworld, prediction);
    }
  }
};
function add$1(unit, _underworld, prediction, quantity, extra) {
  let firstStack = !unit.events.includes(cardId$3);
  const modifier = cardsUtil$1.getOrInitModifier(unit, cardId$3, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (firstStack) {
      SpellmasonsAPI.Unit.addEvent(unit, cardId$3);
    }
  });
  if (firstStack) {
    modifier.last_x = unit.x;
    modifier.last_y = unit.y;
  }
  if (modifier.quantity > maxDuration) {
    modifier.quantity = maxDuration;
  }
  if (!prediction) {
    modifier.caltropsCounter = (modifier.caltropsCounter || 0) + extra.amount;
    updateTooltip(unit);
  }
}
function caltropsAmount(castquantity) {
  let caltrops = 1;
  if (castquantity > 0) {
    caltrops = castquantity * 1;
  }
  return caltrops;
}
function updateTooltip(unit) {
  const modifier = unit.modifiers && unit.modifiers[cardId$3];
  if (modifier) {
    modifier.tooltip = `When target moves deal ${caltropsAmount(modifier.caltropsCounter)} damage, lasts ${modifier.quantity} turns`;
  }
}
function triggerDistanceDamage(unit, underworld, prediction = false) {
  if (!unit.alive) {
    return;
  }
  const modifier = unit.modifiers && unit.modifiers[cardId$3];
  let x_diff = unit.x - modifier.last_x;
  let y_diff = unit.y - modifier.last_y;
  if (x_diff == 0 && y_diff == 0) {
    return;
  }
  let damage = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
  damage = damage * distanceToDamageRatio * modifier.caltropsCounter;
  damage -= damage % 1;
  if (!modifier || damage < 1) {
    return;
  }
  modifier.last_x = unit.x;
  modifier.last_y = unit.y;
  Unit$b.takeDamage({ unit, amount: damage }, underworld, prediction);
  if (!prediction) {
    FloatingText.default({
      coords: unit,
      text: `${damage} caltrops damage`,
      style: { fill: "#grey", strokeThickness: 1 }
    });
  }
}
const mod$2 = {
  modName: "Renes gimmicks",
  author: "Renesans123/Edeusz",
  description: "Adds some new spells to the game",
  screenshot: "spellmasons-mods/Renes_gimmicks/graphics/icons/Renes_Gimmicks_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$i,
    spell$h,
    spell$g,
    spell$f,
    spell$e
    //OnMove doesnt seem to be implemented
    //Thorns,//composeOnDamageEvents do not pass argument damageDealer right now
  ],
  spritesheet: "spellmasons-mods/Renes_gimmicks/graphics/icons/renes_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$2,
  commonTypes: commonTypes$e,
  cards: cards$b,
  cardUtils: cardUtils$5,
  Unit: Unit$a,
  JPromise
} = globalThis.SpellmasonsAPI;
const { oneOffImage: oneOffImage$1, playDefaultSpellSFX: playDefaultSpellSFX$4, playSpellSFX } = cardUtils$5;
const { refundLastSpell: refundLastSpell$7 } = cards$b;
const { CardCategory: CardCategory$e, probabilityMap: probabilityMap$e, CardRarity: CardRarity$d } = commonTypes$e;
const { containerSpells: containerSpells$1 } = PixiUtils$2;
const animationPath$2 = "spellGravity";
const cardId$2 = "Gravity";
const percentDamage = 0.1;
const spell$d = {
  card: {
    id: cardId$2,
    category: CardCategory$e.Damage,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$e[CardRarity$d.RARE],
    animationPath: animationPath$2,
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/Gravity.png",
    sfx: "pull",
    description: [`Deals damage to target(s) equal to ${percentDamage * 100}% of its current health.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playSpellSFX("push", prediction);
        let promises = [];
        for (let unit of targets) {
          promises.push(new Promise((res) => {
            oneOffImage$1(unit, animationPath$2, containerSpells$1, res);
            setTimeout(() => {
              playDefaultSpellSFX$4(card, prediction);
            }, 1e3);
          }));
        }
        await JPromise.raceTimeout(2e3, "Gravity attack animation", Promise.all(promises));
      }
      for (let unit of targets) {
        let damage = unit.health * percentDamage * quantity;
        Unit$a.takeDamage({
          unit,
          amount: damage,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
      }
      if (targets.length == 0) {
        refundLastSpell$7(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$d,
  cards: cards$a,
  Unit: Unit$9,
  cardUtils: cardUtils$4,
  PixiUtils: PixiUtils$1
} = globalThis.SpellmasonsAPI;
const { oneOffImage, playDefaultSpellSFX: playDefaultSpellSFX$3 } = cardUtils$4;
const { refundLastSpell: refundLastSpell$6 } = cards$a;
const { CardCategory: CardCategory$d, probabilityMap: probabilityMap$d, CardRarity: CardRarity$c } = commonTypes$d;
const { containerSpells } = PixiUtils$1;
const cardId$1 = "Limit Blast";
const animationPath$1 = "Limit Glove";
const healthRequirement = 0.3;
const baseDamage = 5;
const damageMultiplier = 10;
const spell$c = {
  card: {
    id: cardId$1,
    category: CardCategory$d.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$d[CardRarity$c.UNCOMMON],
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/LimitGlove.png",
    animationPath: animationPath$1,
    sfx: "debilitate",
    description: [`Deals ${baseDamage} damage to target(s). If caster's health is ${healthRequirement * 100}% or less, deals ${baseDamage * damageMultiplier} damage instead.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$6(state, prediction, "No valid targets. Cost refunded.");
        return state;
      }
      if (!prediction && !globalThis.headless) {
        for (let unit of targets) {
          oneOffImage(unit, animationPath$1, containerSpells);
        }
        playDefaultSpellSFX$3(card, prediction);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      for (let unit of targets) {
        let healthReqCalc = state.casterUnit.healthMax * healthRequirement;
        let damage = baseDamage;
        if (state.casterUnit.health <= healthReqCalc) {
          damage = damage * damageMultiplier;
        }
        Unit$9.takeDamage({
          unit,
          amount: damage * quantity,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      return state;
    }
  }
};
const {
  Particles: Particles$1,
  ParticleCollection,
  particleEmitter,
  commonTypes: commonTypes$c,
  Unit: Unit$8,
  PlanningView,
  colors: colors$3,
  cardUtils: cardUtils$3
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$c, probabilityMap: probabilityMap$c, CardRarity: CardRarity$b } = commonTypes$c;
const { drawUICirclePrediction } = PlanningView;
const { playDefaultSpellSFX: playDefaultSpellSFX$2 } = cardUtils$3;
const { simpleEmitter } = Particles$1;
function makeWhiteWindParticles(position, radius, underworld, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles$1.createParticleTexture();
  if (!texture) {
    return;
  }
  const particleConfig = particleEmitter.upgradeConfig({
    "alpha": {
      "start": 1,
      "end": 0
    },
    "scale": {
      "start": 0.5,
      "end": 0.05,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#ffffff",
      "end": "#ffffff"
    },
    "speed": {
      "start": radius * 1.5,
      "end": 0,
      "minimumSpeedMultiplier": 1
    },
    "acceleration": {
      "x": 0,
      "y": 0
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 90,
      "max": 180
    },
    "noRotation": true,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 0.2,
      "max": 0.8
    },
    "blendMode": "add",
    "frequency": 1e-3,
    "emitterLifetime": waitTime / 2,
    "maxParticles": 500 * radius,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "ring",
    "spawnCircle": {
      "x": 0,
      "y": 0,
      "r": radius,
      "minR": 0
    }
  }, [texture]);
  simpleEmitter(position, particleConfig);
}
const cardId = "Healing Breeze";
const baseRange = 100;
const waitTime = 2;
const spell$b = {
  card: {
    id: cardId,
    category: CardCategory$c.Blessings,
    supportQuantity: true,
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$c[CardRarity$b.RARE],
    allowNonUnitTarget: true,
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/WhiteWind.png",
    sfx: "heal",
    description: [`Heals targets in an area around self equal to own health.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let adjustedRange = baseRange * (1 + (quantity - 1) * 0.5 + 0.25 * state.aggregator.radiusBoost);
      if (prediction) {
        drawUICirclePrediction(state.casterUnit, adjustedRange, colors$3.targetingSpellGreen, "Target Radius");
      } else {
        makeWhiteWindParticles(state.casterUnit, adjustedRange, underworld, prediction);
      }
      if (!prediction && !globalThis.headless) {
        await new Promise((resolve) => {
          setTimeout(resolve, waitTime * 1e3);
        });
      }
      let entities = underworld.getEntitiesWithinDistanceOfTarget(state.casterUnit, adjustedRange, prediction);
      for (let entity of entities) {
        if (Unit$8.isUnit(entity)) {
          let target = entity;
          Unit$8.takeDamage({ unit: target, amount: -state.casterUnit.health }, underworld, prediction);
        }
        playDefaultSpellSFX$2(card, prediction);
      }
      return state;
    }
  }
};
const {
  cards: cards$9,
  Pickup: Pickup$2,
  Unit: Unit$7,
  math: math$2,
  commonTypes: commonTypes$b
} = globalThis.SpellmasonsAPI;
const { addTarget: addTarget$2 } = cards$9;
const { CardCategory: CardCategory$b, probabilityMap: probabilityMap$b } = commonTypes$b;
const UNITS_PER_STACK = 3;
function generateTargetHpMultipleOfSpell(multipleOf, manaCost, requiredId, rarity) {
  let reqId;
  if (requiredId) {
    if (requiredId == "Prime") {
      reqId = ["Target Health Prime"];
    } else {
      reqId = [`Target Health * ${requiredId}`];
    }
  } else {
    reqId = void 0;
  }
  return {
    card: {
      id: `Target Health * ${multipleOf}`,
      requires: reqId,
      category: CardCategory$b.Targeting,
      supportQuantity: true,
      manaCost,
      healthCost: 0,
      expenseScaling: 1,
      probability: probabilityMap$b[rarity],
      thumbnail: `spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TargetHp${multipleOf}.png`,
      requiresFollowingCard: true,
      description: [`Target ${UNITS_PER_STACK} living units (per stack) with health that is any multiple of ${multipleOf}, starting with the closest from the target point.`],
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
        const targets = underworld.getPotentialTargets(prediction).filter((u) => {
          if (Unit$7.isUnit(u)) {
            return u.alive && u.health % multipleOf == 0;
          } else {
            return false;
          }
        }).sort(math$2.sortCosestTo(state.castLocation)).slice(0, UNITS_PER_STACK * quantity);
        for (let target of targets) {
          addTarget$2(target, state, underworld, prediction);
        }
        return state;
      }
    }
  };
}
function isPrime(num) {
  if (num <= 1) {
    return false;
  }
  for (let n = 2; n < num; n++) {
    if (num % n == 0) {
      return false;
    }
  }
  return true;
}
const TargetHp3 = generateTargetHpMultipleOfSpell(3, 30, "Prime", commonTypes$b.CardRarity.UNCOMMON);
const TargetHp4 = generateTargetHpMultipleOfSpell(4, 35, 3, commonTypes$b.CardRarity.RARE);
const TargetHp5 = generateTargetHpMultipleOfSpell(5, 40, 4, commonTypes$b.CardRarity.FORBIDDEN);
const TargetHpPrime = {
  card: {
    id: `Target Health Prime`,
    category: CardCategory$b.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 4,
    probability: probabilityMap$b[commonTypes$b.CardRarity.COMMON],
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TargetHpPrime.png",
    requiresFollowingCard: true,
    description: [`Target ${UNITS_PER_STACK} living units (per stack) with health that is any prime number, starting with the closest from the target point.`],
    allowNonUnitTarget: true,
    ignoreRange: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const targets = underworld.getPotentialTargets(prediction).filter((u) => {
        if (Unit$7.isUnit(u)) {
          return u.alive && isPrime(u.health);
        } else {
          return false;
        }
      }).sort(math$2.sortCosestTo(state.castLocation)).slice(0, UNITS_PER_STACK * quantity);
      for (let target of targets) {
        addTarget$2(target, state, underworld, prediction);
      }
      return state;
    }
  }
};
const mod$1 = {
  modName: "DaiNekoIchi's Tome of Spells",
  author: "DaiNekoIchi, PADS",
  description: "Adds several spells (probably heavily inspired from Final Fantasy)",
  screenshot: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TomeOfSpellsIcon.png",
  spells: [
    spell$d,
    spell$c,
    spell$b,
    TargetHpPrime,
    TargetHp3,
    TargetHp4,
    TargetHp5
  ],
  spritesheet: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/spritesheet.json"
};
const urn_explosive_id$1 = "Explosive Urn";
const urn_poison_id$1 = "Toxic Urn";
const urn_ice_id$1 = "Ice Urn";
const {
  cardUtils: cardUtils$2,
  commonTypes: commonTypes$a,
  cards: cards$8,
  VisualEffects: VisualEffects$2,
  rand: rand$4,
  units: units$1,
  Pickup: Pickup$1,
  Unit: Unit$6,
  JAudio: JAudio$3
} = globalThis.SpellmasonsAPI;
const { chooseObjectWithProbability: chooseObjectWithProbability$1, getUniqueSeedString: getUniqueSeedString$2 } = rand$4;
const { allUnits: allUnits$1 } = units$1;
const { refundLastSpell: refundLastSpell$5, addUnitTarget: addUnitTarget$1 } = cards$8;
const { playDefaultSpellSFX: playDefaultSpellSFX$1 } = cardUtils$2;
const { CardCategory: CardCategory$a, probabilityMap: probabilityMap$a, CardRarity: CardRarity$a, Faction: Faction$1, UnitType: UnitType$3 } = commonTypes$a;
const chaosWarpCardId = "Chaos Warp";
const spell$a = {
  card: {
    id: chaosWarpCardId,
    category: CardCategory$a.Soul,
    supportQuantity: false,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$a[CardRarity$a.UNCOMMON],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/ChaosWarp.png",
    sfx: "summonDecoy",
    description: [`Summons a random item. Potion, Trap, Urn, Portal`],
    allowNonUnitTarget: true,
    effect: async (state, card, _quantity, underworld, prediction) => {
      const summonLocation = {
        x: state.castLocation.x,
        y: state.castLocation.y
      };
      if (!underworld.isPointValidSpawn(summonLocation, prediction)) {
        refundLastSpell$5(state, prediction, "Invalid summon location, mana refunded.");
        return state;
      }
      const seed = rand$4.seedrandom(`${getUniqueSeedString$2(underworld, state.casterPlayer)}${state.castLocation.x}${state.castLocation.y}`);
      const randomEffect = rand$4.randInt(0, 10, seed);
      if (randomEffect <= 5) {
        const choicePotion = chooseObjectWithProbability$1(Pickup$1.pickups.map((p, indexPotion) => {
          return {
            indexPotion,
            probability: p.name.includes("Potion") ? p.probability : 0
          };
        }), seed);
        if (choicePotion) {
          const { indexPotion } = choicePotion;
          underworld.spawnPickup(indexPotion, summonLocation, prediction);
          if (!prediction) {
            JAudio$3.playSFXKey("spawnPotion");
            VisualEffects$2.skyBeam(summonLocation);
          }
        } else {
          refundLastSpell$5(state, prediction);
        }
      } else if (randomEffect <= 7) {
        playDefaultSpellSFX$1(card, prediction);
        const index = 0;
        underworld.spawnPickup(index, summonLocation, prediction);
        if (!prediction) {
          VisualEffects$2.skyBeam(summonLocation);
        }
        return state;
      } else if (randomEffect <= 9) {
        const urnID = rand$4.chooseOneOfSeeded([urn_explosive_id$1, urn_ice_id$1, urn_poison_id$1], seed);
        if (urnID !== void 0) {
          let sourceUnit = allUnits$1[urnID];
          if (sourceUnit) {
            const unit = Unit$6.create(
              urnID,
              summonLocation.x,
              summonLocation.y,
              Faction$1.ALLY,
              sourceUnit.info.image,
              UnitType$3.AI,
              sourceUnit.info.subtype,
              sourceUnit.unitProps,
              underworld,
              prediction
            );
            unit.healthMax *= 1;
            unit.health *= 1;
            unit.damage *= 1;
            addUnitTarget$1(unit, state, prediction);
            if (!prediction) {
              VisualEffects$2.skyBeam(summonLocation);
            }
          } else {
            refundLastSpell$5(state, prediction);
          }
        } else {
          refundLastSpell$5(state, prediction);
        }
      } else if (randomEffect > 9) {
        const portalPickupSource = Pickup$1.pickups.find((p) => p.name == Pickup$1.PORTAL_PURPLE_NAME);
        if (portalPickupSource) {
          if (!prediction) {
            Pickup$1.create({ pos: summonLocation, pickupSource: portalPickupSource, logSource: "Chaos Warp Portal" }, underworld, prediction);
            VisualEffects$2.skyBeam(summonLocation);
          }
        } else {
          refundLastSpell$5(state, prediction);
        }
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$9,
  cards: cards$7,
  VisualEffects: VisualEffects$1,
  rand: rand$3,
  Pickup,
  JAudio: JAudio$2
} = globalThis.SpellmasonsAPI;
const { chooseObjectWithProbability, getUniqueSeedString: getUniqueSeedString$1 } = rand$3;
const { refundLastSpell: refundLastSpell$4 } = cards$7;
const { CardCategory: CardCategory$9, probabilityMap: probabilityMap$9, CardRarity: CardRarity$9 } = commonTypes$9;
const chaosWarpPotionCardId = "Chaos Warp - Potion";
const spell$9 = {
  card: {
    id: chaosWarpPotionCardId,
    category: CardCategory$9.Soul,
    supportQuantity: false,
    requires: [chaosWarpCardId],
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$9[CardRarity$9.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/ChaosWarpPotion.png",
    sfx: "spawnPotion",
    description: [`Summons a random Potion`],
    allowNonUnitTarget: true,
    effect: async (state, card, _quantity, underworld, prediction) => {
      const summonLocation = {
        x: state.castLocation.x,
        y: state.castLocation.y
      };
      if (!underworld.isPointValidSpawn(summonLocation, prediction)) {
        refundLastSpell$4(state, prediction, "Invalid summon location, mana refunded.");
        return state;
      }
      const seed = rand$3.seedrandom(`${getUniqueSeedString$1(underworld, state.casterPlayer)}${state.castLocation.x}${state.castLocation.y}`);
      const choicePotion = chooseObjectWithProbability(Pickup.pickups.map((p, indexPotion) => {
        return {
          indexPotion,
          probability: p.name.includes("Potion") ? p.probability : 0
        };
      }), seed);
      if (choicePotion) {
        const { indexPotion } = choicePotion;
        underworld.spawnPickup(indexPotion, summonLocation, prediction);
        if (!prediction) {
          JAudio$2.playSFXKey("spawnPotion");
          VisualEffects$1.skyBeam(summonLocation);
        }
      } else {
        refundLastSpell$4(state, prediction);
      }
      return state;
    }
  }
};
const urn_explosive_id = "Explosive Urn";
const urn_poison_id = "Toxic Urn";
const urn_ice_id = "Ice Urn";
const {
  commonTypes: commonTypes$8,
  cards: cards$6,
  VisualEffects,
  rand: rand$2,
  units,
  Unit: Unit$5
} = globalThis.SpellmasonsAPI;
const { allUnits } = units;
const { getUniqueSeedString } = rand$2;
const { refundLastSpell: refundLastSpell$3, addUnitTarget } = cards$6;
const { CardCategory: CardCategory$8, probabilityMap: probabilityMap$8, CardRarity: CardRarity$8, Faction, UnitType: UnitType$2 } = commonTypes$8;
const chaosWarpUrnCardId = "Chaos Warp - Urn";
const spell$8 = {
  card: {
    id: chaosWarpUrnCardId,
    category: CardCategory$8.Soul,
    supportQuantity: false,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1.5,
    requires: [chaosWarpCardId],
    probability: probabilityMap$8[CardRarity$8.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/ChaosWarpUrn.png",
    sfx: "summonDecoy",
    description: [`Summons a random Urn.`],
    allowNonUnitTarget: true,
    effect: async (state, card, _quantity, underworld, prediction) => {
      const summonLocation = {
        x: state.castLocation.x,
        y: state.castLocation.y
      };
      if (!underworld.isPointValidSpawn(summonLocation, prediction)) {
        refundLastSpell$3(state, prediction, "Invalid summon location, mana refunded.");
        return state;
      }
      const seedString = `${getUniqueSeedString(underworld, state.casterPlayer)}${state.castLocation.x}${state.castLocation.y}`;
      const seed = rand$2.seedrandom(seedString);
      const urnID = rand$2.chooseOneOfSeeded([urn_explosive_id, urn_ice_id, urn_poison_id], seed);
      if (urnID !== void 0) {
        let sourceUnit = allUnits[urnID];
        if (sourceUnit) {
          const unit = Unit$5.create(
            urnID,
            summonLocation.x,
            summonLocation.y,
            Faction.ALLY,
            sourceUnit.info.image,
            UnitType$2.AI,
            sourceUnit.info.subtype,
            sourceUnit.unitProps,
            underworld,
            prediction
          );
          unit.healthMax *= 1;
          unit.health *= 1;
          unit.damage *= 1;
          addUnitTarget(unit, state, prediction);
          if (!prediction) {
            VisualEffects.skyBeam(summonLocation);
          }
        } else {
          refundLastSpell$3(state, prediction);
        }
      } else {
        refundLastSpell$3(state, prediction);
      }
      return state;
    }
  }
};
const plusRadiusId = "Plus Radius";
const {
  commonTypes: commonTypes$7,
  cards: cards$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$2 } = cards$5;
const { CardCategory: CardCategory$7, probabilityMap: probabilityMap$7, CardRarity: CardRarity$7, UnitType: UnitType$1 } = commonTypes$7;
const targetDistanceId = "Distance Increase";
const radiusBoost = 20;
const spell$7 = {
  card: {
    id: targetDistanceId,
    category: CardCategory$7.Blessings,
    supportQuantity: true,
    requires: [plusRadiusId],
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$7[CardRarity$7.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Distance_Increase.png",
    description: "Increases a unit's attack range.  Does not affect Spellmasons.",
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const units2 = state.targetedUnits.filter((u) => u.unitType !== UnitType$1.PLAYER_CONTROLLED);
      for (let unit of units2) {
        unit.attackRange += radiusBoost * quantity;
      }
      if (units2.length === 0) {
        refundLastSpell$2(state, prediction, "No Target!");
      }
      return state;
    }
  }
};
const thornsId = "Thorns";
const {
  commonTypes: commonTypes$6,
  rand: rand$1,
  Unit: Unit$4,
  JImage: JImage$1,
  cardUtils: cardUtils$1,
  cardsUtil
} = globalThis.SpellmasonsAPI;
const { getOrInitModifier } = cardsUtil;
const { playDefaultSpellSFX } = cardUtils$1;
const { CardCategory: CardCategory$6, probabilityMap: probabilityMap$6, CardRarity: CardRarity$6 } = commonTypes$6;
const reflectCardId = "Reflect";
const reflectMultiplier = 0.2;
let caster;
const modifierImagePath = "modifierShield.png";
function add(unit, underworld, prediction, quantity = 1) {
  getOrInitModifier(unit, reflectCardId, { isCurse: false, quantity }, () => {
    Unit$4.addEvent(unit, reflectCardId);
  });
}
const spell$6 = {
  card: {
    id: reflectCardId,
    category: CardCategory$6.Blessings,
    supportQuantity: true,
    manaCost: 80,
    healthCost: 0,
    expenseScaling: 3,
    costGrowthAlgorithm: "nlogn",
    probability: probabilityMap$6[CardRarity$6.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Reflect.png",
    animationPath: "spellShield",
    description: `Reflects ` + (reflectMultiplier * 100).toString() + `% of damage received back to attackers.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits.filter((u) => u.alive)) {
        caster = state;
        let animationPromise = Promise.resolve();
        animationPromise = JImage$1.addOneOffAnimation(unit, "priestProjectileHit", {}, { loop: false });
        playDefaultSpellSFX(card, prediction);
        await animationPromise;
        Unit$4.addModifier(unit, reflectCardId, underworld, prediction);
      }
      return state;
    }
  },
  modifiers: {
    //stage: `Reflect`,
    add,
    addModifierVisuals(unit) {
      const animatedReflectSprite = JImage$1.addSubSprite(unit.image, modifierImagePath);
      if (animatedReflectSprite) {
        animatedReflectSprite.tint = 16716032;
      }
    },
    subsprite: {
      imageName: modifierImagePath,
      alpha: 0.65,
      anchor: {
        x: 0.5,
        y: 0.5
      },
      scale: {
        x: 1.25,
        y: 1.25
      }
    }
  },
  events: {
    onTooltip: (unit, underworld) => {
      const modifier = unit.modifiers[reflectCardId];
      if (modifier) {
        if (modifier.quantity == 1) {
          modifier.tooltip = `Reflects ` + (reflectMultiplier * 100).toString() + `% of damage received back to attacker ` + modifier.quantity.toString() + ` time.`;
        } else {
          modifier.tooltip = `Reflects ` + (reflectMultiplier * 100).toString() + `% of damage received back to attacker ` + modifier.quantity.toString() + ` times.`;
        }
      }
    },
    onTakeDamage: (unit, amount2, _underworld, prediction, damageDealer) => {
      const modifier = unit.modifiers[reflectCardId];
      if (modifier) {
        if (damageDealer && amount2 > 0) {
          damageDealer.events = damageDealer.events.filter((x) => x !== reflectCardId);
          damageDealer.events = damageDealer.events.filter((x) => x !== thornsId);
          Unit$4.takeDamage({
            unit: damageDealer,
            amount: amount2 * reflectMultiplier,
            sourceUnit: unit
          }, _underworld, prediction);
          if (damageDealer.modifiers[reflectCardId]) {
            Unit$4.addEvent(damageDealer, reflectCardId);
          }
          if (damageDealer.modifiers[thornsId]) {
            Unit$4.addEvent(damageDealer, thornsId);
          }
          modifier.quantity -= 1;
          if (modifier.quantity == 0) {
            Unit$4.removeModifier(caster.casterUnit, reflectCardId, _underworld);
          }
        }
      }
      return amount2;
    }
  }
};
const {
  commonTypes: commonTypes$5,
  cards: cards$4
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$5, probabilityMap: probabilityMap$5, CardRarity: CardRarity$5, UnitType } = commonTypes$5;
const { refundLastSpell: refundLastSpell$1 } = cards$4;
const reinforceCardId = "Reinforce";
const reinforceAmount = 20;
const spell$5 = {
  card: {
    id: reinforceCardId,
    category: CardCategory$5.Blessings,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$5[CardRarity$5.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Reinforce.png",
    animationPath: "potionPickup",
    description: "Increases Max HP by " + reinforceAmount.toString() + ".  Does not affect Spellmasons.",
    effect: async (state, card, quantity, underworld, prediction) => {
      const units2 = state.targetedUnits.filter((u) => u.unitType !== UnitType.PLAYER_CONTROLLED);
      for (let unit of units2) {
        unit.healthMax += reinforceAmount;
        unit.health += reinforceAmount;
      }
      if (units2.length === 0) {
        refundLastSpell$1(state, prediction);
      }
      return state;
    }
  }
};
const {
  colors: colors$2,
  JImage
} = globalThis.SpellmasonsAPI;
[[16711680, colors$2.stamina]];
async function healStaminaUnits(units2, amount2, sourceUnit, underworld, prediction, state) {
  units2 = units2.filter((u) => u.alive);
  if (units2.length == 0 || amount2 == 0)
    return;
  for (let unit of units2) {
    unit.stamina += amount2;
  }
  return state;
}
const {
  commonTypes: commonTypes$4
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$4, probabilityMap: probabilityMap$4, CardRarity: CardRarity$4 } = commonTypes$4;
const revitaliseCardId = "Revitalise";
const revitaliseAmount = 100;
const spell$4 = {
  card: {
    id: revitaliseCardId,
    category: CardCategory$4.Blessings,
    //sfx: healSfx, // Heal FX Handled in Unit.takeDamage()
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$4[CardRarity$4.COMMON],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Revitalise.png",
    animationPath: "potionPickup",
    description: "Restores " + revitaliseAmount.toString() + " stamina to the target.",
    effect: async (state, card, quantity, underworld, prediction) => {
      await healStaminaUnits(state.targetedUnits, revitaliseAmount * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    }
  }
};
const {
  Particles,
  commonTypes: commonTypes$3,
  Unit: Unit$3,
  EffectsHeal,
  cards: cards$3
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$3, probabilityMap: probabilityMap$3, CardRarity: CardRarity$3 } = commonTypes$3;
const { refundLastSpell } = cards$3;
const siphonCardId = "Siphon";
const amount = 10;
const spell$3 = {
  card: {
    id: siphonCardId,
    category: CardCategory$3.Mana,
    sfx: "potionPickupMana",
    supportQuantity: true,
    manaCost: 0,
    healthCost: 8,
    costGrowthAlgorithm: "nlogn",
    expenseScaling: 1,
    probability: probabilityMap$3[CardRarity$3.FORBIDDEN],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Siphon.png",
    animationPath: "potionPickup",
    description: `Drain 10 health and 10 mana from targets.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      let promises = [];
      let manaStolen = 0;
      let healthStolen = 0;
      let amountStolen = amount * quantity;
      for (let unit of targets) {
        const manaStolenFromUnit = Math.min(unit.mana, amountStolen);
        unit.mana -= manaStolenFromUnit;
        manaStolen += manaStolenFromUnit;
        const healthStolenFromUnit = Math.min(unit.health, amountStolen);
        healthStolen += healthStolenFromUnit;
        Unit$3.takeDamage({
          unit,
          amount: healthStolenFromUnit,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
        if (!globalThis.headless && !prediction) {
          promises.push(Particles.makeManaTrail(unit, state.casterUnit, underworld, "#fff9e4", "#ffcb3f", targets.length * quantity));
          promises.push(Particles.makeManaTrail(unit, state.casterUnit, underworld, "#e4f9ff", "#3fcbff", targets.length * quantity));
        }
      }
      await Promise.all(promises);
      state.casterUnit.mana += manaStolen;
      EffectsHeal.healUnit(state.casterUnit, healthStolen, state.casterUnit, underworld, prediction, state);
      if (healthStolen == 0 && manaStolen == 0) {
        refundLastSpell(state, prediction);
      }
      return state;
    }
  }
};
const targetSimilarId = "Target Similar";
const {
  commonTypes: commonTypes$2,
  cards: cards$2,
  config: config$1,
  math: math$1,
  colors: colors$1,
  JAudio: JAudio$1,
  Unit: Unit$2
} = globalThis.SpellmasonsAPI;
const { addTarget: addTarget$1 } = cards$2;
const { distance: distance$1 } = math$1;
const { CardCategory: CardCategory$2, probabilityMap: probabilityMap$2, CardRarity: CardRarity$2, UnitSubType: UnitSubType$1 } = commonTypes$2;
const targetAllyId = "Target Ally";
const targetsPerQuantity$1 = 2;
const spell$2 = {
  card: {
    id: targetAllyId,
    category: CardCategory$2.Targeting,
    supportQuantity: true,
    requires: [targetSimilarId],
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$2[CardRarity$2.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/TargetAlly.png",
    requiresFollowingCard: true,
    description: `Target the closest ally. ${targetsPerQuantity$1} per stack.`,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const faction = state.casterUnit.faction;
      const addedTargets = underworld.getPotentialTargets(prediction).filter((u) => Unit$2.isUnit(u) && u.unitSubType != UnitSubType$1.DOODAD && u.faction == faction && u !== state.casterUnit && !state.targetedUnits.includes(u)).sort((a, b) => distance$1(state.casterPositionAtTimeOfCast, a) - distance$1(state.casterPositionAtTimeOfCast, b)).slice(0, targetsPerQuantity$1 * quantity);
      if (addedTargets.length) {
        for (const target of addedTargets) {
          addTarget$1(target, state, underworld, prediction);
        }
        if (!prediction && !globalThis.headless) {
          JAudio$1.playSFXKey("targeting");
          await animateTargetAlly(addedTargets);
        }
      }
      return state;
    }
  }
};
async function animateTargetAlly(newTargets) {
  var _a;
  const animationDelay = 600;
  await new Promise((resolve) => {
    for (let target of newTargets) {
      if (globalThis.predictionGraphicsGreen) {
        globalThis.predictionGraphicsGreen.lineStyle(2, colors$1.targetingSpellGreen, 1);
        globalThis.predictionGraphicsGreen.drawCircle(target.x, target.y, config$1.COLLISION_MESH_RADIUS);
        setTimeout(resolve, animationDelay);
      } else {
        resolve();
      }
    }
  });
  (_a = globalThis.predictionGraphicsGreen) == null ? void 0 : _a.clear();
  return;
}
const {
  commonTypes: commonTypes$1,
  cards: cards$1,
  config,
  math,
  colors,
  Unit: Unit$1,
  JAudio
} = globalThis.SpellmasonsAPI;
const { addTarget } = cards$1;
const { distance } = math;
const { CardCategory: CardCategory$1, probabilityMap: probabilityMap$1, CardRarity: CardRarity$1, UnitSubType } = commonTypes$1;
const targetPlayerId = "Target Player";
const targetsPerQuantity = 2;
const PLAYER_CONTROLLED = 0;
const spell$1 = {
  card: {
    id: targetPlayerId,
    category: CardCategory$1.Targeting,
    supportQuantity: true,
    requires: [targetAllyId],
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$1[CardRarity$1.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/TargetPlayer.png",
    requiresFollowingCard: true,
    description: `Target the closest Player.`,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const addedTargets = underworld.getPotentialTargets(prediction).filter((u) => Unit$1.isUnit(u) && u.unitSubType != UnitSubType.DOODAD && // Target players only
      u.unitType == PLAYER_CONTROLLED && // Filter out caster Unit since they are naturPlayer
      // the "closest" to themselves and if they want to target
      // themselves they can by casting on themselves and wont
      // need target Player to do it
      u !== state.casterUnit && !state.targetedUnits.includes(u)).sort((a, b) => distance(state.casterPositionAtTimeOfCast, a) - distance(state.casterPositionAtTimeOfCast, b)).slice(0, targetsPerQuantity * quantity);
      if (addedTargets.length) {
        for (const target of addedTargets) {
          addTarget(target, state, underworld, prediction);
        }
        if (!prediction && !globalThis.headless) {
          JAudio.playSFXKey("targeting");
          await animateTargetPlayer(addedTargets);
        }
      }
      return state;
    }
  }
};
async function animateTargetPlayer(newTargets) {
  var _a;
  const animationDelay = 600;
  await new Promise((resolve) => {
    for (let target of newTargets) {
      if (globalThis.predictionGraphicsGreen) {
        globalThis.predictionGraphicsGreen.lineStyle(2, colors.targetingSpellGreen, 1);
        globalThis.predictionGraphicsGreen.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
        setTimeout(resolve, animationDelay);
      } else {
        resolve();
      }
    }
  });
  (_a = globalThis.predictionGraphicsGreen) == null ? void 0 : _a.clear();
  return;
}
const slashCardId = "Slash";
const {
  commonTypes,
  cards,
  rand,
  cardUtils,
  PixiUtils,
  Unit
} = globalThis.SpellmasonsAPI;
const { randFloat } = rand;
const { CardCategory, probabilityMap, CardRarity } = commonTypes;
const tripleSlashCardId = "Triple Slash";
const damageDone = 20;
const delayBetweenAnimationsStart = 250;
const animationPath = "spellHurtCuts";
const spell = {
  card: {
    id: tripleSlashCardId,
    requires: [slashCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/TripleSlash.png",
    animationPath,
    sfx: "hurt",
    description: [`Casts the Slash Spell three times.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      return await tripleSlashEffect(state, card, quantity, underworld, prediction, damageDone, 1);
    }
  }
};
async function tripleSlashEffect(state, card, quantity, underworld, prediction, damage, scale) {
  const targets = state.targetedUnits.filter((u) => u.alive);
  let delayBetweenAnimations = delayBetweenAnimationsStart;
  for (let tripleSlashCounter = 0; tripleSlashCounter < 3; tripleSlashCounter++) {
    for (let q = 0; q < quantity; q++) {
      if (!prediction && !globalThis.headless) {
        cardUtils.playDefaultSpellSFX(card, prediction);
        for (let unit of targets) {
          const spellEffectImage = cardUtils.oneOffImage(unit, animationPath, PixiUtils.containerSpells);
          if (spellEffectImage) {
            spellEffectImage.sprite.rotation = randFloat(-Math.PI / 6, Math.PI / 6);
            if (q % 2 == 0) {
              spellEffectImage.sprite.scale.x = -1;
            }
            spellEffectImage.sprite.scale.x *= scale;
            spellEffectImage.sprite.scale.y *= scale;
          }
          Unit.takeDamage({
            unit,
            amount: damage,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit
          }, underworld, prediction);
        }
        await new Promise((resolve) => setTimeout(resolve, delayBetweenAnimations));
        delayBetweenAnimations *= 0.8;
        delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
      } else {
        for (let unit of targets) {
          Unit.takeDamage({
            unit,
            amount: damage,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit
          }, underworld, prediction);
        }
      }
    }
  }
  return state;
}
const mod = {
  modName: "Bogiac's Spells",
  author: "Bogiac",
  description: "Adds some new spells to the game",
  screenshot: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Bogiacs_Spells_icon.png",
  spritesheet: "spellmasons-mods/Bogiacs_Spells/graphics/spritesheet.json",
  spells: [
    //Add or Remove spells here.
    spell$a,
    spell$9,
    spell$8,
    spell$7,
    //Impact,
    spell$6,
    spell$5,
    spell$4,
    spell$3,
    spell$2,
    spell$1,
    spell
  ]
};
const mods = [
  mod$4,
  mod$3,
  mod$2,
  mod$1,
  mod
];
globalThis.mods = globalThis.mods !== void 0 ? [...globalThis.mods, ...mods] : mods;
console.log("Mods: Add mods", globalThis.mods);
