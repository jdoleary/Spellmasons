"use strict";
const {
  PixiUtils: PixiUtils$9,
  rand: rand$5,
  cardUtils: cardUtils$r,
  commonTypes: commonTypes$J,
  cards: cards$D
} = globalThis.SpellmasonsAPI;
const { randFloat: randFloat$1 } = rand$5;
const { refundLastSpell: refundLastSpell$r } = cards$D;
const { containerSpells: containerSpells$3 } = PixiUtils$9;
const Unit$A = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$3, playDefaultSpellSFX: playDefaultSpellSFX$p } = cardUtils$r;
const { CardCategory: CardCategory$H, probabilityMap: probabilityMap$H, CardRarity: CardRarity$G } = commonTypes$J;
const cardId$i = "Undead Blade";
const damageDone$2 = 60;
const animationPath$4 = "spellUndeadBlade";
const delayBetweenAnimationsStart$1 = 400;
const spell$G = {
  card: {
    id: cardId$i,
    category: CardCategory$H.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$H[CardRarity$G.COMMON],
    thumbnail: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
    animationPath: animationPath$4,
    sfx: "hurt",
    description: [`Deals ${damageDone$2} to summoned units and resurrected units only.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !u.originalLife);
      let delayBetweenAnimations = delayBetweenAnimationsStart$1;
      for (let q = 0; q < quantity; q++) {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$p(card, prediction);
          for (let unit2 of targets) {
            const spellEffectImage = oneOffImage$3(unit2, animationPath$4, containerSpells$3);
            if (spellEffectImage) {
              spellEffectImage.sprite.rotation = randFloat$1(-Math.PI / 6, Math.PI / 6);
              if (q % 2 == 0) {
                spellEffectImage.sprite.scale.x = -1;
              }
            }
            Unit$A.takeDamage({
              unit: unit2,
              amount: damageDone$2,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
          await new Promise((resolve) => setTimeout(resolve, delayBetweenAnimations));
          delayBetweenAnimations *= 0.8;
          delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
        } else {
          for (let unit2 of targets) {
            Unit$A.takeDamage({
              unit: unit2,
              amount: damageDone$2,
              sourceUnit: state.casterUnit,
              fromVec2: state.casterUnit
            }, underworld, prediction);
          }
        }
      }
      if (targets.length == 0) {
        refundLastSpell$r(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const mod$5 = {
  modName: "Undead Blade",
  author: "Jordan O'Leary",
  description: "A spell that does lots of damage to summons and resurrected units",
  screenshot: "spellmasons-mods/undead_blade/spellIconUndeadBlade.png",
  spells: [
    spell$G
  ],
  // The spritesheet is created with TexturePacker: https://www.codeandweb.com/texturepacker
  spritesheet: "spellmasons-mods/undead_blade/undead_blade.json"
};
const {
  cardUtils: cardUtils$q,
  commonTypes: commonTypes$I,
  cards: cards$C,
  cardsUtil: cardsUtil$8,
  FloatingText: FloatingText$9
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$q } = cards$C;
const Unit$z = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$o } = cardUtils$q;
const { CardCategory: CardCategory$G, probabilityMap: probabilityMap$G, CardRarity: CardRarity$F } = commonTypes$I;
const cardId$h = "Decay";
const spell$F = {
  card: {
    id: cardId$h,
    category: CardCategory$G.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$G[CardRarity$F.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDecay.png",
    sfx: "poison",
    description: [`Causes the target to take damage equal to the number of decay stacks squared at the start of their turn. The target then gains another stack.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$q(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$o(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$z.addModifier(unit2, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$8
  },
  events: {
    onTurnStart: async (unit2, underworld, prediction) => {
      const modifier = unit2.modifiers[cardId$h];
      if (modifier && !!Math.pow(modifier.quantity, 2) && !prediction) {
        Unit$z.takeDamage({ unit: unit2, amount: Math.pow(modifier.quantity, 2) }, underworld, prediction);
        FloatingText$9.default({
          coords: unit2,
          text: `${Math.pow(modifier.quantity, 2)} decay damage`,
          style: { fill: "#525863", strokeThickness: 1 }
        });
        modifier.quantity++;
      }
    }
  }
};
function add$8(unit2, _underworld, _prediction, quantity) {
  cardsUtil$8.getOrInitModifier(unit2, cardId$h, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit2, cardId$h);
  });
}
const {
  cardUtils: cardUtils$p,
  commonTypes: commonTypes$H,
  cards: cards$B
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$p } = cards$B;
const Unit$y = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$n } = cardUtils$p;
const { CardCategory: CardCategory$F, probabilityMap: probabilityMap$F, CardRarity: CardRarity$E } = commonTypes$H;
const cardId$g = "Dominate";
const healthThreshhold = 0.25;
const spell$E = {
  card: {
    id: cardId$g,
    category: CardCategory$F.Soul,
    supportQuantity: false,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2.5,
    probability: probabilityMap$F[CardRarity$E.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconDominate.png",
    sfx: "suffocate",
    description: [`Converts an enemy to fight for you if they are below ${healthThreshhold * 100}% health.`],
    //Wololo
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && u.health <= u.healthMax * healthThreshhold && u.faction !== state.casterUnit.faction);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$n(card, prediction);
      }
      for (let unit2 of targets) {
        Unit$y.changeFaction(unit2, state.casterUnit.faction);
      }
      if (targets.length == 0) {
        refundLastSpell$p(state, prediction, "No low health targets to convert, mana refunded");
      }
      return state;
    }
  }
};
const {
  cardUtils: cardUtils$o,
  commonTypes: commonTypes$G,
  cards: cards$A,
  cardsUtil: cardsUtil$7
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$o } = cards$A;
const Unit$x = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$m } = cardUtils$o;
const { CardCategory: CardCategory$E, probabilityMap: probabilityMap$E, CardRarity: CardRarity$D } = commonTypes$G;
const cardId$f = "Ensnare";
const spell$D = {
  card: {
    id: cardId$f,
    category: CardCategory$E.Curses,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$E[CardRarity$D.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconEnsnare.png",
    sfx: "",
    description: [`Prevents the target from moving for one turn. Furthur casts increase duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$o(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$m(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$x.addModifier(unit2, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$7,
    remove: remove$3
  },
  events: {
    onTurnEnd: async (unit2, underworld, prediction) => {
      const modifier = unit2.modifiers[cardId$f];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$x.removeModifier(unit2, cardId$f, underworld);
        }
      }
    }
  }
};
function add$7(unit2, underworld, prediction, quantity) {
  cardsUtil$7.getOrInitModifier(unit2, cardId$f, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit2.staminaMax
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit2, cardId$f);
    unit2.stamina = 0;
    unit2.staminaMax = 0;
  });
}
function remove$3(unit2, underworld) {
  if (unit2.modifiers && unit2.modifiers[cardId$f]) {
    const originalStamina = unit2.modifiers[cardId$f].originalstat;
    if (originalStamina && unit2.staminaMax == 0) {
      unit2.staminaMax = originalStamina;
    }
  }
}
const {
  cardUtils: cardUtils$n,
  commonTypes: commonTypes$F,
  cards: cards$z,
  FloatingText: FloatingText$8
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$n } = cards$z;
globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$l } = cardUtils$n;
const { CardCategory: CardCategory$D, probabilityMap: probabilityMap$D, CardRarity: CardRarity$C } = commonTypes$F;
const Events = globalThis.SpellmasonsAPI.Events;
const cardId$e = "Fast Forward";
const spell$C = {
  card: {
    id: cardId$e,
    category: CardCategory$D.Soul,
    //Theres no "other" category
    supportQuantity: false,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$D[CardRarity$C.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFastForward.png",
    sfx: "push",
    //TODO
    description: [`Shunt the target forward through time. Causes progression of spell effects but does not affect cooldowns.`],
    //TODO: better deffinition
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX$l(card, prediction);
        for (let unit2 of targets) {
          setTimeout(() => {
            FloatingText$8.default({
              coords: unit2,
              text: `Fast Forward`,
              style: { fill: "#ff0000", strokeThickness: 1 }
            });
          }, 200);
          procEvents(unit2, underworld, prediction);
        }
      } else {
        for (let unit2 of targets) {
          procEvents(unit2, underworld, prediction);
        }
      }
      if (targets.length == 0) {
        refundLastSpell$n(state, prediction, "No targets chosen, mana refunded");
      }
      return state;
    }
  }
};
async function procEvents(unit2, underworld, prediction) {
  for (let i = 0; i < unit2.events.length; i++) {
    const eventName = unit2.events[i];
    if (eventName) {
      const fns = Events.default.onTurnStartSource[eventName];
      if (fns) {
        await fns(unit2, underworld, prediction);
      }
    }
  }
  for (let i = 0; i < unit2.events.length; i++) {
    const eventName = unit2.events[i];
    if (eventName) {
      const fne = Events.default.onTurnEndSource[eventName];
      if (fne) {
        await fne(unit2, underworld, prediction);
      }
    }
  }
}
const {
  Particles: Particles$6,
  particleEmitter: particleEmitter$2
} = globalThis.SpellmasonsAPI;
function makeFlameStrikeWithParticles(position, prediction, resolver) {
  if (prediction || globalThis.headless) {
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = Particles$6.createParticleTexture();
  if (!texture) {
    Particles$6.logNoTextureWarning("makeFlameStrikeAttack");
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
  Particles$6.simpleEmitter(position, config2, resolver);
}
const {
  cardUtils: cardUtils$m,
  commonTypes: commonTypes$E,
  PlanningView: PlanningView$9,
  cards: cards$y
} = globalThis.SpellmasonsAPI;
const { drawUICircle } = PlanningView$9;
const Unit$w = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$k } = cardUtils$m;
const { refundLastSpell: refundLastSpell$m } = cards$y;
const { CardCategory: CardCategory$C, probabilityMap: probabilityMap$C, CardRarity: CardRarity$B } = commonTypes$E;
const cardId$d = "FlameStrike";
const damageMain = 40;
const damageSplash = 10;
const splashRadius = 64;
const spell$B = {
  card: {
    id: cardId$d,
    category: CardCategory$C.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$C[CardRarity$B.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconFlameStrike.png",
    sfx: "burst",
    description: [`Deals ${damageMain} damage to the target and ${damageSplash} damage to nearby targets in a small area.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      await new Promise((resolve) => {
        const targets = state.targetedUnits.filter((u) => u.alive);
        const adjustedRadius = getAdjustedRadius(state.aggregator.radiusBoost);
        if (targets.length == 0) {
          refundLastSpell$m(state, prediction);
          resolve();
        }
        for (let unit2 of targets) {
          const explosionTargets = underworld.getUnitsWithinDistanceOfTarget(unit2, adjustedRadius, prediction);
          const quantityAdjustedDamageMain = damageMain * quantity;
          const quantityAdjustedDamageSplash = damageSplash * quantity;
          if (!prediction && !globalThis.headless) {
            playDefaultSpellSFX$k(card, prediction);
            setTimeout(() => {
              explosionTargets.forEach((t) => {
                const damage2 = t == unit2 ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
                Unit$w.takeDamage({ unit: t, amount: damage2, sourceUnit: state.casterUnit }, underworld, prediction);
              });
              resolve();
            }, 400);
            makeFlameStrikeWithParticles(unit2, prediction);
          } else {
            if (prediction) {
              drawUICircle(globalThis.predictionGraphicsRed, unit2, adjustedRadius, 13981270);
            }
            explosionTargets.forEach((t) => {
              const damage2 = t == unit2 ? quantityAdjustedDamageMain : quantityAdjustedDamageSplash;
              Unit$w.takeDamage({ unit: t, amount: damage2, sourceUnit: state.casterUnit }, underworld, prediction);
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
  cardUtils: cardUtils$l,
  commonTypes: commonTypes$D,
  cards: cards$x,
  cardsUtil: cardsUtil$6,
  JImage: JImage$6,
  JAudio: JAudio$8,
  FloatingText: FloatingText$7
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$l } = cards$x;
const Unit$v = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$j } = cardUtils$l;
const { CardCategory: CardCategory$B, probabilityMap: probabilityMap$B, CardRarity: CardRarity$A } = commonTypes$D;
const cardId$c = "Grace";
var healingAmount$1 = -40;
const spell$A = {
  card: {
    id: cardId$c,
    category: CardCategory$B.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$B[CardRarity$A.RARE],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconGrace.png",
    sfx: "purify",
    //TODO
    description: [`Heals the target for ${-healingAmount$1} after 3 turns. Stacks increase the amount, but do not change duration`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$l(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$j(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$v.addModifier(unit2, card.id, underworld, prediction, 0, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$6
  },
  events: {
    onTurnStart: async (unit2, underworld, prediction) => {
      const modifier = unit2.modifiers[cardId$c];
      if (modifier) {
        modifier.graceCountdown--;
        updateTooltip$2(unit2);
        if (modifier.graceCountdown <= 0) {
          let healing = calculateGraceHealing(modifier.graceQuantity);
          Unit$v.takeDamage({ unit: unit2, amount: healing }, underworld, prediction);
          if (!prediction) {
            FloatingText$7.default({
              coords: unit2,
              text: `Grace +${-healing} health`,
              style: { fill: "#40a058", strokeThickness: 1 }
            });
            JImage$6.addOneOffAnimation(unit2, "potionPickup", {}, { animationSpeed: 0.3, loop: false });
            JAudio$8.playSFXKey("potionPickupHealth");
          }
          Unit$v.removeModifier(unit2, cardId$c, underworld);
        }
      }
    }
  }
};
function add$6(unit2, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$6.getOrInitModifier(unit2, cardId$c, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit2, cardId$c);
  });
  if (!modifier.graceCountdown) {
    modifier.graceCountdown = 3;
  }
  modifier.graceQuantity = (modifier.graceQuantity || 0) + extra.amount;
  if (!prediction) {
    updateTooltip$2(unit2);
  }
}
function updateTooltip$2(unit2) {
  const modifier = unit2.modifiers && unit2.modifiers[cardId$c];
  if (modifier) {
    modifier.tooltip = `${modifier.graceCountdown} turns until healed for ${-calculateGraceHealing(modifier.graceQuantity)}`;
  }
}
function calculateGraceHealing(graceQuantity) {
  return graceQuantity * healingAmount$1;
}
const {
  cardUtils: cardUtils$k,
  commonTypes: commonTypes$C,
  cards: cards$w,
  Particles: Particles$5,
  FloatingText: FloatingText$6
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$k } = cards$w;
const Unit$u = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$i } = cardUtils$k;
const { CardCategory: CardCategory$A, probabilityMap: probabilityMap$A, CardRarity: CardRarity$z, UnitType: UnitType$9 } = commonTypes$C;
const cardId$b = "Harvest";
const manaRegain = 20;
const spell$z = {
  card: {
    id: cardId$b,
    category: CardCategory$A.Mana,
    supportQuantity: false,
    manaCost: 0,
    healthCost: 35,
    expenseScaling: 1,
    probability: probabilityMap$A[CardRarity$z.UNCOMMON],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconHarvest.png",
    sfx: "sacrifice",
    description: [`Consumes target corpse for ${manaRegain} mana. Does not work on player corpses. Unstackable.

Tastes like chicken.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      let totalManaHarvested = 0;
      const targets = state.targetedUnits.filter((u) => !u.alive && u.unitType != UnitType$9.PLAYER_CONTROLLED && u.flaggedForRemoval != true);
      for (let unit2 of targets) {
        totalManaHarvested += manaRegain * quantity;
        const manaTrailPromises = [];
        if (!prediction) {
          manaTrailPromises.push(Particles$5.makeManaTrail(unit2, state.casterUnit, underworld, "#e4ffee", "#40ff66", targets.length * quantity));
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$i(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$u.cleanup(unit2);
        }
        state.casterUnit.mana += totalManaHarvested;
      });
      if (targets.length == 0 && !totalManaHarvested) {
        refundLastSpell$k(state, prediction, "No corpses, health refunded");
      }
      if (!prediction && !!totalManaHarvested) {
        FloatingText$6.default({
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
  cardUtils: cardUtils$j,
  commonTypes: commonTypes$B,
  cards: cards$v,
  cardsUtil: cardsUtil$5,
  FloatingText: FloatingText$5
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$j } = cards$v;
const Unit$t = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$h } = cardUtils$j;
const { CardCategory: CardCategory$z, probabilityMap: probabilityMap$z, CardRarity: CardRarity$y } = commonTypes$B;
const cardId$a = "Regenerate";
const spell$y = {
  card: {
    id: cardId$a,
    category: CardCategory$z.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$z[CardRarity$y.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconRegen.png",
    sfx: "heal",
    //TODO
    description: [`Heals the target for 10 health at the end of their turn for 5 turns. Stacks increase the amount and refresh the duration.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$j(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$h(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$t.addModifier(unit2, card.id, underworld, prediction, 5, { amount: quantity });
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$5,
    remove: remove$2
  },
  events: {
    onTurnEnd: async (unit2, underworld, prediction) => {
      const modifier = unit2.modifiers[cardId$a];
      if (modifier) {
        const healing = healingAmount(modifier.regenCounter);
        Unit$t.takeDamage({ unit: unit2, amount: healing }, underworld, prediction);
        modifier.quantity--;
        if (!prediction) {
          updateTooltip$1(unit2);
          FloatingText$5.default({
            coords: unit2,
            text: `Regenerate +${-healing} health`,
            style: { fill: "#40a058", strokeThickness: 1 }
          });
        }
        if (modifier.quantity <= 0) {
          Unit$t.removeModifier(unit2, cardId$a, underworld);
        }
      }
    }
  }
};
function remove$2(unit2, underworld) {
  const modifier = unit2.modifiers[cardId$a];
  if (modifier) {
    modifier.regenCounter = 0;
  }
}
function add$5(unit2, underworld, prediction, quantity, extra) {
  const modifier = cardsUtil$5.getOrInitModifier(unit2, cardId$a, {
    isCurse: false,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit2, cardId$a);
  });
  if (modifier.quantity > 5) {
    modifier.quantity = 5;
  }
  if (!prediction) {
    modifier.regenCounter = (modifier.regenCounter || 0) + extra.amount;
    updateTooltip$1(unit2);
  }
}
function healingAmount(castquantity) {
  let healing = -10;
  if (castquantity > 0) {
    healing = castquantity * -10;
  }
  return healing;
}
function updateTooltip$1(unit2) {
  const modifier = unit2.modifiers && unit2.modifiers[cardId$a];
  if (modifier) {
    modifier.tooltip = `Healing ${-healingAmount(modifier.regenCounter)} every ${modifier.quantity} turns`;
  }
}
const {
  cardUtils: cardUtils$i,
  commonTypes: commonTypes$A,
  cards: cards$u,
  cardsUtil: cardsUtil$4
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$i } = cards$u;
const Unit$s = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$g } = cardUtils$i;
const { CardCategory: CardCategory$y, probabilityMap: probabilityMap$y, CardRarity: CardRarity$x } = commonTypes$A;
const cardId$9 = "Pacify";
const spell$x = {
  card: {
    id: cardId$9,
    category: CardCategory$y.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$y[CardRarity$x.SPECIAL],
    thumbnail: "spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconPacify.png",
    sfx: "",
    description: [`Prevents the target from attacking for one turn. Stacks increase duration. Does not affect Support Class units such as summoners or priests.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive && !(u.unitSubType == 3));
      if (targets.length == 0) {
        refundLastSpell$i(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$g(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$s.addModifier(unit2, card.id, underworld, prediction, quantity);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$4,
    remove: remove$1
  },
  events: {
    onTurnEnd: async (unit2, underworld, prediction) => {
      const modifier = unit2.modifiers[cardId$9];
      if (modifier) {
        modifier.quantity--;
        if (modifier.quantity <= 0) {
          Unit$s.removeModifier(unit2, cardId$9, underworld);
        }
      }
    }
  }
};
function add$4(unit2, underworld, prediction, quantity) {
  cardsUtil$4.getOrInitModifier(unit2, cardId$9, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false,
    originalstat: unit2.attackRange
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit2, cardId$9);
    unit2.attackRange = 0;
  });
}
function remove$1(unit2, underworld) {
  if (unit2.modifiers && unit2.modifiers[cardId$9]) {
    const originalRange = unit2.modifiers[cardId$9].originalstat;
    if (originalRange && unit2.attackRange == 0) {
      unit2.attackRange = originalRange;
    }
  }
}
const {
  cardUtils: cardUtils$h,
  commonTypes: commonTypes$z,
  cards: cards$t,
  Particles: Particles$4
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$h } = cards$t;
const Unit$r = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$f } = cardUtils$h;
const { CardCategory: CardCategory$x, probabilityMap: probabilityMap$x, CardRarity: CardRarity$w } = commonTypes$z;
const cardId$8 = "Vengeance";
const spell$w = {
  card: {
    id: cardId$8,
    category: CardCategory$x.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$x[CardRarity$w.UNCOMMON],
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
        refundLastSpell$h(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        const manaTrailPromises = [];
        if (!prediction) {
          for (let i = 0; i < quantity; i++) {
            manaTrailPromises.push(Particles$4.makeManaTrail(state.casterUnit, unit2, underworld, "#ef4242", "#400d0d", targets.length * quantity));
          }
        }
        promises.push(prediction ? Promise.resolve() : Promise.all(manaTrailPromises));
      }
      await Promise.all(promises).then(() => {
        if (!prediction && !globalThis.headless) {
          playDefaultSpellSFX$f(card, prediction);
        }
        for (let q = 0; q < quantity; q++) {
          for (let unit2 of targets) {
            Unit$r.takeDamage({ unit: unit2, amount: damageDone$1(state), sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
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
const mod$4 = {
  modName: "Wode's Grimoire",
  author: "Blood Spartan",
  description: "Adds 10 new spells to your arsenal.",
  //TODO make word good
  screenshot: "spellmasons-mods/Wodes_Grimoire/graphics/icons/Wodes_grimoire_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$F,
    spell$E,
    spell$D,
    spell$C,
    //Very buggy, absolutly no idea how I got this working, but it does /shrug
    spell$B,
    spell$A,
    spell$z,
    spell$y,
    spell$x,
    //Stasis, //Not working as intended, can still be pushed
    spell$w
  ],
  // This spritesheet allows spell icons to be used in player thought bubbles in multiplayer
  spritesheet: "spellmasons-mods/Wodes_Grimoire/graphics/wodes_grimoire_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$8,
  cardUtils: cardUtils$g,
  commonTypes: commonTypes$y,
  cards: cards$s
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$g } = cards$s;
const { containerSpells: containerSpells$2 } = PixiUtils$8;
const Unit$q = globalThis.SpellmasonsAPI.Unit;
const { oneOffImage: oneOffImage$2 } = cardUtils$g;
const { CardCategory: CardCategory$w, probabilityMap: probabilityMap$w, CardRarity: CardRarity$v } = commonTypes$y;
const animationPath$3 = "VampBite";
const cardId$7 = "Vampire Bite";
const spell$v = {
  card: {
    id: cardId$7,
    category: CardCategory$w.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$w[CardRarity$v.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/VampireBite.png",
    animationPath: animationPath$3,
    sfx: "hurt",
    description: [`Deals 10 to the target and heals you for up to 50% damage done. Healing is not affected by modifiers, including blood curse`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$g(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        if (state.casterUnit.health < state.casterUnit.healthMax) {
          if (unit2.health < 10 * quantity) {
            state.casterUnit.health += unit2.health / 2;
          } else {
            state.casterUnit.health += 5 * quantity;
          }
          if (state.casterUnit.health > state.casterUnit.healthMax) {
            state.casterUnit.health = state.casterUnit.healthMax;
          }
        }
        if (!prediction) {
          oneOffImage$2(unit2, animationPath$3, containerSpells$2);
        }
        Unit$q.takeDamage({ unit: unit2, amount: 10 * quantity, sourceUnit: state.casterUnit, fromVec2: state.casterUnit }, underworld, prediction);
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
  cardUtils: cardUtils$f,
  commonTypes: commonTypes$x,
  cards: cards$r,
  VisualEffects: VisualEffects$6,
  config: config$d,
  math: math$b,
  Pickup: Pickup$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$f } = cards$r;
const { playDefaultSpellSFX: playDefaultSpellSFX$e } = cardUtils$f;
const { CardCategory: CardCategory$v, probabilityMap: probabilityMap$v, CardRarity: CardRarity$u } = commonTypes$x;
const cardId$6 = "Summon Trap";
const spell$u = {
  card: {
    id: cardId$6,
    category: CardCategory$v.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$v[CardRarity$u.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/SummonTrap.png",
    sfx: "hurt",
    description: [`Summons a trap that does 30 damage when stepped on`],
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const summonLocation = {
        x: state.castLocation.x,
        y: state.castLocation.y
      };
      for (let unit2 of underworld.units) {
        if (unit2.alive && math$b.distance(unit2, summonLocation) < config$d.COLLISION_MESH_RADIUS) {
          refundLastSpell$f(state, prediction, "Invalid summon location, mana refunded.");
          return state;
        }
      }
      if (underworld.isCoordOnWallTile(summonLocation)) {
        if (prediction)
          ;
        else {
          refundLastSpell$f(state, prediction, "Invalid summon location, mana refunded.");
        }
        return state;
      }
      playDefaultSpellSFX$e(card, prediction);
      const index = 0;
      if (!prediction) {
        VisualEffects$6.skyBeam(summonLocation);
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
  commonTypes: commonTypes$w,
  cards: cards$q
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$e } = cards$q;
const Unit$p = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$u, probabilityMap: probabilityMap$u, CardRarity: CardRarity$t } = commonTypes$w;
const retaliate = 0.15;
const cardId$5 = "Sadism";
const spell$t = {
  card: {
    id: cardId$5,
    category: CardCategory$u.Damage,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$u[CardRarity$t.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Sadism.png",
    sfx: "hurt",
    description: [`Damage to target equal to its attack, you receive ${retaliate * 100}% of that attack damage`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$e(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        let damage2 = unit2.damage * quantity;
        Unit$p.takeDamage({ unit: unit2, amount: damage2, fromVec2: state.casterUnit, sourceUnit: state.casterUnit }, underworld, prediction);
        Unit$p.takeDamage({ unit: state.casterUnit, amount: damage2 * retaliate }, underworld, prediction);
      }
      state.casterUnit.health -= state.casterUnit.health % 1;
      return state;
    }
  }
};
const {
  particleEmitter: particleEmitter$1,
  Particles: Particles$3,
  PixiUtils: PixiUtils$7,
  cardUtils: cardUtils$e,
  commonTypes: commonTypes$v,
  cards: cards$p,
  cardsUtil: cardsUtil$3,
  FloatingText: FloatingText$4,
  ParticleCollection: ParticleCollection$2
} = globalThis.SpellmasonsAPI;
const BURNING_RAGE_PARTICLE_EMITTER_NAME = "BURNING_RAGE";
function makeBurningRageParticles(follow, underworld, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles$3.createParticleTexture();
  if (!texture) {
    Particles$3.logNoTextureWarning("makeBurningRageParticles");
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
  if (PixiUtils$7.containerUnits) {
    const wrapped = Particles$3.wrappedEmitter(particleConfig, PixiUtils$7.containerUnits);
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
const { refundLastSpell: refundLastSpell$d } = cards$p;
const Unit$o = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX: playDefaultSpellSFX$d } = cardUtils$e;
const { CardCategory: CardCategory$t, probabilityMap: probabilityMap$t, CardRarity: CardRarity$s } = commonTypes$v;
const damageMultiplier$1 = 8;
const attackMultiplier = 5;
const cardId$4 = "Burning Rage";
const spell$s = {
  card: {
    id: cardId$4,
    category: CardCategory$t.Curses,
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$t[CardRarity$s.RARE],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/Burninig_rage.png",
    sfx: "poison",
    description: [`Each stack causes target to take ${damageMultiplier$1} damage, but also increases the target's damage by ${attackMultiplier}. Staks increase each turn`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$d(state, prediction, "No target, mana refunded");
      } else {
        if (!prediction) {
          playDefaultSpellSFX$d(card, prediction);
        }
        for (let unit2 of targets) {
          Unit$o.addModifier(unit2, card.id, underworld, prediction, quantity);
          unit2.damage += quantity * attackMultiplier;
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
    add: add$3,
    remove
  },
  events: {
    onTurnStart: async (unit2, underworld, prediction) => {
      const modifier = unit2.modifiers[cardId$4];
      if (modifier && !prediction) {
        Unit$o.takeDamage({ unit: unit2, amount: modifier.quantity * damageMultiplier$1 }, underworld, prediction);
        FloatingText$4.default({
          coords: unit2,
          text: `${modifier.quantity * damageMultiplier$1} rage damage`,
          style: { fill: "red", strokeThickness: 1 }
        });
        unit2.damage += attackMultiplier;
        modifier.quantity++;
      }
    }
  }
};
function add$3(unit2, underworld, prediction, quantity) {
  cardsUtil$3.getOrInitModifier(unit2, cardId$4, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    SpellmasonsAPI.Unit.addEvent(unit2, cardId$4);
    makeBurningRageParticles(unit2, underworld, prediction);
  });
}
function remove(unit2, underworld) {
  unit2.damage -= unit2.modifiers[cardId$4].quantity * attackMultiplier;
  unit2.damage = Math.max(unit2.damage, 0);
  for (let follower of underworld.particleFollowers) {
    if (follower.emitter.name === BURNING_RAGE_PARTICLE_EMITTER_NAME && follower.target == unit2) {
      ParticleCollection$2.stopAndDestroyForeverEmitter(follower.emitter);
      break;
    }
  }
}
const {
  commonTypes: commonTypes$u,
  cards: cards$o,
  cardsUtil: cardsUtil$2,
  FloatingText: FloatingText$3
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$c } = cards$o;
const Unit$n = globalThis.SpellmasonsAPI.Unit;
const { CardCategory: CardCategory$s, probabilityMap: probabilityMap$s, CardRarity: CardRarity$r } = commonTypes$u;
const maxDuration = 3;
const distanceToDamageRatio = 0.05;
const cardId$3 = "Caltrops";
const spell$r = {
  card: {
    id: cardId$3,
    category: CardCategory$s.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$s[CardRarity$r.UNCOMMON],
    thumbnail: "spellmasons-mods/Renes_gimmicks/graphics/icons/" + cardId$3 + ".png",
    sfx: "hurt",
    description: [`Target takes some damage it moves. Stacks, casting again replenishes duration up to ${maxDuration} turns. (Updates on turn change, recasts or damage)`],
    effect: async (state, _card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$c(state, prediction, "No targets damaged, mana refunded");
        return state;
      }
      for (let unit2 of targets) {
        Unit$n.addModifier(unit2, cardId$3, underworld, prediction, maxDuration, { amount: quantity });
        if (!prediction) {
          triggerDistanceDamage(unit2, underworld, prediction);
        }
      }
      return state;
    }
  },
  modifiers: {
    add: add$2
  },
  events: {
    //onMove: (unit, newLocation) => {triggerDistanceDamage(unit);return newLocation},
    onTakeDamage: (unit2, amount2, underworld, prediction) => {
      triggerDistanceDamage(unit2, underworld, prediction);
      return amount2;
    },
    onTurnStart: async (unit2, underworld, prediction) => {
      triggerDistanceDamage(unit2, underworld, prediction);
    },
    onTurnEnd: async (unit2, underworld, prediction) => {
      triggerDistanceDamage(unit2, underworld, prediction);
    }
  }
};
function add$2(unit2, _underworld, prediction, quantity, extra) {
  let firstStack = !unit2.events.includes(cardId$3);
  const modifier = cardsUtil$2.getOrInitModifier(unit2, cardId$3, {
    isCurse: true,
    quantity,
    persistBetweenLevels: false
  }, () => {
    if (firstStack) {
      SpellmasonsAPI.Unit.addEvent(unit2, cardId$3);
    }
  });
  if (firstStack) {
    modifier.last_x = unit2.x;
    modifier.last_y = unit2.y;
  }
  if (modifier.quantity > maxDuration) {
    modifier.quantity = maxDuration;
  }
  if (!prediction) {
    modifier.caltropsCounter = (modifier.caltropsCounter || 0) + extra.amount;
    updateTooltip(unit2);
  }
}
function caltropsAmount(castquantity) {
  let caltrops = 1;
  if (castquantity > 0) {
    caltrops = castquantity * 1;
  }
  return caltrops;
}
function updateTooltip(unit2) {
  const modifier = unit2.modifiers && unit2.modifiers[cardId$3];
  if (modifier) {
    modifier.tooltip = `When target moves deal ${caltropsAmount(modifier.caltropsCounter)} damage, lasts ${modifier.quantity} turns`;
  }
}
function triggerDistanceDamage(unit2, underworld, prediction = false) {
  if (!unit2.alive) {
    return;
  }
  const modifier = unit2.modifiers && unit2.modifiers[cardId$3];
  let x_diff = unit2.x - modifier.last_x;
  let y_diff = unit2.y - modifier.last_y;
  if (x_diff == 0 && y_diff == 0) {
    return;
  }
  let damage2 = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
  damage2 = damage2 * distanceToDamageRatio * modifier.caltropsCounter;
  damage2 -= damage2 % 1;
  if (!modifier || damage2 < 1) {
    return;
  }
  modifier.last_x = unit2.x;
  modifier.last_y = unit2.y;
  Unit$n.takeDamage({ unit: unit2, amount: damage2 }, underworld, prediction);
  if (!prediction) {
    FloatingText$3.default({
      coords: unit2,
      text: `${damage2} caltrops damage`,
      style: { fill: "#grey", strokeThickness: 1 }
    });
  }
}
const mod$3 = {
  modName: "Renes gimmicks",
  author: "Renesans123/Edeusz",
  description: "Adds some new spells to the game",
  screenshot: "spellmasons-mods/Renes_gimmicks/graphics/icons/Renes_Gimmicks_icon.png",
  spells: [
    //Add or Remove spells here.
    spell$v,
    spell$u,
    spell$t,
    spell$s,
    spell$r
    //OnMove doesnt seem to be implemented
    //Thorns,//composeOnDamageEvents do not pass argument damageDealer right now
  ],
  spritesheet: "spellmasons-mods/Renes_gimmicks/graphics/icons/renes_spritesheet.json"
};
const {
  PixiUtils: PixiUtils$6,
  commonTypes: commonTypes$t,
  cards: cards$n,
  cardUtils: cardUtils$d,
  Unit: Unit$m,
  JPromise: JPromise$4
} = globalThis.SpellmasonsAPI;
const { oneOffImage: oneOffImage$1, playDefaultSpellSFX: playDefaultSpellSFX$c, playSpellSFX } = cardUtils$d;
const { refundLastSpell: refundLastSpell$b } = cards$n;
const { CardCategory: CardCategory$r, probabilityMap: probabilityMap$r, CardRarity: CardRarity$q } = commonTypes$t;
const { containerSpells: containerSpells$1 } = PixiUtils$6;
const animationPath$2 = "spellGravity";
const cardId$2 = "Gravity";
const percentDamage = 0.1;
const spell$q = {
  card: {
    id: cardId$2,
    category: CardCategory$r.Damage,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$r[CardRarity$q.RARE],
    animationPath: animationPath$2,
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/Gravity.png",
    sfx: "pull",
    description: [`Deals damage to target(s) equal to ${percentDamage * 100}% of its current health.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (!prediction && !globalThis.headless) {
        playSpellSFX("push", prediction);
        let promises = [];
        for (let unit2 of targets) {
          promises.push(new Promise((res) => {
            oneOffImage$1(unit2, animationPath$2, containerSpells$1, res);
            setTimeout(() => {
              playDefaultSpellSFX$c(card, prediction);
            }, 1e3);
          }));
        }
        await JPromise$4.raceTimeout(2e3, "Gravity attack animation", Promise.all(promises));
      }
      for (let unit2 of targets) {
        let damage2 = unit2.health * percentDamage * quantity;
        Unit$m.takeDamage({
          unit: unit2,
          amount: damage2,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
      }
      if (targets.length == 0) {
        refundLastSpell$b(state, prediction, "No valid targets. Cost refunded.");
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$s,
  cards: cards$m,
  Unit: Unit$l,
  cardUtils: cardUtils$c,
  PixiUtils: PixiUtils$5
} = globalThis.SpellmasonsAPI;
const { oneOffImage, playDefaultSpellSFX: playDefaultSpellSFX$b } = cardUtils$c;
const { refundLastSpell: refundLastSpell$a } = cards$m;
const { CardCategory: CardCategory$q, probabilityMap: probabilityMap$q, CardRarity: CardRarity$p } = commonTypes$s;
const { containerSpells } = PixiUtils$5;
const cardId$1 = "Limit Blast";
const animationPath$1 = "Limit Glove";
const healthRequirement = 0.3;
const baseDamage = 5;
const damageMultiplier = 10;
const spell$p = {
  card: {
    id: cardId$1,
    category: CardCategory$q.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$q[CardRarity$p.UNCOMMON],
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/LimitGlove.png",
    animationPath: animationPath$1,
    sfx: "debilitate",
    description: [`Deals ${baseDamage} damage to target(s). If caster's health is ${healthRequirement * 100}% or less, deals ${baseDamage * damageMultiplier} damage instead.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      if (targets.length == 0) {
        refundLastSpell$a(state, prediction, "No valid targets. Cost refunded.");
        return state;
      }
      if (!prediction && !globalThis.headless) {
        for (let unit2 of targets) {
          oneOffImage(unit2, animationPath$1, containerSpells);
        }
        playDefaultSpellSFX$b(card, prediction);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
      for (let unit2 of targets) {
        let healthReqCalc = state.casterUnit.healthMax * healthRequirement;
        let damage2 = baseDamage;
        if (state.casterUnit.health <= healthReqCalc) {
          damage2 = damage2 * damageMultiplier;
        }
        Unit$l.takeDamage({
          unit: unit2,
          amount: damage2 * quantity,
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
  Particles: Particles$2,
  ParticleCollection: ParticleCollection$1,
  particleEmitter,
  commonTypes: commonTypes$r,
  Unit: Unit$k,
  PlanningView: PlanningView$8,
  colors: colors$8,
  cardUtils: cardUtils$b
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$p, probabilityMap: probabilityMap$p, CardRarity: CardRarity$o } = commonTypes$r;
const { drawUICirclePrediction: drawUICirclePrediction$4 } = PlanningView$8;
const { playDefaultSpellSFX: playDefaultSpellSFX$a } = cardUtils$b;
const { simpleEmitter } = Particles$2;
function makeWhiteWindParticles(position, radius, underworld, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = Particles$2.createParticleTexture();
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
const spell$o = {
  card: {
    id: cardId,
    category: CardCategory$p.Blessings,
    supportQuantity: true,
    manaCost: 50,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$p[CardRarity$o.RARE],
    allowNonUnitTarget: true,
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/WhiteWind.png",
    sfx: "heal",
    description: [`Heals targets in an area around self equal to own health.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      let adjustedRange = baseRange * (1 + (quantity - 1) * 0.5 + 0.25 * state.aggregator.radiusBoost);
      if (prediction) {
        drawUICirclePrediction$4(state.casterUnit, adjustedRange, colors$8.targetingSpellGreen, "Target Radius");
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
        if (Unit$k.isUnit(entity)) {
          let target = entity;
          Unit$k.takeDamage({ unit: target, amount: -state.casterUnit.health }, underworld, prediction);
        }
        playDefaultSpellSFX$a(card, prediction);
      }
      return state;
    }
  }
};
const {
  cards: cards$l,
  Pickup: Pickup$2,
  Unit: Unit$j,
  math: math$a,
  commonTypes: commonTypes$q
} = globalThis.SpellmasonsAPI;
const { addTarget: addTarget$5 } = cards$l;
const { CardCategory: CardCategory$o, probabilityMap: probabilityMap$o } = commonTypes$q;
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
      category: CardCategory$o.Targeting,
      supportQuantity: true,
      manaCost,
      healthCost: 0,
      expenseScaling: 1,
      probability: probabilityMap$o[rarity],
      thumbnail: `spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TargetHp${multipleOf}.png`,
      requiresFollowingCard: true,
      description: [`Target ${UNITS_PER_STACK} living units (per stack) with health that is any multiple of ${multipleOf}, starting with the closest from the target point.`],
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
        const targets = underworld.getPotentialTargets(prediction).filter((u) => {
          if (Unit$j.isUnit(u)) {
            return u.alive && u.health % multipleOf == 0;
          } else {
            return false;
          }
        }).sort(math$a.sortCosestTo(state.castLocation)).slice(0, UNITS_PER_STACK * quantity);
        for (let target of targets) {
          addTarget$5(target, state, underworld, prediction);
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
const TargetHp3 = generateTargetHpMultipleOfSpell(3, 30, "Prime", commonTypes$q.CardRarity.UNCOMMON);
const TargetHp4 = generateTargetHpMultipleOfSpell(4, 35, 3, commonTypes$q.CardRarity.RARE);
const TargetHp5 = generateTargetHpMultipleOfSpell(5, 40, 4, commonTypes$q.CardRarity.FORBIDDEN);
const TargetHpPrime = {
  card: {
    id: `Target Health Prime`,
    category: CardCategory$o.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 4,
    probability: probabilityMap$o[commonTypes$q.CardRarity.COMMON],
    thumbnail: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TargetHpPrime.png",
    requiresFollowingCard: true,
    description: [`Target ${UNITS_PER_STACK} living units (per stack) with health that is any prime number, starting with the closest from the target point.`],
    allowNonUnitTarget: true,
    ignoreRange: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const targets = underworld.getPotentialTargets(prediction).filter((u) => {
        if (Unit$j.isUnit(u)) {
          return u.alive && isPrime(u.health);
        } else {
          return false;
        }
      }).sort(math$a.sortCosestTo(state.castLocation)).slice(0, UNITS_PER_STACK * quantity);
      for (let target of targets) {
        addTarget$5(target, state, underworld, prediction);
      }
      return state;
    }
  }
};
const mod$2 = {
  modName: "DaiNekoIchi's Tome of Spells",
  author: "DaiNekoIchi, PADS",
  description: "Adds several spells (probably heavily inspired from Final Fantasy)",
  screenshot: "spellmasons-mods/DaiNekoIchis_TomeOfSpells/graphics/TomeOfSpellsIcon.png",
  spells: [
    spell$q,
    spell$p,
    spell$o,
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
  cardUtils: cardUtils$a,
  commonTypes: commonTypes$p,
  cards: cards$k,
  VisualEffects: VisualEffects$5,
  rand: rand$4,
  units: units$5,
  Pickup: Pickup$1,
  Unit: Unit$i,
  JAudio: JAudio$7
} = globalThis.SpellmasonsAPI;
const { chooseObjectWithProbability: chooseObjectWithProbability$1, getUniqueSeedString: getUniqueSeedString$2 } = rand$4;
const { allUnits: allUnits$5 } = units$5;
const { refundLastSpell: refundLastSpell$9, addUnitTarget: addUnitTarget$1 } = cards$k;
const { playDefaultSpellSFX: playDefaultSpellSFX$9 } = cardUtils$a;
const { CardCategory: CardCategory$n, probabilityMap: probabilityMap$n, CardRarity: CardRarity$n, Faction: Faction$5, UnitType: UnitType$8 } = commonTypes$p;
const chaosWarpCardId = "Chaos Warp";
const spell$n = {
  card: {
    id: chaosWarpCardId,
    category: CardCategory$n.Soul,
    supportQuantity: false,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$n[CardRarity$n.UNCOMMON],
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
        refundLastSpell$9(state, prediction, "Invalid summon location, mana refunded.");
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
            JAudio$7.playSFXKey("spawnPotion");
            VisualEffects$5.skyBeam(summonLocation);
          }
        } else {
          refundLastSpell$9(state, prediction);
        }
      } else if (randomEffect <= 7) {
        playDefaultSpellSFX$9(card, prediction);
        const index = 0;
        underworld.spawnPickup(index, summonLocation, prediction);
        if (!prediction) {
          VisualEffects$5.skyBeam(summonLocation);
        }
        return state;
      } else if (randomEffect <= 9) {
        const urnID = rand$4.chooseOneOfSeeded([urn_explosive_id$1, urn_ice_id$1, urn_poison_id$1], seed);
        if (urnID !== void 0) {
          let sourceUnit = allUnits$5[urnID];
          if (sourceUnit) {
            const unit2 = Unit$i.create(
              urnID,
              summonLocation.x,
              summonLocation.y,
              Faction$5.ALLY,
              sourceUnit.info.image,
              UnitType$8.AI,
              sourceUnit.info.subtype,
              sourceUnit.unitProps,
              underworld,
              prediction
            );
            unit2.healthMax *= 1;
            unit2.health *= 1;
            unit2.damage *= 1;
            addUnitTarget$1(unit2, state, prediction);
            if (!prediction) {
              VisualEffects$5.skyBeam(summonLocation);
            }
          } else {
            refundLastSpell$9(state, prediction);
          }
        } else {
          refundLastSpell$9(state, prediction);
        }
      } else if (randomEffect > 9) {
        const portalPickupSource = Pickup$1.pickups.find((p) => p.name == Pickup$1.PORTAL_PURPLE_NAME);
        if (portalPickupSource) {
          if (!prediction) {
            Pickup$1.create({ pos: summonLocation, pickupSource: portalPickupSource, logSource: "Chaos Warp Portal" }, underworld, prediction);
            VisualEffects$5.skyBeam(summonLocation);
          }
        } else {
          refundLastSpell$9(state, prediction);
        }
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$o,
  cards: cards$j,
  VisualEffects: VisualEffects$4,
  rand: rand$3,
  Pickup,
  JAudio: JAudio$6
} = globalThis.SpellmasonsAPI;
const { chooseObjectWithProbability, getUniqueSeedString: getUniqueSeedString$1 } = rand$3;
const { refundLastSpell: refundLastSpell$8 } = cards$j;
const { CardCategory: CardCategory$m, probabilityMap: probabilityMap$m, CardRarity: CardRarity$m } = commonTypes$o;
const chaosWarpPotionCardId = "Chaos Warp - Potion";
const spell$m = {
  card: {
    id: chaosWarpPotionCardId,
    category: CardCategory$m.Soul,
    supportQuantity: false,
    requires: [chaosWarpCardId],
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1.5,
    probability: probabilityMap$m[CardRarity$m.RARE],
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
        refundLastSpell$8(state, prediction, "Invalid summon location, mana refunded.");
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
          JAudio$6.playSFXKey("spawnPotion");
          VisualEffects$4.skyBeam(summonLocation);
        }
      } else {
        refundLastSpell$8(state, prediction);
      }
      return state;
    }
  }
};
const urn_explosive_id = "Explosive Urn";
const urn_poison_id = "Toxic Urn";
const urn_ice_id = "Ice Urn";
const {
  commonTypes: commonTypes$n,
  cards: cards$i,
  VisualEffects: VisualEffects$3,
  rand: rand$2,
  units: units$4,
  Unit: Unit$h
} = globalThis.SpellmasonsAPI;
const { allUnits: allUnits$4 } = units$4;
const { getUniqueSeedString } = rand$2;
const { refundLastSpell: refundLastSpell$7, addUnitTarget } = cards$i;
const { CardCategory: CardCategory$l, probabilityMap: probabilityMap$l, CardRarity: CardRarity$l, Faction: Faction$4, UnitType: UnitType$7 } = commonTypes$n;
const chaosWarpUrnCardId = "Chaos Warp - Urn";
const spell$l = {
  card: {
    id: chaosWarpUrnCardId,
    category: CardCategory$l.Soul,
    supportQuantity: false,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1.5,
    requires: [chaosWarpCardId],
    probability: probabilityMap$l[CardRarity$l.RARE],
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
        refundLastSpell$7(state, prediction, "Invalid summon location, mana refunded.");
        return state;
      }
      const seedString = `${getUniqueSeedString(underworld, state.casterPlayer)}${state.castLocation.x}${state.castLocation.y}`;
      const seed = rand$2.seedrandom(seedString);
      const urnID = rand$2.chooseOneOfSeeded([urn_explosive_id, urn_ice_id, urn_poison_id], seed);
      if (urnID !== void 0) {
        let sourceUnit = allUnits$4[urnID];
        if (sourceUnit) {
          const unit2 = Unit$h.create(
            urnID,
            summonLocation.x,
            summonLocation.y,
            Faction$4.ALLY,
            sourceUnit.info.image,
            UnitType$7.AI,
            sourceUnit.info.subtype,
            sourceUnit.unitProps,
            underworld,
            prediction
          );
          unit2.healthMax *= 1;
          unit2.health *= 1;
          unit2.damage *= 1;
          addUnitTarget(unit2, state, prediction);
          if (!prediction) {
            VisualEffects$3.skyBeam(summonLocation);
          }
        } else {
          refundLastSpell$7(state, prediction);
        }
      } else {
        refundLastSpell$7(state, prediction);
      }
      return state;
    }
  }
};
const plusRadiusId = "Plus Radius";
const {
  commonTypes: commonTypes$m,
  cards: cards$h
} = globalThis.SpellmasonsAPI;
const { refundLastSpell: refundLastSpell$6 } = cards$h;
const { CardCategory: CardCategory$k, probabilityMap: probabilityMap$k, CardRarity: CardRarity$k, UnitType: UnitType$6 } = commonTypes$m;
const targetDistanceId = "Distance Increase";
const radiusBoost = 20;
const spell$k = {
  card: {
    id: targetDistanceId,
    category: CardCategory$k.Blessings,
    supportQuantity: true,
    requires: [plusRadiusId],
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$k[CardRarity$k.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Distance_Increase.png",
    description: "Increases a unit's attack range.  Does not affect Spellmasons.",
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const units2 = state.targetedUnits.filter((u) => u.unitType !== UnitType$6.PLAYER_CONTROLLED);
      for (let unit2 of units2) {
        unit2.attackRange += radiusBoost * quantity;
      }
      if (units2.length === 0) {
        refundLastSpell$6(state, prediction, "No Target!");
      }
      return state;
    }
  }
};
const thornsId = "Thorns";
const {
  commonTypes: commonTypes$l,
  rand: rand$1,
  Unit: Unit$g,
  JImage: JImage$5,
  cardUtils: cardUtils$9,
  cardsUtil: cardsUtil$1
} = globalThis.SpellmasonsAPI;
const { getOrInitModifier } = cardsUtil$1;
const { playDefaultSpellSFX: playDefaultSpellSFX$8 } = cardUtils$9;
const { CardCategory: CardCategory$j, probabilityMap: probabilityMap$j, CardRarity: CardRarity$j } = commonTypes$l;
const reflectCardId = "Reflect";
const reflectMultiplier = 0.2;
let caster;
const modifierImagePath = "modifierShield.png";
function add$1(unit2, underworld, prediction, quantity = 1) {
  getOrInitModifier(unit2, reflectCardId, { isCurse: false, quantity }, () => {
    Unit$g.addEvent(unit2, reflectCardId);
  });
}
const spell$j = {
  card: {
    id: reflectCardId,
    category: CardCategory$j.Blessings,
    supportQuantity: true,
    manaCost: 80,
    healthCost: 0,
    expenseScaling: 3,
    costGrowthAlgorithm: "nlogn",
    probability: probabilityMap$j[CardRarity$j.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Reflect.png",
    animationPath: "spellShield",
    description: `Reflects ` + (reflectMultiplier * 100).toString() + `% of damage received back to attackers.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit2 of state.targetedUnits.filter((u) => u.alive)) {
        caster = state;
        let animationPromise = Promise.resolve();
        animationPromise = JImage$5.addOneOffAnimation(unit2, "priestProjectileHit", {}, { loop: false });
        playDefaultSpellSFX$8(card, prediction);
        await animationPromise;
        Unit$g.addModifier(unit2, reflectCardId, underworld, prediction);
      }
      return state;
    }
  },
  modifiers: {
    //stage: `Reflect`,
    add: add$1,
    addModifierVisuals(unit2) {
      const animatedReflectSprite = JImage$5.addSubSprite(unit2.image, modifierImagePath);
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
    onTooltip: (unit2, underworld) => {
      const modifier = unit2.modifiers[reflectCardId];
      if (modifier) {
        if (modifier.quantity == 1) {
          modifier.tooltip = `Reflects ` + (reflectMultiplier * 100).toString() + `% of damage received back to attacker ` + modifier.quantity.toString() + ` time.`;
        } else {
          modifier.tooltip = `Reflects ` + (reflectMultiplier * 100).toString() + `% of damage received back to attacker ` + modifier.quantity.toString() + ` times.`;
        }
      }
    },
    onTakeDamage: (unit2, amount2, _underworld, prediction, damageDealer) => {
      const modifier = unit2.modifiers[reflectCardId];
      if (modifier) {
        if (damageDealer && amount2 > 0) {
          damageDealer.events = damageDealer.events.filter((x) => x !== reflectCardId);
          damageDealer.events = damageDealer.events.filter((x) => x !== thornsId);
          Unit$g.takeDamage({
            unit: damageDealer,
            amount: amount2 * reflectMultiplier,
            sourceUnit: unit2
          }, _underworld, prediction);
          if (damageDealer.modifiers[reflectCardId]) {
            Unit$g.addEvent(damageDealer, reflectCardId);
          }
          if (damageDealer.modifiers[thornsId]) {
            Unit$g.addEvent(damageDealer, thornsId);
          }
          modifier.quantity -= 1;
          if (modifier.quantity == 0) {
            Unit$g.removeModifier(caster.casterUnit, reflectCardId, _underworld);
          }
        }
      }
      return amount2;
    }
  }
};
const {
  commonTypes: commonTypes$k,
  cards: cards$g
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$i, probabilityMap: probabilityMap$i, CardRarity: CardRarity$i, UnitType: UnitType$5 } = commonTypes$k;
const { refundLastSpell: refundLastSpell$5 } = cards$g;
const reinforceCardId = "Reinforce";
const reinforceAmount = 20;
const spell$i = {
  card: {
    id: reinforceCardId,
    category: CardCategory$i.Blessings,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$i[CardRarity$i.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Reinforce.png",
    animationPath: "potionPickup",
    description: "Increases Max HP by " + reinforceAmount.toString() + ".  Does not affect Spellmasons.",
    effect: async (state, card, quantity, underworld, prediction) => {
      const units2 = state.targetedUnits.filter((u) => u.unitType !== UnitType$5.PLAYER_CONTROLLED);
      for (let unit2 of units2) {
        unit2.healthMax += reinforceAmount;
        unit2.health += reinforceAmount;
      }
      if (units2.length === 0) {
        refundLastSpell$5(state, prediction);
      }
      return state;
    }
  }
};
const {
  colors: colors$7,
  JImage: JImage$4
} = globalThis.SpellmasonsAPI;
[[16711680, colors$7.stamina]];
async function healStaminaUnits(units2, amount2, sourceUnit, underworld, prediction, state) {
  units2 = units2.filter((u) => u.alive);
  if (units2.length == 0 || amount2 == 0)
    return;
  for (let unit2 of units2) {
    unit2.stamina += amount2;
  }
  return state;
}
const {
  commonTypes: commonTypes$j
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$h, probabilityMap: probabilityMap$h, CardRarity: CardRarity$h } = commonTypes$j;
const revitaliseCardId = "Revitalise";
const revitaliseAmount = 100;
const spell$h = {
  card: {
    id: revitaliseCardId,
    category: CardCategory$h.Blessings,
    //sfx: healSfx, // Heal FX Handled in Unit.takeDamage()
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$h[CardRarity$h.COMMON],
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
  Particles: Particles$1,
  commonTypes: commonTypes$i,
  Unit: Unit$f,
  EffectsHeal: EffectsHeal$1,
  cards: cards$f
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$g, probabilityMap: probabilityMap$g, CardRarity: CardRarity$g } = commonTypes$i;
const { refundLastSpell: refundLastSpell$4 } = cards$f;
const siphonCardId = "Siphon";
const amount = 10;
const spell$g = {
  card: {
    id: siphonCardId,
    category: CardCategory$g.Mana,
    sfx: "potionPickupMana",
    supportQuantity: true,
    manaCost: 0,
    healthCost: 8,
    costGrowthAlgorithm: "nlogn",
    expenseScaling: 1,
    probability: probabilityMap$g[CardRarity$g.FORBIDDEN],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Siphon.png",
    animationPath: "potionPickup",
    description: `Drain 10 health and 10 mana from targets.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = state.targetedUnits.filter((u) => u.alive);
      let promises = [];
      let manaStolen = 0;
      let healthStolen = 0;
      let amountStolen = amount * quantity;
      for (let unit2 of targets) {
        const manaStolenFromUnit = Math.min(unit2.mana, amountStolen);
        unit2.mana -= manaStolenFromUnit;
        manaStolen += manaStolenFromUnit;
        const healthStolenFromUnit = Math.min(unit2.health, amountStolen);
        healthStolen += healthStolenFromUnit;
        Unit$f.takeDamage({
          unit: unit2,
          amount: healthStolenFromUnit,
          sourceUnit: state.casterUnit,
          fromVec2: state.casterUnit
        }, underworld, prediction);
        if (!globalThis.headless && !prediction) {
          promises.push(Particles$1.makeManaTrail(unit2, state.casterUnit, underworld, "#fff9e4", "#ffcb3f", targets.length * quantity));
          promises.push(Particles$1.makeManaTrail(unit2, state.casterUnit, underworld, "#e4f9ff", "#3fcbff", targets.length * quantity));
        }
      }
      await Promise.all(promises);
      state.casterUnit.mana += manaStolen;
      EffectsHeal$1.healUnit(state.casterUnit, healthStolen, state.casterUnit, underworld, prediction, state);
      if (healthStolen == 0 && manaStolen == 0) {
        refundLastSpell$4(state, prediction);
      }
      return state;
    }
  }
};
const targetSimilarId = "Target Similar";
const {
  commonTypes: commonTypes$h,
  cards: cards$e,
  config: config$c,
  math: math$9,
  colors: colors$6,
  JAudio: JAudio$5,
  Unit: Unit$e
} = globalThis.SpellmasonsAPI;
const { addTarget: addTarget$4 } = cards$e;
const { distance: distance$4 } = math$9;
const { CardCategory: CardCategory$f, probabilityMap: probabilityMap$f, CardRarity: CardRarity$f, UnitSubType: UnitSubType$4 } = commonTypes$h;
const targetAllyId = "Target Ally";
const targetsPerQuantity$1 = 2;
const spell$f = {
  card: {
    id: targetAllyId,
    category: CardCategory$f.Targeting,
    supportQuantity: true,
    requires: [targetSimilarId],
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$f[CardRarity$f.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/TargetAlly.png",
    requiresFollowingCard: true,
    description: `Target the closest ally. ${targetsPerQuantity$1} per stack.`,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const faction = state.casterUnit.faction;
      const addedTargets = underworld.getPotentialTargets(prediction).filter((u) => Unit$e.isUnit(u) && u.unitSubType != UnitSubType$4.DOODAD && u.faction == faction && u !== state.casterUnit && !state.targetedUnits.includes(u)).sort((a, b) => distance$4(state.casterPositionAtTimeOfCast, a) - distance$4(state.casterPositionAtTimeOfCast, b)).slice(0, targetsPerQuantity$1 * quantity);
      if (addedTargets.length) {
        for (const target of addedTargets) {
          addTarget$4(target, state, underworld, prediction);
        }
        if (!prediction && !globalThis.headless) {
          JAudio$5.playSFXKey("targeting");
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
        globalThis.predictionGraphicsGreen.lineStyle(2, colors$6.targetingSpellGreen, 1);
        globalThis.predictionGraphicsGreen.drawCircle(target.x, target.y, config$c.COLLISION_MESH_RADIUS);
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
  commonTypes: commonTypes$g,
  cards: cards$d,
  config: config$b,
  math: math$8,
  colors: colors$5,
  Unit: Unit$d,
  JAudio: JAudio$4
} = globalThis.SpellmasonsAPI;
const { addTarget: addTarget$3 } = cards$d;
const { distance: distance$3 } = math$8;
const { CardCategory: CardCategory$e, probabilityMap: probabilityMap$e, CardRarity: CardRarity$e, UnitSubType: UnitSubType$3 } = commonTypes$g;
const targetPlayerId = "Target Player";
const targetsPerQuantity = 2;
const PLAYER_CONTROLLED = 0;
const spell$e = {
  card: {
    id: targetPlayerId,
    category: CardCategory$e.Targeting,
    supportQuantity: true,
    requires: [targetAllyId],
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$e[CardRarity$e.RARE],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/TargetPlayer.png",
    requiresFollowingCard: true,
    description: `Target the closest Player.`,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const addedTargets = underworld.getPotentialTargets(prediction).filter((u) => Unit$d.isUnit(u) && u.unitSubType != UnitSubType$3.DOODAD && // Target players only
      u.unitType == PLAYER_CONTROLLED && // Filter out caster Unit since they are naturPlayer
      // the "closest" to themselves and if they want to target
      // themselves they can by casting on themselves and wont
      // need target Player to do it
      u !== state.casterUnit && !state.targetedUnits.includes(u)).sort((a, b) => distance$3(state.casterPositionAtTimeOfCast, a) - distance$3(state.casterPositionAtTimeOfCast, b)).slice(0, targetsPerQuantity * quantity);
      if (addedTargets.length) {
        for (const target of addedTargets) {
          addTarget$3(target, state, underworld, prediction);
        }
        if (!prediction && !globalThis.headless) {
          JAudio$4.playSFXKey("targeting");
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
        globalThis.predictionGraphicsGreen.lineStyle(2, colors$5.targetingSpellGreen, 1);
        globalThis.predictionGraphicsGreen.drawCircle(target.x, target.y, config$b.COLLISION_MESH_RADIUS);
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
  commonTypes: commonTypes$f,
  cards: cards$c,
  rand,
  cardUtils: cardUtils$8,
  PixiUtils: PixiUtils$4,
  Unit: Unit$c
} = globalThis.SpellmasonsAPI;
const { randFloat } = rand;
const { CardCategory: CardCategory$d, probabilityMap: probabilityMap$d, CardRarity: CardRarity$d } = commonTypes$f;
const tripleSlashCardId = "Triple Slash";
const damageDone = 20;
const delayBetweenAnimationsStart = 250;
const animationPath = "spellHurtCuts";
const spell$d = {
  card: {
    id: tripleSlashCardId,
    requires: [slashCardId],
    category: CardCategory$d.Damage,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$d[CardRarity$d.UNCOMMON],
    thumbnail: "spellmasons-mods/Bogiacs_Spells/graphics/icons/TripleSlash.png",
    animationPath,
    sfx: "hurt",
    description: [`Casts the Slash Spell three times.`],
    effect: async (state, card, quantity, underworld, prediction) => {
      return await tripleSlashEffect(state, card, quantity, underworld, prediction, damageDone, 1);
    }
  }
};
async function tripleSlashEffect(state, card, quantity, underworld, prediction, damage2, scale) {
  const targets = state.targetedUnits.filter((u) => u.alive);
  let delayBetweenAnimations = delayBetweenAnimationsStart;
  for (let tripleSlashCounter = 0; tripleSlashCounter < 3; tripleSlashCounter++) {
    for (let q = 0; q < quantity; q++) {
      if (!prediction && !globalThis.headless) {
        cardUtils$8.playDefaultSpellSFX(card, prediction);
        for (let unit2 of targets) {
          const spellEffectImage = cardUtils$8.oneOffImage(unit2, animationPath, PixiUtils$4.containerSpells);
          if (spellEffectImage) {
            spellEffectImage.sprite.rotation = randFloat(-Math.PI / 6, Math.PI / 6);
            if (q % 2 == 0) {
              spellEffectImage.sprite.scale.x = -1;
            }
            spellEffectImage.sprite.scale.x *= scale;
            spellEffectImage.sprite.scale.y *= scale;
          }
          Unit$c.takeDamage({
            unit: unit2,
            amount: damage2,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit
          }, underworld, prediction);
        }
        await new Promise((resolve) => setTimeout(resolve, delayBetweenAnimations));
        delayBetweenAnimations *= 0.8;
        delayBetweenAnimations = Math.max(20, delayBetweenAnimations);
      } else {
        for (let unit2 of targets) {
          Unit$c.takeDamage({
            unit: unit2,
            amount: damage2,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit
          }, underworld, prediction);
        }
      }
    }
  }
  return state;
}
const mod$1 = {
  modName: "Bogiac's Spells",
  author: "Bogiac",
  description: "Adds some new spells to the game",
  screenshot: "spellmasons-mods/Bogiacs_Spells/graphics/icons/Bogiacs_Spells_icon.png",
  spritesheet: "spellmasons-mods/Bogiacs_Spells/graphics/spritesheet.json",
  spells: [
    //Add or Remove spells here.
    spell$n,
    spell$m,
    spell$l,
    spell$k,
    //Impact,
    spell$j,
    spell$i,
    spell$h,
    spell$g,
    spell$f,
    spell$e,
    spell$d
  ]
};
const {
  commonTypes: commonTypes$e,
  Unit: Unit$b,
  colors: colors$4,
  config: config$a,
  math: math$7,
  Vec: Vec$7,
  PlanningView: PlanningView$7,
  JPromise: JPromise$3
} = globalThis.SpellmasonsAPI;
const { add } = Vec$7;
const { CardCategory: CardCategory$c, CardRarity: CardRarity$c, probabilityMap: probabilityMap$c, UnitType: UnitType$4 } = commonTypes$e;
const { distance: distance$2 } = math$7;
const { drawPredictionLine, drawUICircleFillPrediction } = PlanningView$7;
const { raceTimeout: raceTimeout$2 } = JPromise$3;
const id$6 = "Assimilate";
const numberOfTargetsPerQuantity = 5;
const baseRadius = 250;
const spell$c = {
  card: {
    id: id$6,
    category: CardCategory$c.Soul,
    manaCost: 0,
    healthCost: 50,
    expenseScaling: 2,
    costGrowthAlgorithm: "exponential",
    probability: probabilityMap$c[CardRarity$c.RARE],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconAssimilate.png",
    supportQuantity: true,
    requiresFollowingCard: false,
    allowNonUnitTarget: true,
    omitForWizardType: ["Deathmason", "Goru"],
    description: "Connects the caster to 5 nearby targets per cast, sacrificing them and funneling their power into the caster. Can only be cast once",
    effect: async (state, card, quantity, underworld, prediction) => {
      let limitTargetsLeft = numberOfTargetsPerQuantity * quantity + 1;
      let potentialTargets = [];
      underworld.getPotentialTargets(prediction).filter((t) => Unit$b.isUnit(t)).sort((a, b) => distance$2(a, state.casterUnit) - distance$2(b, state.casterUnit)).slice(0, limitTargetsLeft).forEach((u) => {
        if (Unit$b.isUnit(u))
          potentialTargets.push(u);
      });
      const wizard = state.casterUnit;
      let targets = [wizard];
      targets.length;
      const linkGroups = [];
      const target = wizard;
      const filterFn = (x) => {
        if (Unit$b.isUnit(x)) {
          return true;
        } else {
          return false;
        }
      };
      const adjustedRadius = baseRadius * (1 + 0.1 * state.aggregator.radiusBoost);
      const chained = getConnectingUnits(
        target,
        adjustedRadius,
        limitTargetsLeft,
        targets,
        potentialTargets,
        filterFn,
        prediction
      );
      if (prediction) {
        chained.forEach((chained_entity) => {
          drawPredictionLine(chained_entity.chainSource, chained_entity.entity);
        });
      } else {
        linkGroups.push(chained.map((x) => ({ from: x.chainSource, targets: [{ to: x.entity, playedSound: false }] })));
      }
      chained.forEach((u) => targets.push(u.entity));
      if (!prediction) {
        await animateConnections(linkGroups, underworld, prediction);
      }
      const filterCasterOut = (x) => {
        if (x == state.casterUnit) {
          return false;
        } else {
          return true;
        }
      };
      mergeUnits(state.casterUnit, targets.filter((x) => filterCasterOut(x)), underworld, prediction, state);
      if (!prediction && !globalThis.headless && state.casterPlayer) {
        await new Promise((res) => {
          setTimeout(res, 200);
        });
        if (!state.casterPlayer.disabledCards) {
          state.casterPlayer.disabledCards = [];
        }
        state.casterPlayer.disabledCards.push("Assimilate");
      }
      return state;
    }
  }
};
function mergeUnits(target, unitsToMerge, underworld, prediction, state) {
  for (const unit2 of unitsToMerge) {
    if (prediction) {
      const graphics = globalThis.predictionGraphicsBlue;
      if (graphics) {
        graphics.lineStyle(2, 16777215, 1);
        graphics.moveTo(unit2.x, unit2.y);
        graphics.lineTo(target.x, target.y);
        graphics.drawCircle(target.x, target.y, 2);
      }
    }
    if (target.unitType == UnitType$4.PLAYER_CONTROLLED) {
      target.health += unit2.health;
      target.mana += unit2.mana;
      target.stamina += unit2.stamina;
      target.soulFragments += unit2.soulFragments;
      target.moveSpeed += unit2.moveSpeed / 10;
      target.strength += unit2.strength;
    } else {
      target.healthMax += unit2.healthMax;
      target.health += unit2.health;
      target.manaMax += unit2.manaMax;
      target.mana += unit2.mana;
      target.damage += unit2.damage;
      target.manaCostToCast += unit2.manaCostToCast;
      target.manaPerTurn += unit2.manaPerTurn;
      target.strength += unit2.strength;
    }
    if (unit2.unitType == UnitType$4.PLAYER_CONTROLLED) {
      Unit$b.die(unit2, underworld, prediction);
    } else {
      if (unit2.originalLife) {
        underworld.enemiesKilled++;
      }
      if (state) {
        state.targetedUnits = state.targetedUnits.filter((u) => u != unit2);
      }
      Unit$b.cleanup(unit2);
    }
  }
  return state;
}
function getConnectingUnits(source, radius, chainsLeft, targets = [], potentialTargets, filterFn, prediction, radiusFn) {
  potentialTargets = potentialTargets.filter((x) => filterFn(x)).filter((t) => !targets.includes(t));
  let connected = [];
  if (chainsLeft > 0) {
    connected = getNextConnectingEntities(source, radius, chainsLeft, potentialTargets, prediction, radiusFn);
  }
  return connected;
}
function getNextConnectingEntities(source, baseRadius2, chainsLeft, potentialTargets, prediction, radiusModifierFn) {
  potentialTargets = potentialTargets.filter((x) => x != source);
  let adjustedRadius = baseRadius2;
  if (radiusModifierFn) {
    adjustedRadius *= radiusModifierFn(source, chainsLeft);
  }
  if (prediction) {
    drawUICircleFillPrediction(source, adjustedRadius - config$a.COLLISION_MESH_RADIUS / 2, colors$4.trueWhite);
  }
  let connected = [];
  do {
    let closestDist = adjustedRadius;
    let closestTarget = void 0;
    for (let t of potentialTargets) {
      const dist = math$7.distance(t, source);
      if (dist <= closestDist) {
        closestDist = dist;
        closestTarget = t;
      }
    }
    if (closestTarget) {
      connected.push({ chainSource: source, entity: closestTarget });
      chainsLeft--;
      if (chainsLeft > 0) {
        const next = getNextConnectingEntities(closestTarget, baseRadius2, chainsLeft, potentialTargets, prediction, radiusModifierFn);
        chainsLeft -= next.length;
        connected = connected.concat(next);
        potentialTargets = potentialTargets.filter((x) => {
          for (let c of connected) {
            if (x == c.entity)
              return false;
          }
          return true;
        });
      }
    } else {
      break;
    }
  } while (chainsLeft + 1 > 0);
  return connected;
}
const timeoutMsAnimation$2 = 2e3;
async function animateConnections(links, underworld, prediction) {
  if (globalThis.headless || prediction) {
    return Promise.resolve();
  }
  if (links.length == 0) {
    return Promise.resolve();
  }
  const entitiesTargeted = [];
  return raceTimeout$2(timeoutMsAnimation$2, "animatedConnect", new Promise((resolve) => {
    animateFrame$2(links, Date.now(), entitiesTargeted, underworld, resolve, prediction)();
  }));
}
const millisToGrow$2 = 750;
const circleRadius = config$a.COLLISION_MESH_RADIUS / 2;
function animateFrame$2(linkGroups, startTime, entitiesTargeted, underworld, resolve, prediction) {
  return function animateFrameInner() {
    if (globalThis.headless || prediction) {
      resolve();
      return;
    }
    if (globalThis.predictionGraphicsGreen) {
      globalThis.predictionGraphicsGreen.clear();
      globalThis.predictionGraphicsGreen.lineStyle(2, 16777215, 1);
      const now = Date.now();
      const timeDiff = now - startTime;
      for (let links of linkGroups) {
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          if (!link) {
            continue;
          }
          const { from, targets } = link;
          const proportionComplete = math$7.lerpSegmented(0, 1, timeDiff / millisToGrow$2, i, links.length);
          for (let target of targets) {
            if (proportionComplete === 0) {
              continue;
            }
            const { to } = target;
            const dist = distance$2(from, to);
            const edgeOfStartCircle = add(from, math$7.similarTriangles(to.x - from.x, to.y - from.y, dist, circleRadius));
            globalThis.predictionGraphicsGreen.moveTo(edgeOfStartCircle.x, edgeOfStartCircle.y);
            const edgeOfCircle = add(to, math$7.similarTriangles(from.x - to.x, from.y - to.y, dist, circleRadius));
            const pointApproachingTarget = add(edgeOfStartCircle, math$7.similarTriangles(edgeOfCircle.x - edgeOfStartCircle.x, edgeOfCircle.y - edgeOfStartCircle.y, dist, dist * Math.min(1, proportionComplete)));
            globalThis.predictionGraphicsGreen.lineTo(pointApproachingTarget.x, pointApproachingTarget.y);
            if (proportionComplete >= 1) {
              globalThis.predictionGraphicsGreen.drawCircle(to.x, to.y, circleRadius);
              if (!target.playedSound) {
                target.playedSound = true;
              }
            }
          }
        }
      }
      if (timeDiff > millisToGrow$2 + 250) {
        resolve();
        globalThis.predictionGraphicsGreen.clear();
        return;
      } else {
        requestAnimationFrame(animateFrame$2(linkGroups, startTime, entitiesTargeted, underworld, resolve, prediction));
      }
    } else {
      resolve();
    }
  };
}
const {
  commonTypes: commonTypes$d,
  Unit: Unit$a,
  colors: colors$3,
  math: math$6,
  config: config$9,
  Vec: Vec$6,
  cards: cards$b,
  PixiUtils: PixiUtils$3,
  moveWithCollision: moveWithCollision$6,
  modifierSummonerSickness: modifierSummonerSickness$2,
  JImage: JImage$3,
  FloatingText: FloatingText$2,
  Arrow: Arrow$2
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$b, CardRarity: CardRarity$b, probabilityMap: probabilityMap$b } = commonTypes$d;
const { summoningSicknessId: summoningSicknessId$2 } = modifierSummonerSickness$2;
const floatingText$2 = FloatingText$2.default;
const bloodArrowCardId = "Bloodied Arrow";
const damage$2 = 10;
const bloodiedArrowEffect = Arrow$2.arrowEffect(1, bloodArrowCardId);
const corpseDecayId$2 = "Corpse Decay";
const spell$b = {
  card: {
    id: bloodArrowCardId,
    category: CardCategory$b.Curses,
    probability: probabilityMap$b[CardRarity$b.UNCOMMON],
    manaCost: 0,
    healthCost: 10,
    expenseScaling: 1,
    supportQuantity: false,
    ignoreRange: true,
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    // This ensures that "target scamming" doesn't work with target arrow
    // due to it being able to fire out of range
    noInitialTarget: true,
    requiresFollowingCard: false,
    animationPath: "",
    sfx: "",
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconBloodArrow.png",
    description: "Conjures a corrupted arrow that deals 10 damage and TRANSFERS one stack of each curse per stack of Bloodied Arrow from the caster to the victims.",
    effect: async (state, card, quantity, underworld, prediction) => bloodiedArrowEffect(state, card, quantity, underworld, prediction).then((state2) => {
      const modifiersToExclude = [summoningSicknessId$2, corpseDecayId$2];
      const curses = Object.entries(state2.casterUnit.modifiers).map(([id2, mod2]) => ({ modId: id2, modifier: mod2 })).filter((x) => x.modifier.isCurse).filter((x) => !modifiersToExclude.includes(x.modId));
      for (let curse of curses) {
        curse.modifier.quantity -= quantity;
        if (curse.modifier.quantity <= 0) {
          Unit$a.removeModifier(state2.casterUnit, curse.modId, underworld);
        }
      }
      return state2;
    })
  },
  events: {
    onProjectileCollision: ({ unit: unit2, pickup, underworld, projectile, prediction }) => {
      var _a;
      if (projectile.state && projectile.sourceUnit) {
        if (unit2) {
          Unit$a.takeDamage({
            unit: unit2,
            amount: damage$2,
            sourceUnit: projectile.sourceUnit,
            fromVec2: projectile.startPoint,
            thinBloodLine: true
          }, underworld, prediction);
          const modifiersToExclude = [summoningSicknessId$2, corpseDecayId$2];
          const curses = Object.entries(projectile.sourceUnit.modifiers).map(([id2, mod2]) => ({ modId: id2, modifier: mod2 })).filter((x) => x.modifier.isCurse).filter((x) => !modifiersToExclude.includes(x.modId));
          for (let curse of curses) {
            let curseAmount = curse.modifier.quantity;
            let unitCurseAmount = ((_a = unit2.modifiers[curse.modId]) == null ? void 0 : _a.quantity) || 0;
            if (unitCurseAmount > curseAmount) {
              continue;
            } else if (unitCurseAmount < curseAmount) {
              if (!prediction) {
                floatingText$2({ coords: unit2, text: curse.modId });
              }
              if (unit2.alive) {
                Unit$a.addModifier(unit2, curse.modId, underworld, prediction, 1, curse.modifier);
              }
            }
          }
        } else {
          projectile.state.castLocation = projectile.pushedObject;
        }
      } else {
        console.error("State was not passed through projectile");
      }
    }
  }
};
const {
  commonTypes: commonTypes$c,
  Unit: Unit$9,
  colors: colors$2,
  math: math$5,
  config: config$8,
  Vec: Vec$5,
  cards: cards$a,
  PixiUtils: PixiUtils$2,
  moveWithCollision: moveWithCollision$5,
  modifierSummonerSickness: modifierSummonerSickness$1,
  JImage: JImage$2,
  FloatingText: FloatingText$1,
  Arrow: Arrow$1,
  Purify
} = globalThis.SpellmasonsAPI;
const floatingText$1 = FloatingText$1.default;
const { CardCategory: CardCategory$a, CardRarity: CardRarity$a, probabilityMap: probabilityMap$a } = commonTypes$c;
const { summoningSicknessId: summoningSicknessId$1 } = modifierSummonerSickness$1;
const damage$1 = 20;
const corpseDecayId$1 = "Corpse Decay";
const STERILE_ARROW_ID = "Sterile Arrow";
const serileArrowEffect = Arrow$1.arrowEffect(1, STERILE_ARROW_ID);
const spell$a = {
  card: {
    id: STERILE_ARROW_ID,
    category: CardCategory$a.Curses,
    probability: probabilityMap$a[CardRarity$a.UNCOMMON],
    manaCost: 0,
    healthCost: 15,
    expenseScaling: 1,
    supportQuantity: true,
    ignoreRange: true,
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    // This ensures that "target scamming" doesn't work with target arrow
    // due to it being able to fire out of range
    noInitialTarget: true,
    requiresFollowingCard: false,
    animationPath: "",
    replaces: [bloodArrowCardId],
    sfx: "",
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconSterileArrow.png",
    description: "Conjures a mystical arrow that deals 20 damage and TRANSFERS curses from the caster to the victim.",
    effect: async (state, card, quantity, underworld, prediction) => serileArrowEffect(state, card, quantity, underworld, prediction).then((state2) => {
      Purify.apply(state2.casterUnit, underworld);
      return state2;
    })
  },
  events: {
    onProjectileCollision: ({ unit: unit2, pickup, underworld, projectile, prediction }) => {
      if (projectile.state && projectile.sourceUnit) {
        if (unit2) {
          Unit$9.takeDamage({
            unit: unit2,
            amount: damage$1,
            sourceUnit: projectile.sourceUnit,
            fromVec2: projectile.startPoint,
            thinBloodLine: true
          }, underworld, prediction);
          const modifiersToExclude = [summoningSicknessId$1, corpseDecayId$1];
          const curses = Object.entries(projectile.sourceUnit.modifiers).map(([id2, mod2]) => ({ modId: id2, modifier: mod2 })).filter((x) => x.modifier.isCurse).filter((x) => !modifiersToExclude.includes(x.modId));
          for (let curse of curses) {
            if (!prediction) {
              floatingText$1({ coords: unit2, text: curse.modId });
            }
            if (unit2.alive) {
              const quantityToAdd = curse.modifier.quantity;
              Unit$9.addModifier(unit2, curse.modId, underworld, prediction, quantityToAdd, curse.modifier);
            }
          }
        } else {
          projectile.state.castLocation = projectile.pushedObject;
        }
      } else {
        console.error("State was not passed through projectile");
      }
    }
  }
};
const {
  commonTypes: commonTypes$b,
  Unit: Unit$8,
  colors: colors$1,
  math: math$4,
  config: config$7,
  Vec: Vec$4,
  cards: cards$9,
  PixiUtils: PixiUtils$1,
  moveWithCollision: moveWithCollision$4,
  modifierSummonerSickness,
  JImage: JImage$1,
  FloatingText,
  Arrow
} = globalThis.SpellmasonsAPI;
const floatingText = FloatingText.default;
const { CardCategory: CardCategory$9, CardRarity: CardRarity$9, probabilityMap: probabilityMap$9 } = commonTypes$b;
const { summoningSicknessId } = modifierSummonerSickness;
const damage = 20;
const corpseDecayId = "Corpse Decay";
const BLOODTHORN_ARROW_ID = "Bloodthorn Arrow";
const spell$9 = {
  card: {
    id: BLOODTHORN_ARROW_ID,
    category: CardCategory$9.Curses,
    probability: probabilityMap$9[CardRarity$9.UNCOMMON],
    manaCost: 0,
    healthCost: 15,
    expenseScaling: 1,
    supportQuantity: true,
    ignoreRange: true,
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    // This ensures that "target scamming" doesn't work with target arrow
    // due to it being able to fire out of range
    noInitialTarget: true,
    requiresFollowingCard: false,
    animationPath: "",
    replaces: [bloodArrowCardId],
    sfx: "",
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconBloodThorn.png",
    description: "Conjures a corrupted arrow that deals 20 damage and SPREADS curses from the caster to the victim.",
    effect: Arrow.arrowEffect(1, BLOODTHORN_ARROW_ID)
  },
  events: {
    onProjectileCollision: ({ unit: unit2, pickup, underworld, projectile, prediction }) => {
      if (projectile.state && projectile.sourceUnit) {
        if (unit2) {
          Unit$8.takeDamage({
            unit: unit2,
            amount: damage,
            sourceUnit: projectile.sourceUnit,
            fromVec2: projectile.startPoint,
            thinBloodLine: true
          }, underworld, prediction);
          const modifiersToExclude = [summoningSicknessId, corpseDecayId];
          const curses = Object.entries(projectile.sourceUnit.modifiers).map(([id2, mod2]) => ({ modId: id2, modifier: mod2 })).filter((x) => x.modifier.isCurse).filter((x) => !modifiersToExclude.includes(x.modId));
          for (let curse of curses) {
            if (!prediction) {
              floatingText({ coords: unit2, text: curse.modId });
            }
            if (unit2.alive) {
              Unit$8.addModifier(unit2, curse.modId, underworld, prediction, curse.modifier.quantity * 2, curse.modifier);
            }
          }
        } else {
          projectile.state.castLocation = projectile.pushedObject;
        }
      } else {
        console.error("State was not passed through projectile");
      }
    }
  }
};
const {
  commonTypes: commonTypes$a,
  Unit: Unit$7,
  units: units$3,
  config: config$6,
  cards: cards$8,
  cardUtils: cardUtils$7,
  PlanningView: PlanningView$6,
  VisualEffects: VisualEffects$2,
  forcePushAwayFrom: forcePushAwayFrom$2
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$8, CardRarity: CardRarity$8, probabilityMap: probabilityMap$8, Faction: Faction$3, UnitType: UnitType$3 } = commonTypes$a;
const { takeDamage: takeDamage$4 } = Unit$7;
const { allUnits: allUnits$3 } = units$3;
const { skyBeam: skyBeam$2 } = VisualEffects$2;
const { refundLastSpell: refundLastSpell$3, getCurrentTargets: getCurrentTargets$5, defaultTargetsForAllowNonUnitTargetTargetingSpell: defaultTargetsForAllowNonUnitTargetTargetingSpell$3 } = cards$8;
const { playDefaultSpellSFX: playDefaultSpellSFX$7 } = cardUtils$7;
const { addWarningAtMouse: addWarningAtMouse$2, drawUICirclePrediction: drawUICirclePrediction$3 } = PlanningView$6;
const id$5 = "Raise Pillar";
const spell$8 = {
  card: {
    id: id$5,
    category: CardCategory$8.Soul,
    sfx: "summonDecoy",
    supportQuantity: false,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$8[CardRarity$8.COMMON],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconRaise_Pillar.png",
    description: "Raise a pillar at the target location, dealing 10 damage to nearby enemies and pushing them away.",
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const unitId = "pillar";
      const sourceUnit = allUnits$3[unitId];
      if (sourceUnit) {
        const currentTargets = getCurrentTargets$5(state);
        const newPillarLocations = currentTargets.length ? currentTargets : [state.castLocation];
        for (let target of newPillarLocations) {
          const summonLocation = {
            x: target.x,
            y: target.y
          };
          if (underworld.isCoordOnWallTile(summonLocation)) {
            if (prediction) {
              const WARNING = "Invalid Summon Location";
              addWarningAtMouse$2(WARNING);
            } else {
              refundLastSpell$3(state, prediction, "Invalid summon location, mana refunded.");
            }
            return state;
          }
          playDefaultSpellSFX$7(card, prediction);
          const unit2 = Unit$7.create(
            sourceUnit.id,
            summonLocation.x,
            summonLocation.y,
            Faction$3.ALLY,
            sourceUnit.info.image,
            UnitType$3.AI,
            sourceUnit.info.subtype,
            {
              ...sourceUnit.unitProps,
              healthMax: (sourceUnit.unitProps.healthMax || config$6.UNIT_BASE_HEALTH) * quantity,
              health: (sourceUnit.unitProps.health || config$6.UNIT_BASE_HEALTH) * quantity,
              damage: (sourceUnit.unitProps.damage || 0) * quantity,
              strength: quantity
            },
            underworld,
            prediction,
            state.casterUnit
          );
          if (prediction) {
            drawUICirclePrediction$3(unit2, 32, 16777215);
          }
          pillarExplode$2(unit2, 32, 10, underworld, prediction, state);
          if (!prediction) {
            skyBeam$2(unit2);
          }
        }
      } else {
        console.error(`Source unit ${unitId} is missing`);
      }
      return state;
    }
  }
};
async function pillarExplode$2(caster2, radius, damage2, underworld, prediction, state) {
  const units2 = underworld.getUnitsWithinDistanceOfTarget(caster2, radius, prediction).filter((u) => u.id != caster2.id).filter((u) => u.unitSourceId != "pillar");
  units2.forEach((u) => {
    takeDamage$4({
      unit: u,
      amount: damage2,
      sourceUnit: caster2,
      fromVec2: caster2
    }, underworld, prediction);
  });
  units2.forEach((u) => {
    const pushDistance = 32;
    forcePushAwayFrom$2(u, state.casterUnit, pushDistance, underworld, prediction, caster2);
  });
  underworld.getPickupsWithinDistanceOfTarget(caster2, radius, prediction).forEach((p) => {
    const pushDistance = 32;
    forcePushAwayFrom$2(p, state.casterUnit, pushDistance, underworld, prediction, caster2);
  });
}
const {
  commonTypes: commonTypes$9,
  Unit: Unit$6,
  math: math$3,
  config: config$5,
  PixiUtils,
  moveWithCollision: moveWithCollision$3,
  cardUtils: cardUtils$6,
  cards: cards$7,
  JImage,
  units: units$2,
  forcePushTowards: forcePushTowards$1
} = globalThis.SpellmasonsAPI;
const { allUnits: allUnits$2 } = units$2;
const { CardCategory: CardCategory$7, CardRarity: CardRarity$7, probabilityMap: probabilityMap$7, Faction: Faction$2, UnitSubType: UnitSubType$2, UnitType: UnitType$2 } = commonTypes$9;
const { takeDamage: takeDamage$3 } = Unit$6;
const { containerProjectiles } = PixiUtils;
const { makeForceMoveProjectile } = moveWithCollision$3;
const { playDefaultSpellSFX: playDefaultSpellSFX$6 } = cardUtils$6;
const { refundLastSpell: refundLastSpell$2 } = cards$7;
const id$4 = "Earth Push";
const defaultPushDistance$2 = 140;
const spell$7 = {
  card: {
    id: id$4,
    category: CardCategory$7.Damage,
    supportQuantity: true,
    sfx: "push",
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    requires: [id$5],
    probability: probabilityMap$7[CardRarity$7.COMMON],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconEarthPush.png",
    description: "Launches targeted traps, pillars, and urns towards the cast location. Pillars deal 60 damage each and urns explode on collision with units.",
    ignoreRange: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      let promises = [];
      const collideFnKey = id$4;
      playDefaultSpellSFX$6(card, prediction);
      const pickupTargets = state.targetedPickups.filter((p) => p.name === "Trap");
      const pillarTargets = state.targetedUnits.filter((u) => u.unitSourceId === "pillar");
      const urnTargets = state.targetedUnits.filter((u) => u.unitSourceId === "Ice Urn" || u.unitSourceId === "Explosive Urn" || u.unitSourceId === "Toxic Urn");
      if (pickupTargets.length == 0 && pillarTargets.length == 0 && urnTargets.length == 0) {
        refundLastSpell$2(state, prediction, "Target a trap, pillar, or urn");
      } else {
        if (pickupTargets.length > 0) {
          for (let pickup of pickupTargets) {
            promises.push(forcePushTowards$1(pickup, state.castLocation, defaultPushDistance$2 * 3 * quantity, underworld, prediction, state.casterUnit));
          }
        }
        if (pillarTargets.length > 0) {
          for (let pillar of pillarTargets) {
            let casterPositionAtTimeOfCast = pillar;
            let target = state.castLocation;
            let image;
            const startPoint = casterPositionAtTimeOfCast;
            const velocity = math$3.similarTriangles(target.x - startPoint.x, target.y - casterPositionAtTimeOfCast.y, math$3.distance(startPoint, target), config$5.ARROW_PROJECTILE_SPEED);
            if (!prediction) {
              image = JImage.create(casterPositionAtTimeOfCast, "pillar", containerProjectiles);
              if (image) {
                image.sprite.rotation = Math.PI / 6;
              }
            }
            const pushedObject = {
              x: casterPositionAtTimeOfCast.x,
              y: casterPositionAtTimeOfCast.y,
              radius: 1,
              inLiquid: false,
              image,
              immovable: false,
              beingPushed: false,
              debugName: "pillar_proj"
            };
            Unit$6.cleanup(pillar);
            makeForceMoveProjectile({
              sourceUnit: state.casterUnit,
              pushedObject,
              startPoint,
              velocity,
              piercesRemaining: 0,
              bouncesRemaining: 0,
              collidingUnitIds: [state.casterUnit.id],
              collideFnKey,
              state
            }, underworld, prediction);
          }
        }
        if (urnTargets.length > 0) {
          for (let urn of urnTargets) {
            let casterPositionAtTimeOfCast = urn;
            let target = state.castLocation;
            let image;
            const startPoint = casterPositionAtTimeOfCast;
            const velocity = math$3.similarTriangles(target.x - startPoint.x, target.y - casterPositionAtTimeOfCast.y, math$3.distance(startPoint, target), config$5.ARROW_PROJECTILE_SPEED);
            if (!prediction && urn.image) {
              image = JImage.load(JImage.serialize(urn.image), containerProjectiles);
              if (image) {
                image.sprite.rotation = Math.atan2(velocity.y, velocity.x);
              }
            }
            const pushedObject = {
              x: casterPositionAtTimeOfCast.x,
              y: casterPositionAtTimeOfCast.y,
              radius: 1,
              inLiquid: false,
              image,
              immovable: false,
              beingPushed: false,
              debugName: urn.unitSourceId
            };
            Unit$6.cleanup(urn);
            makeForceMoveProjectile({
              sourceUnit: state.casterUnit,
              pushedObject,
              startPoint,
              velocity,
              piercesRemaining: 0,
              bouncesRemaining: 0,
              collidingUnitIds: [state.casterUnit.id],
              collideFnKey,
              state
            }, underworld, prediction);
          }
        }
      }
      await Promise.all(promises);
      return state;
    }
  },
  events: {
    onProjectileCollision: ({ unit: unit2, underworld, projectile, prediction }) => {
      if (unit2) {
        if (projectile.pushedObject.debugName === "pillar_proj") {
          takeDamage$3({
            unit: unit2,
            amount: 60,
            sourceUnit: projectile.sourceUnit,
            fromVec2: projectile.startPoint,
            thinBloodLine: true
          }, underworld, prediction);
        } else if (projectile.pushedObject.debugName && projectile.pushedObject.debugName.includes("Urn")) {
          const sourceUrn = allUnits$2[projectile.pushedObject.debugName];
          const urn = Unit$6.create(projectile.pushedObject.debugName, projectile.pushedObject.x, projectile.pushedObject.y, Faction$2.ALLY, "urn_ice", UnitType$2.AI, UnitSubType$2.DOODAD, sourceUrn.unitProps, underworld, prediction, projectile.sourceUnit);
          takeDamage$3({ unit: urn, amount: urn.health, sourceUnit: projectile.sourceUnit }, underworld, prediction);
          if (urn.health > 0) {
            takeDamage$3({ unit: urn, amount: urn.health }, underworld, prediction);
          }
        }
      }
    }
  }
};
const { commonTypes: commonTypes$8, Unit: Unit$5, cardsUtil } = globalThis.SpellmasonsAPI;
const { UnitSubType: UnitSubType$1 } = commonTypes$8;
const ALTAR_UNIT_ID = "Altar";
const unit$1 = {
  id: ALTAR_UNIT_ID,
  info: {
    description: "An intricate pylon raised by a geomancer that is very mana conducive. Spells cast will automatically target this unit.",
    image: "altar",
    subtype: UnitSubType$1.DOODAD
  },
  animations: {
    idle: "altar",
    hit: "altar",
    attack: "altar",
    die: "altarDeath",
    walk: "altar"
  },
  sfx: {
    damage: "unitDamage",
    death: "decoyDeath"
  },
  unitProps: {
    damage: 0,
    attackRange: 0,
    staminaMax: 0,
    healthMax: 10,
    manaMax: 0,
    // This is critical to a decoy, it prevents it from being pushed due to unit crowding
    immovable: true,
    radius: 48,
    bloodColor: 8082207
  },
  init: (unit2, underworld) => {
    Unit$5.addEvent(unit2, EVENT_REMOVE_ON_DEATH_ID);
    cardsUtil.getOrInitModifier(unit2, "Target Cursed", { isCurse: false, quantity: 1e4, keepOnDeath: false }, () => {
    });
    if (unit2.image) {
      unit2.image.sprite.anchor.y = 0.7;
    }
  },
  action: async (_self, _attackTargets, _underworld, _canAttackTarget) => {
  },
  getUnitAttackTargets: (unit2, underworld) => {
    return [];
  }
};
const EVENT_REMOVE_ON_DEATH_ID = "removeOnDeath";
const modifierRemoveOnDeath = {
  id: EVENT_REMOVE_ON_DEATH_ID,
  onDeath: async (unit2, underworld, prediction, sourceUnit) => {
    if (!prediction) {
      setTimeout(() => {
        Unit$5.cleanup(unit2, true);
      }, 1e3);
    }
  }
};
const {
  commonTypes: commonTypes$7,
  Unit: Unit$4,
  units: units$1,
  config: config$4,
  cards: cards$6,
  cardUtils: cardUtils$5,
  PlanningView: PlanningView$5,
  VisualEffects: VisualEffects$1,
  forcePushAwayFrom: forcePushAwayFrom$1
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$6, CardRarity: CardRarity$6, probabilityMap: probabilityMap$6, Faction: Faction$1, UnitType: UnitType$1 } = commonTypes$7;
const { takeDamage: takeDamage$2 } = Unit$4;
const { allUnits: allUnits$1 } = units$1;
const { skyBeam: skyBeam$1 } = VisualEffects$1;
const { refundLastSpell: refundLastSpell$1, getCurrentTargets: getCurrentTargets$4, defaultTargetsForAllowNonUnitTargetTargetingSpell: defaultTargetsForAllowNonUnitTargetTargetingSpell$2 } = cards$6;
const { playDefaultSpellSFX: playDefaultSpellSFX$5 } = cardUtils$5;
const { addWarningAtMouse: addWarningAtMouse$1, drawUICirclePrediction: drawUICirclePrediction$2 } = PlanningView$5;
const id$3 = "Raise Altar";
const spell$6 = {
  card: {
    id: id$3,
    category: CardCategory$6.Soul,
    sfx: "summonDecoy",
    supportQuantity: true,
    manaCost: 35,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap$6[CardRarity$6.COMMON],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconRaise_Altar.png",
    description: "Raise a mana conducive Altar at the target location, acting as a target for future spells cast",
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const unitId = ALTAR_UNIT_ID;
      const sourceUnit = allUnits$1[unitId];
      if (sourceUnit) {
        const summonLocation = {
          x: state.castLocation.x,
          y: state.castLocation.y
        };
        if (underworld.isCoordOnWallTile(summonLocation)) {
          if (prediction) {
            const WARNING = "Invalid Summon Location";
            addWarningAtMouse$1(WARNING);
          } else {
            refundLastSpell$1(state, prediction, "Invalid summon location, mana refunded.");
          }
          return state;
        }
        playDefaultSpellSFX$5(card, prediction);
        const unit2 = Unit$4.create(
          sourceUnit.id,
          summonLocation.x,
          summonLocation.y,
          Faction$1.ALLY,
          sourceUnit.info.image,
          UnitType$1.AI,
          sourceUnit.info.subtype,
          {
            ...sourceUnit.unitProps,
            healthMax: (sourceUnit.unitProps.healthMax || config$4.UNIT_BASE_HEALTH) * quantity,
            health: (sourceUnit.unitProps.health || config$4.UNIT_BASE_HEALTH) * quantity,
            damage: (sourceUnit.unitProps.damage || 0) * quantity,
            strength: quantity
          },
          underworld,
          prediction,
          state.casterUnit
        );
        if (prediction) {
          drawUICirclePrediction$2(unit2, 32, 16777215);
        }
        pillarExplode$1(unit2, 32, 10, underworld, prediction, state);
        if (!prediction) {
          skyBeam$1(unit2);
        }
      } else {
        console.error(`Source unit ${unitId} is missing`);
      }
      return state;
    }
  }
};
async function pillarExplode$1(caster2, radius, damage2, underworld, prediction, state) {
  const units2 = underworld.getUnitsWithinDistanceOfTarget(caster2, radius, prediction).filter((u) => u.id != caster2.id).filter((u) => u.unitSourceId != "pillar");
  units2.forEach((u) => {
    takeDamage$2({
      unit: u,
      amount: damage2,
      sourceUnit: caster2,
      fromVec2: caster2
    }, underworld, prediction);
  });
  units2.forEach((u) => {
    const pushDistance = 32;
    forcePushAwayFrom$1(u, state.casterUnit, pushDistance, underworld, prediction, caster2);
  });
  underworld.getPickupsWithinDistanceOfTarget(caster2, radius, prediction).forEach((p) => {
    const pushDistance = 32;
    forcePushAwayFrom$1(p, state.casterUnit, pushDistance, underworld, prediction, caster2);
  });
}
const {
  commonTypes: commonTypes$6,
  Unit: Unit$3,
  units,
  config: config$3,
  Vec: Vec$3,
  moveWithCollision: moveWithCollision$2,
  cards: cards$5,
  cardUtils: cardUtils$4,
  PlanningView: PlanningView$4,
  VisualEffects,
  forcePushAwayFrom
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$5, CardRarity: CardRarity$5, probabilityMap: probabilityMap$5, Faction, UnitType } = commonTypes$6;
const { takeDamage: takeDamage$1 } = Unit$3;
const { moveAlongVector: moveAlongVector$2, normalizedVector: normalizedVector$2 } = moveWithCollision$2;
const { invert: invert$2 } = Vec$3;
const { refundLastSpell, getCurrentTargets: getCurrentTargets$3 } = cards$5;
const { playDefaultSpellSFX: playDefaultSpellSFX$4 } = cardUtils$4;
const { addWarningAtMouse, drawUICirclePrediction: drawUICirclePrediction$1 } = PlanningView$4;
const { skyBeam } = VisualEffects;
const { allUnits } = units;
const id$2 = "Raise Wall";
const baseWidth$2 = 48;
const spell$5 = {
  card: {
    id: id$2,
    category: CardCategory$5.Soul,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$5[CardRarity$5.SPECIAL],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconRaise_Wall.png",
    requiresFollowingCard: false,
    description: "Raise a wall of pillars at the target location, blocking enemy movement but allowing projectiles through.",
    requires: [id$5],
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const unitId = "pillar";
      const sourceUnit = allUnits[unitId];
      const vector = normalizedVector$2(state.casterUnit, state.castLocation).vector;
      if (vector) {
        let spawnpoints = getSpawnPoints(state.castLocation, vector, baseWidth$2, quantity);
        const length = spawnpoints.length;
        if (length == 0) {
          spawnpoints.push(state.castLocation);
        }
        for (let i = 0; i < length; i++) {
          const target = spawnpoints[i];
          if (sourceUnit && target) {
            const summonLocation = {
              x: target.x,
              y: target.y
            };
            if (underworld.isCoordOnWallTile(summonLocation)) {
              if (prediction) {
                const WARNING = "Invalid Summon Location";
                addWarningAtMouse(WARNING);
              } else {
                refundLastSpell(state, prediction, "Invalid summon location, mana refunded.");
              }
              return state;
            }
            playDefaultSpellSFX$4(card, prediction);
            if (prediction) {
              drawUICirclePrediction$1(target, 32, 16777215);
            }
            const unit2 = Unit$3.create(
              sourceUnit.id,
              summonLocation.x,
              summonLocation.y,
              Faction.ALLY,
              sourceUnit.info.image,
              UnitType.AI,
              sourceUnit.info.subtype,
              {
                ...sourceUnit.unitProps,
                healthMax: sourceUnit.unitProps.healthMax || config$3.UNIT_BASE_HEALTH,
                health: sourceUnit.unitProps.health || config$3.UNIT_BASE_HEALTH,
                damage: (sourceUnit.unitProps.damage || 0) * quantity,
                strength: quantity
              },
              underworld,
              prediction,
              state.casterUnit
            );
            pillarExplode(unit2, 32, 10, underworld, prediction, state);
            if (!prediction) {
              skyBeam(unit2);
            }
          } else {
            console.error(`Source unit ${unitId} is missing`);
          }
        }
      }
      return state;
    }
  }
};
function getSpawnPoints(castLocation, vector, width, quantity) {
  let points = [];
  points.push(castLocation);
  const p1 = moveAlongVector$2(castLocation, invert$2(vector), -width);
  const p2 = moveAlongVector$2(castLocation, invert$2(vector), width);
  points.push(p1);
  points.push(p2);
  if (quantity > 1) {
    for (let i = 2; i <= quantity; i++) {
      const p3 = moveAlongVector$2(castLocation, invert$2(vector), -width * i);
      const p4 = moveAlongVector$2(castLocation, invert$2(vector), width * i);
      points.push(p3);
      points.push(p4);
    }
  }
  return points;
}
async function pillarExplode(caster2, radius, damage2, underworld, prediction, state) {
  const units2 = underworld.getUnitsWithinDistanceOfTarget(caster2, radius, prediction).filter((u) => u.id != caster2.id).filter((u) => u.unitSourceId != "pillar");
  units2.forEach((u) => {
    takeDamage$1({
      unit: u,
      amount: damage2,
      sourceUnit: caster2,
      fromVec2: caster2
    }, underworld, prediction);
  });
  units2.forEach((u) => {
    const pushDistance = 32;
    forcePushAwayFrom(u, state.casterUnit, pushDistance, underworld, prediction, caster2);
  });
  underworld.getPickupsWithinDistanceOfTarget(caster2, radius, prediction).forEach((p) => {
    const pushDistance = 32;
    forcePushAwayFrom(p, state.casterUnit, pushDistance, underworld, prediction, caster2);
  });
}
const {
  commonTypes: commonTypes$5,
  Unit: Unit$2,
  config: config$2,
  math: math$2,
  Vec: Vec$2,
  JPromise: JPromise$2,
  JAudio: JAudio$3,
  Easing: Easing$2,
  cardUtils: cardUtils$3,
  Angle,
  PlanningView: PlanningView$3,
  EffectsHeal,
  cards: cards$4
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$4, CardRarity: CardRarity$4, probabilityMap: probabilityMap$4 } = commonTypes$5;
const { distance: distance$1, sortCosestTo: sortCosestTo$1 } = math$2;
const { getAngleBetweenVec2s } = Vec$2;
const { healUnits } = EffectsHeal;
const { drawUICone, drawUIConePrediction } = PlanningView$3;
const { isAngleBetweenAngles } = Angle;
const { playDefaultSpellSFX: playDefaultSpellSFX$3 } = cardUtils$3;
const { getCurrentTargets: getCurrentTargets$2, defaultTargetsForAllowNonUnitTargetTargetingSpell: defaultTargetsForAllowNonUnitTargetTargetingSpell$1, addTarget: addTarget$2 } = cards$4;
const bloodCurseCardId = "Blood Curse";
const sunlightId = "Sunlight";
const range$2 = 200;
const coneAngle = Math.PI / 4;
const healAmount = 20;
const spell$4 = {
  card: {
    id: sunlightId,
    category: CardCategory$4.Blessings,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$4[CardRarity$4.SPECIAL],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconSunlight.png",
    requiresFollowingCard: false,
    description: "Heals 20 health to units in a cone originating from the caster. Deals 80 damage to blood cursed units.",
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRadiusBoost = quantity - 1 + state.aggregator.radiusBoost;
      const depth = range$2 * (1 + 0.25 * adjustedRadiusBoost);
      const adjustedAngle = coneAngle * Math.pow(2, Math.min(quantity, 4)) / 2;
      const projectAngle = getAngleBetweenVec2s(state.casterUnit, state.castLocation);
      const startAngle = projectAngle + adjustedAngle / 2;
      const endAngle = projectAngle - adjustedAngle / 2;
      const target = state.casterUnit;
      const animatedCones = [];
      state.casterUnit;
      if (prediction) {
        drawUIConePrediction(target, depth, startAngle, endAngle, 16777215);
      } else {
        animatedCones.push({ origin: state.casterUnit, coneStartPoint: target, radius: depth, startAngle, endAngle });
      }
      let withinRadiusAndAngle = [];
      underworld.getPotentialTargets(
        prediction
      ).filter((t) => Unit$2.isUnit(t)).filter((t) => {
        return withinCone(state.casterUnit, target, depth, startAngle, endAngle, t);
      }).filter((e) => e !== state.casterUnit).forEach((u) => {
        if (Unit$2.isUnit(u))
          withinRadiusAndAngle.push(u);
      });
      withinRadiusAndAngle.sort(sortCosestTo$1(target));
      withinRadiusAndAngle.forEach((e) => addTarget$2(e, state, underworld, prediction));
      playDefaultSpellSFX$3(card, prediction);
      const bloodCursedUnits = withinRadiusAndAngle.filter((e) => e.modifiers[bloodCurseCardId]);
      await healUnits(bloodCursedUnits, healAmount * 3 * quantity, state.casterUnit, underworld, prediction, state);
      await healUnits(withinRadiusAndAngle, healAmount * quantity, state.casterUnit, underworld, prediction, state);
      return state;
    }
  }
};
function withinCone(origin, coneStartPoint, radius, startAngle, endAngle, target) {
  const targetAngle = getAngleBetweenVec2s(coneStartPoint, target);
  const distanceToConeStart = distance$1(target, coneStartPoint);
  return distanceToConeStart <= radius && (isAngleBetweenAngles(targetAngle, startAngle, endAngle) || Math.abs(endAngle - startAngle) >= 2 * Math.PI);
}
const {
  Unit: Unit$1,
  commonTypes: commonTypes$4,
  cards: cards$3,
  math: math$1
} = globalThis.SpellmasonsAPI;
const { isUnit } = Unit$1;
const { CardCategory: CardCategory$3, CardRarity: CardRarity$3, probabilityMap: probabilityMap$3 } = commonTypes$4;
const { getCurrentTargets: getCurrentTargets$1, addTarget: addTarget$1 } = cards$3;
const { sortCosestTo } = math$1;
const id$1 = "Target Pillar";
const spell$3 = {
  card: {
    id: id$1,
    category: CardCategory$3.Targeting,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$3[CardRarity$3.SPECIAL],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconTargetPillar.png",
    requiresFollowingCard: true,
    requires: [id$5],
    ignoreRange: true,
    description: "Adds 5 of the closest pillars per stack as targets for subsequent spells.",
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      let targets = getCurrentTargets$1(state);
      const pillarsPerStack = 5;
      targets = targets.length ? targets : [state.castLocation];
      const potentialTargets = underworld.getPotentialTargets(prediction).filter((t) => isUnit(t) && t.unitSourceId === "pillar").sort(sortCosestTo(state.casterUnit)).slice(0, pillarsPerStack * quantity);
      const newTargets = potentialTargets;
      for (let newTarget of newTargets) {
        addTarget$1(newTarget, state, underworld, prediction);
      }
      return state;
    }
  }
};
const {
  commonTypes: commonTypes$3,
  math,
  colors,
  forcePushTowards,
  cardUtils: cardUtils$2,
  cards: cards$2,
  Unit,
  JAudio: JAudio$2,
  PlanningView: PlanningView$2,
  ParticleCollection,
  Particles
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$2, CardRarity: CardRarity$2, probabilityMap: probabilityMap$2 } = commonTypes$3;
const { distance } = math;
const { playDefaultSpellSFX: playDefaultSpellSFX$2 } = cardUtils$2;
const { addTarget } = cards$2;
const { takeDamage } = Unit;
const { playSFXKey: playSFXKey$2 } = JAudio$2;
const { drawUICirclePrediction } = PlanningView$2;
const { makeParticleExplosion } = ParticleCollection;
const { createParticleTexture, logNoTextureWarning } = Particles;
const targetStompCardId = "Target Stomp";
const baseExplosionRadius = 140;
const stompMoveDistance = 100;
const stompRadius = 115;
const spell$2 = {
  card: {
    id: targetStompCardId,
    category: CardCategory$2.Targeting,
    supportQuantity: true,
    allowNonUnitTarget: true,
    ignoreRange: true,
    sfx: "stomp",
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$2[CardRarity$2.RARE],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconTargetStomp.png",
    description: "Jump to a location and stomp, pulling enemies towards you and adds them as a target to subsequent spells.",
    effect: async (state, card, quantity, underworld, prediction) => {
      const target = state.castLocation;
      if (target) {
        if (!prediction && !globalThis.headless) {
          const delayBeforeDash = 500;
          playDefaultSpellSFX$2(card, prediction);
          makeStompWindupParticles(state.casterUnit, prediction);
          await new Promise((resolve) => setTimeout(resolve, delayBeforeDash));
        }
        const moveDistance = Math.min(distance(state.casterUnit, target), stompMoveDistance * quantity);
        await forcePushTowards(state.casterUnit, target, moveDistance, underworld, prediction, state.casterUnit);
        const radius = stompRadius * (1 + 0.25 * state.aggregator.radiusBoost);
        if (prediction) {
          drawUICirclePrediction(state.casterUnit, radius, colors.errorRed, "Stomp Radius");
        } else if (!globalThis.headless) {
          makeStompExplodeParticles2(state.casterUnit, radius, true, prediction);
          playSFXKey$2("bloatExplosion");
        }
        targetStompExplode(state.casterUnit, radius, 0, stompRadius, underworld, prediction, state);
      }
      return state;
    }
  }
};
async function targetStompExplode(caster2, radius, damage2, pushDistance, underworld, prediction, state) {
  const units2 = underworld.getUnitsWithinDistanceOfTarget(caster2, radius, prediction).filter((u) => u.id != caster2.id);
  units2.forEach((u) => {
    takeDamage({
      unit: u,
      amount: damage2,
      sourceUnit: caster2,
      fromVec2: caster2
    }, underworld, prediction);
  });
  units2.forEach((u) => {
    forcePushTowards(u, caster2, pushDistance, underworld, prediction, caster2);
  });
  units2.forEach((u) => {
    addTarget(u, state, underworld, prediction);
  });
  underworld.getPickupsWithinDistanceOfTarget(caster2, radius, prediction).forEach((p) => {
    forcePushTowards(p, caster2, pushDistance, underworld, prediction, caster2);
  });
}
function makeStompExplodeParticles2(position, radius, big, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const explosionSize = radius / baseExplosionRadius * (big ? 1 : 0.7);
  makeParticleExplosion(position, explosionSize, colors.trueGrey, colors.trueWhite, prediction);
}
function makeStompWindupParticles(position, prediction) {
  if (prediction || globalThis.headless) {
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning("makeStompParticleWindup");
    return;
  }
}
const {
  commonTypes: commonTypes$2,
  config: config$1,
  Vec: Vec$1,
  JPromise: JPromise$1,
  JAudio: JAudio$1,
  Polygon2: Polygon2$1,
  Easing: Easing$1,
  cardUtils: cardUtils$1,
  cards: cards$1,
  moveWithCollision: moveWithCollision$1,
  forcePushToDestination: forcePushToDestination$1,
  PlanningView: PlanningView$1
} = globalThis.SpellmasonsAPI;
const { CardCategory: CardCategory$1, CardRarity: CardRarity$1, probabilityMap: probabilityMap$1 } = commonTypes$2;
const { raceTimeout: raceTimeout$1 } = JPromise$1;
const { playDefaultSpellSFX: playDefaultSpellSFX$1 } = cardUtils$1;
const { easeOutCubic: easeOutCubic$1 } = Easing$1;
const { playSFXKey: playSFXKey$1 } = JAudio$1;
const { invert: invert$1 } = Vec$1;
const { moveAlongVector: moveAlongVector$1, normalizedVector: normalizedVector$1 } = moveWithCollision$1;
const { drawUIPolyPrediction: drawUIPolyPrediction$1 } = PlanningView$1;
const { isVec2InsidePolygon: isVec2InsidePolygon$1 } = Polygon2$1;
const windTunnelId = "Wind Tunnel";
const defaultPushDistance$1 = 140;
const range$1 = 250;
const baseWidth$1 = 20;
const timeoutMsAnimation$1 = 2e3;
const spell$1 = {
  card: {
    id: windTunnelId,
    category: CardCategory$1.Movement,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap$1[CardRarity$1.SPECIAL],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconWind_Tunnel.png",
    requiresFollowingCard: false,
    description: "Pushes targets in a column away from the caster.",
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRadiusBoost = quantity - 1 + state.aggregator.radiusBoost;
      const depth = range$1 * (1 + 0.5 * adjustedRadiusBoost);
      const width = baseWidth$1 * Math.pow(2, Math.min(quantity, 4)) / 2;
      const vector = normalizedVector$1(state.casterUnit, state.castLocation).vector || { x: 0, y: 0 };
      const animateColumns = [];
      const location = state.casterUnit;
      const targetingColumn = getColumnPoints$1(location, vector, width, depth);
      if (prediction) {
        drawUIPolyPrediction$1(targetingColumn, 16777215);
      } else {
        animateColumns.push({ castLocation: location, vector, width, depth });
      }
      const withinColumn = underworld.getPotentialTargets(
        prediction
      ).filter((t) => {
        return isVec2InsidePolygon$1(t, targetingColumn);
      });
      if (!prediction) {
        await animate$1(animateColumns, underworld, prediction);
      }
      let promises = [];
      playDefaultSpellSFX$1(card, prediction);
      for (let entity of withinColumn) {
        if (entity != state.casterUnit) {
          promises.push(forcePushToDestination$1(entity, moveAlongVector$1(entity, vector, defaultPushDistance$1 * quantity), 1 + adjustedRadiusBoost, underworld, prediction, state.casterUnit));
        }
      }
      await Promise.all(promises);
      return state;
    }
  }
};
function getColumnPoints$1(castLocation, vector, width, depth) {
  const p1 = moveAlongVector$1(castLocation, invert$1(vector), -width);
  const p2 = moveAlongVector$1(castLocation, invert$1(vector), width);
  const p3 = moveAlongVector$1(p2, vector, depth);
  const p4 = moveAlongVector$1(p1, vector, depth);
  return [p1, p2, p3, p4];
}
async function animate$1(columns, underworld, prediction) {
  if (globalThis.headless || prediction) {
    return Promise.resolve();
  }
  if (columns.length == 0) {
    return Promise.resolve();
  }
  const entitiesTargeted = [];
  playSFXKey$1("targeting");
  return raceTimeout$1(timeoutMsAnimation$1, "animatedExpand", new Promise((resolve) => {
    animateFrame$1(columns, Date.now(), entitiesTargeted, underworld, resolve)();
  })).then(() => {
    var _a;
    (_a = globalThis.predictionGraphicsGreen) == null ? void 0 : _a.clear();
  });
}
const millisToGrow$1 = 1e3;
function animateFrame$1(columns, startTime, entitiesTargeted, underworld, resolve) {
  return function animateFrameInner() {
    if (globalThis.predictionGraphicsGreen) {
      globalThis.predictionGraphicsGreen.clear();
      const now = Date.now();
      const timeDiff = now - startTime;
      for (let column of columns) {
        const { castLocation, vector, width, depth } = column;
        const animatedDepth = depth * easeOutCubic$1(Math.min(1, timeDiff / millisToGrow$1));
        const targetingColumn = getColumnPoints$1(castLocation, vector, width, animatedDepth);
        globalThis.predictionGraphicsGreen.lineStyle(2, 16777215, 1);
        globalThis.predictionGraphicsGreen.drawPolygon(targetingColumn);
        const withinColumn = underworld.getPotentialTargets(
          false
        ).filter((t) => {
          return isVec2InsidePolygon$1(t, targetingColumn);
        });
        withinColumn.forEach((v) => {
          var _a;
          if (!entitiesTargeted.includes(v)) {
            entitiesTargeted.push(v);
            playSFXKey$1("targetAquired");
          }
          (_a = globalThis.predictionGraphicsGreen) == null ? void 0 : _a.drawCircle(v.x, v.y, config$1.COLLISION_MESH_RADIUS);
        });
      }
      if (timeDiff > millisToGrow$1) {
        resolve();
        return;
      } else {
        requestAnimationFrame(animateFrame$1(columns, startTime, entitiesTargeted, underworld, resolve));
      }
    } else {
      resolve();
    }
  };
}
const {
  commonTypes: commonTypes$1,
  config,
  Vec,
  JPromise,
  JAudio,
  Polygon2,
  Easing,
  cardUtils,
  cards,
  moveWithCollision,
  forcePushToDestination,
  PlanningView
} = globalThis.SpellmasonsAPI;
const { CardCategory, CardRarity, probabilityMap } = commonTypes$1;
const { raceTimeout } = JPromise;
const { playDefaultSpellSFX } = cardUtils;
const { easeOutCubic } = Easing;
const { getCurrentTargets, defaultTargetsForAllowNonUnitTargetTargetingSpell } = cards;
const { playSFXKey } = JAudio;
const { invert } = Vec;
const { moveAlongVector, normalizedVector } = moveWithCollision;
const { drawUIPolyPrediction } = PlanningView;
const { isVec2InsidePolygon } = Polygon2;
const id = "Wind Explosion";
const defaultPushDistance = 140;
const range = 250;
const baseWidth = 20;
const timeoutMsAnimation = 2e3;
const spell = {
  card: {
    id,
    category: CardCategory.Movement,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 1,
    requires: [windTunnelId],
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: "spellmasons-mods/The_Doom_Scroll/graphics/spellIconWind_Explosion.png",
    requiresFollowingCard: false,
    description: "Creates a wind tunnel pointing at each target.",
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const adjustedRadiusBoost = quantity - 1 + state.aggregator.radiusBoost;
      const depth = range * (1 + 0.5 * adjustedRadiusBoost);
      const width = baseWidth * Math.pow(2, Math.min(quantity, 4)) / 2;
      const targets = getCurrentTargets(state);
      const animateColumns = [];
      let promises = [];
      for (let target of targets) {
        if (!target) {
          continue;
        }
        const normVec = normalizedVector(state.casterUnit, target).vector;
        if (!normVec)
          continue;
        const vector = normVec;
        const targetingColumn = getColumnPoints(state.casterUnit, vector, width, depth);
        if (prediction) {
          drawUIPolyPrediction(targetingColumn, 16777215);
        } else {
          animateColumns.push({ castLocation: target, vector, width, depth });
        }
        const withinColumn = underworld.getPotentialTargets(
          prediction
        ).filter((t) => {
          return isVec2InsidePolygon(t, targetingColumn);
        });
        playDefaultSpellSFX(card, prediction);
        for (let entity of withinColumn) {
          if (entity != state.casterUnit) {
            promises.push(forcePushToDestination(entity, moveAlongVector(entity, vector, defaultPushDistance * quantity), 1 + adjustedRadiusBoost, underworld, prediction, state.casterUnit));
          }
        }
      }
      if (!prediction) {
        await animate(animateColumns, underworld, prediction);
      }
      await Promise.all(promises);
      return state;
    }
  }
};
function getColumnPoints(castLocation, vector, width, depth) {
  const p1 = moveAlongVector(castLocation, invert(vector), -width);
  const p2 = moveAlongVector(castLocation, invert(vector), width);
  const p3 = moveAlongVector(p2, vector, depth);
  const p4 = moveAlongVector(p1, vector, depth);
  return [p1, p2, p3, p4];
}
async function animate(columns, underworld, prediction) {
  if (globalThis.headless || prediction) {
    return Promise.resolve();
  }
  if (columns.length == 0) {
    return Promise.resolve();
  }
  const entitiesTargeted = [];
  playSFXKey("targeting");
  return raceTimeout(timeoutMsAnimation, "animatedExpand", new Promise((resolve) => {
    animateFrame(columns, Date.now(), entitiesTargeted, underworld, resolve)();
  })).then(() => {
    var _a;
    (_a = globalThis.predictionGraphicsGreen) == null ? void 0 : _a.clear();
  });
}
const millisToGrow = 1e3;
function animateFrame(columns, startTime, entitiesTargeted, underworld, resolve) {
  return function animateFrameInner() {
    if (globalThis.predictionGraphicsGreen) {
      globalThis.predictionGraphicsGreen.clear();
      const now = Date.now();
      const timeDiff = now - startTime;
      for (let column of columns) {
        const { castLocation, vector, width, depth } = column;
        const animatedDepth = depth * easeOutCubic(Math.min(1, timeDiff / millisToGrow));
        const targetingColumn = getColumnPoints(castLocation, vector, width, animatedDepth);
        globalThis.predictionGraphicsGreen.lineStyle(2, 16777215, 1);
        globalThis.predictionGraphicsGreen.drawPolygon(targetingColumn);
        const withinColumn = underworld.getPotentialTargets(
          false
        ).filter((t) => {
          return isVec2InsidePolygon(t, targetingColumn);
        });
        withinColumn.forEach((v) => {
          var _a;
          if (!entitiesTargeted.includes(v)) {
            entitiesTargeted.push(v);
            playSFXKey("targetAquired");
          }
          (_a = globalThis.predictionGraphicsGreen) == null ? void 0 : _a.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
        });
      }
      if (timeDiff > millisToGrow) {
        resolve();
        return;
      } else {
        requestAnimationFrame(animateFrame(columns, startTime, entitiesTargeted, underworld, resolve));
      }
    } else {
      resolve();
    }
  };
}
const { commonTypes } = globalThis.SpellmasonsAPI;
const { UnitSubType } = commonTypes;
const unit = {
  id: "pillar",
  info: {
    description: "An earthen pillar raised by a geomancer that blocks the path of enemies. Will not block projectiles.",
    image: "pillar",
    subtype: UnitSubType.DOODAD
  },
  animations: {
    idle: "pillar",
    hit: "pillar",
    attack: "pillar",
    die: "pillarDeath",
    walk: "pillar"
  },
  sfx: {
    damage: "unitDamage",
    death: "decoyDeath"
  },
  unitProps: {
    damage: 0,
    attackRange: 0,
    staminaMax: 0,
    healthMax: 150,
    manaMax: 0,
    // This is critical to a decoy, it prevents it from being pushed due to unit crowding
    immovable: true,
    radius: 48,
    bloodColor: 8082207
  },
  init: (unit2, underworld) => {
    if (unit2.image) {
      unit2.image.sprite.anchor.y = 0.7;
    }
  },
  action: async (_self, _attackTargets, _underworld, _canAttackTarget) => {
  },
  getUnitAttackTargets: (unit2, underworld) => {
    return [];
  }
};
const mod = {
  modName: "The Doom Scroll",
  author: "Bug Jones, Dorioso Aytario",
  description: "Adds a variety of interesting new cards to support existing builds as well as introducing a new build.",
  screenshot: "spellmasons-mods/The_Doom_Scroll/graphics/Doom_Scroll.png",
  spells: [
    spell$c,
    spell$b,
    spell$9,
    spell$7,
    spell$8,
    spell$6,
    spell$5,
    spell$4,
    spell$3,
    spell$2,
    spell,
    spell$1,
    spell$a
  ],
  units: [
    unit,
    unit$1
  ],
  events: [modifierRemoveOnDeath],
  spritesheet: "spellmasons-mods/The_Doom_Scroll/graphics/spritesheet.json",
  maps: []
};
const mods = [
  mod$5,
  mod$4,
  mod$3,
  mod$2,
  mod$1,
  mod
];
globalThis.mods = globalThis.mods !== void 0 ? [...globalThis.mods, ...mods] : mods;
console.log("Mods: Add mods", globalThis.mods);
