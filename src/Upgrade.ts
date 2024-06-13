import seedrandom from 'seedrandom';
import * as config from './config';
import * as storage from "./storage";
import { calculateCostForSingleCard, type CardCost } from './cards/cardUtils';
import { cardRarityAsString, getCardRarityColor, getReplacesCardText, getSpellThumbnailPath } from './graphics/ui/CardUI';
import { chooseObjectWithProbability } from './jmath/rand';
import { MESSAGE_TYPES } from './types/MessageTypes';
import { IPlayer, MageType, changeMageType } from './entity/Player';
import Underworld from './Underworld';
import { CardCategory, CardRarity, probabilityMap } from './types/commonTypes';
import { poisonCardId } from './cards/poison';
import { bleedCardId } from './cards/bleed';
import { drownCardId } from './cards/drown';
import { suffocateCardId } from './cards/suffocate';
import { isModActive } from './registerMod';
import { allCards, getCardsFromIds } from './cards';
import { boneShrapnelCardId } from './cards/bone_shrapnel';
import { executeCardId } from './cards/execute';
export interface IUpgrade {
  title: string;
  // Replaces previous upgrades.  They are required for this upgrade to present itself
  replaces?: string[];
  // Requires previous upgrades.  They are required for this upgrade to present itself
  requires?: string[];
  // If a upgrade belongs to a mod, it's modName will be automatically assigned
  // This is used to dictate wether or not the modded upgrade is used
  modName?: string;
  type: 'card' | 'special' | 'mageType';
  cardCategory?: CardCategory;
  description: (player: IPlayer) => string;
  thumbnail: string;
  // The maximum number of copies a player can have of this upgrade
  maxCopies?: number;
  // note: effect shouldn't be called directly, use Underworld.chooseUpgrade instead so
  // it will keep track of how many upgrades the player has left to choose
  effect: (player: IPlayer, underworld: Underworld) => void;
  // The probability of getting this as an upgrade
  probability: number;
  cost: CardCost;
}
export function isPickingClass(player: IPlayer): boolean {
  // undefined mageType means they haven't picked yet
  return (player.upgrades.length >= 5 && player.mageType == undefined || !!globalThis.adminPickMageType);
}
// Chooses a random card based on the card's probabilities
// minimumProbability ensures that super rare cards won't be presented too early on
export function generateUpgrades(player: IPlayer, numberOfUpgrades: number, minimumProbability: number, underworld: Underworld): IUpgrade[] {
  let upgrades: IUpgrade[] = [];
  const filterUpgrades = (u: IUpgrade) => (
    // Exclude upgrades whose requirements have not been met
    (u.requires ? u.requires.every(title => player.upgrades.find(u => u == title)) : true)
    // Exclude upgrades that the player can't have more of
    && (u.maxCopies ? player.upgrades.filter((pu) => pu === u.title).length < u.maxCopies : true)
    // Exclude card upgrades already obtained by the player (Can this be done with max copies?)
    && !player.inventory.includes(u.title)
    // Exclude upgrades considered too rare for this generated set
    && u.probability >= minimumProbability
    // Exclude upgrades with a probability of 0 or less
    && u.probability > 0
    // Exclude modded upgrades where the mod is not active
    && isModActive(u, underworld)
  );

  let filteredUpgradeCardsSource = upgradeCardsSource.filter(filterUpgrades);
  let upgradeList = filteredUpgradeCardsSource;

  // The player is guaranteed a damage spell in the first level to prevent a softlock
  // For third pick, override upgradeList with damage spells
  if (player.upgrades.length == 2) {
    // Upgrade list is filtered down to damage spells only
    upgradeList = upgradeList.filter(c => (
      // Any card in the damage category is acceptable, unless dependent on special conditions
      ![bleedCardId, drownCardId, boneShrapnelCardId, executeCardId].includes(c.title) && c.cardCategory == CardCategory.Damage)
      // Poison is acceptable here, even though it is a curse
      || [poisonCardId].includes(c.title)
    );
  }
  if (isPickingClass(player)) {
    return upgradeMageClassSource;
  }

  // Upgrade random generate should be unique for the:
  // underworld seed, each player, the number of rerolls they have, the number of cards they have
  // This prevents save scamming and makes sure each time you are presented with cards it is unique.
  // Note: Only count non-empty card spaces in player inventory
  const rSeed = `${underworld.seed}-${player.playerId}-${player.reroll}-${player.inventory.filter(x => !!x).length}`;
  const random = seedrandom(rSeed);

  // Returns all upgrades that would be omitted
  // This filter function lets us softly omit upgrades.
  // Softly omitted upgrades will only appear if no other options are available
  // This is used to prevent rerolled cards from appearing again unless they are all that's left to show
  const filterUpgradesSoft = (u: IUpgrade) => (
    !globalThis.rerollOmit?.includes(u.title)
  );

  // Clone upgrades for later mutation
  let clonedUpgradeList = [...upgradeList];
  // Store all softly omitted upgrades for later
  const omittedUpgrades = clonedUpgradeList.filter(u => !filterUpgradesSoft(u));
  // Remove omittedUpgrades from clonedUpgradeList
  clonedUpgradeList = clonedUpgradeList.filter(u => !omittedUpgrades.includes(u));
  // Limited by desired numberOfUpgrades or upgrades left, whichever is less
  const numberOfCardsToChoose = Math.min(numberOfUpgrades, clonedUpgradeList.length + omittedUpgrades.length);

  for (let i = 0; i < numberOfCardsToChoose; i++) {
    // If upgradeList is empty, restore softly omitted upgrades
    if (clonedUpgradeList.length == 0 && omittedUpgrades.length > 0) {
      clonedUpgradeList = clonedUpgradeList.concat(omittedUpgrades);
      console.log("Restored softly omitted upgrades", omittedUpgrades);
    }

    const upgrade = chooseObjectWithProbability(clonedUpgradeList, random);
    if (upgrade) {
      const index = clonedUpgradeList.indexOf(upgrade);
      upgrades = upgrades.concat(clonedUpgradeList.splice(index, 1));
    } else {
      console.log('No upgrades to choose from', clonedUpgradeList);
    }
  }
  globalThis.rerollOmit = globalThis.rerollOmit?.concat(upgrades.map(u => u.title));
  return upgrades;
}

export function createUpgradeElement(upgrade: IUpgrade, player: IPlayer, underworld: Underworld) {
  if (globalThis.headless) {
    // There is no DOM in headless mode
    return;
  }
  const { pie } = underworld;
  const element = document.createElement('div');
  // mageType upgrades are smaller so more can fit on screen
  if (upgrade.type == 'mageType') {
    element.classList.add('tiny');
  }
  element.classList.add('card', 'upgrade');
  element.classList.add(cardRarityAsString(upgrade));
  element.dataset.upgrade = upgrade.title;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(upgrade);
  element.appendChild(elCardInner);
  // Card costs
  const elCardBadgeHolder = document.createElement('div');
  elCardBadgeHolder.classList.add('card-badge-holder');
  element.appendChild(elCardBadgeHolder);

  // Override cost due to mageType
  const card = allCards[upgrade.title];
  if (card) {
    upgrade.cost = calculateCostForSingleCard(card, 0, player);
  }

  if (upgrade.cost.manaCost) {
    const elCardManaBadge = document.createElement('div');
    elCardManaBadge.classList.add('card-mana-badge', 'card-badge');
    elCardManaBadge.innerHTML = upgrade.cost.manaCost.toString();
    elCardBadgeHolder.appendChild(elCardManaBadge);
  }
  if (upgrade.cost.healthCost) {
    const elCardHealthBadge = document.createElement('div');
    elCardHealthBadge.classList.add('card-health-badge', 'card-badge');
    elCardHealthBadge.innerHTML = upgrade.cost.healthCost.toString();
    elCardBadgeHolder.appendChild(elCardHealthBadge);
  }

  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = upgrade.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('h2');
  title.classList.add('card-title');
  title.innerText = i18n(upgrade.title);
  elCardInner.appendChild(title);
  if (upgrade.type === 'card') {
    const rarityText = document.createElement('div');
    rarityText.classList.add('card-rarity')
    rarityText.style.color = getCardRarityColor(upgrade);
    rarityText.innerHTML = globalThis.i18n(cardRarityAsString(upgrade).toLocaleLowerCase());
    elCardInner.appendChild(rarityText);
  }

  const desc = document.createElement('div');
  desc.classList.add('card-description');
  const descriptionText = document.createElement('div');
  if (upgrade.replaces || upgrade.requires) {
    const replacesEl = getReplacesCardText(upgrade.replaces || [], upgrade.requires || []);
    descriptionText.appendChild(replacesEl)
  }
  const label = document.createElement('span');
  label.innerText = upgrade.description(player).trimStart();
  descriptionText.appendChild(label);
  desc.appendChild(descriptionText);

  if (upgrade.type == 'mageType') {
    const mageTypeWinsKey = storage.getStoredMageTypeWinsKey(upgrade.title as MageType);
    const currentMageTypeWins = parseInt(storageGet(mageTypeWinsKey) || '0');
    const mageTypeFarthestLevel = storage.getStoredMageTypeFarthestLevelKey(upgrade.title as MageType);
    const currentMageTypeFarthestLevel = underworld._getLevelText(parseInt(storageGet(mageTypeFarthestLevel) || '0'));
    // winsEl.innerHTML = `👑${currentMageTypeWins}`;
    if (currentMageTypeWins > 0 || currentMageTypeFarthestLevel !== '1') {
      const winsEl = document.createElement('div');
      winsEl.classList.add('mageType-wins');
      winsEl.innerHTML = `${currentMageTypeWins > 0 ? `🏆${currentMageTypeWins} ` : ''}${currentMageTypeFarthestLevel !== '1' ? `🗺️${currentMageTypeFarthestLevel}` : ''}`;
      element.appendChild(winsEl);
    }
  }

  elCardInner.appendChild(desc);
  element.addEventListener('click', (e) => {
    globalThis.timeLastChoseUpgrade = Date.now();
    // Prevent click from "falling through" upgrade and propagating to vote for overworld level
    e.stopPropagation();
    if (globalThis.remoteLog && player.reroll == 0) {
      // Collect statistics on first-choice upgrades
      // This is to ensure that the upgrade was chosen because it's desired,
      // not as a last resort
      globalThis.remoteLog(`Upgrade ${upgrade.type}: ${upgrade.title}`);
    }
    pie.sendData({
      type: MESSAGE_TYPES.CHOOSE_UPGRADE,
      upgrade,
    });
  });
  element.addEventListener('mouseenter', (e) => {
    playSFXKey('click');
  });
  return element;
}
export function getUpgradeByTitle(title: string): IUpgrade | undefined {
  const all_upgrades = [...upgradeCardsSource, ...upgradeSourceWhenDead, ...upgradeMageClassSource];
  if (all_upgrades.filter(u => u.title == title).length > 1) {
    console.error('Multiple upgrades with the same title', title);
  }
  return all_upgrades.find((u) => u.title === title);
}
export const upgradeSourceWhenDead: IUpgrade[] = [
  {
    title: 'Resurrect',
    type: 'special',
    description: () => 'Resurrects you so the adventure can continue!',
    // TODO needs new icon
    thumbnail: 'images/spell/resurrect.png',
    // Resurrection happens automatically at the start of each level
    effect: () => { },
    probability: 30,
    cost: { healthCost: 0, manaCost: 0 },
  },
];

export const upgradeCardsSource: IUpgrade[] = []

export const upgradeMageClassSource: IUpgrade[] = [
  {
    // This upgrade has leading and trailing spaces so it doesn't conflict with the upgrade
    // for summoning a spellmason
    title: ' Spellmason ',
    type: 'mageType',
    description: () => i18n('class_spellmason'),
    thumbnail: 'images/upgrades/class-spellmason.png',
    effect: (player, underworld) => {
      changeMageType('Spellmason', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: 'Timemason',
    type: 'mageType',
    description: () => i18n(['class_timemason', `${config.TIMEMASON_PERCENT_DRAIN}%`]),
    thumbnail: 'images/upgrades/class-timemason.png',
    effect: (player, underworld) => {
      changeMageType('Timemason', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  // {
  //   title: 'Bloodmason',
  //   type: 'mageType',
  //   description: () => i18n('class_bloodmason'),
  //   thumbnail: 'images/upgrades/class-bloodmason.png',
  //   effect: (player, underworld) => {
  //     changeMageType('Bloodmason', player, underworld);
  //   },
  //   probability: 1,
  //   cost: { healthCost: 0, manaCost: 0 },
  // },
  {
    title: i18n('Necromancer'),
    type: 'mageType',
    description: () => i18n('class_necromancer'),
    thumbnail: 'images/upgrades/class-necromancer.png',
    effect: (player, underworld) => {
      changeMageType('Necromancer', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: i18n('Archer'),
    type: 'mageType',
    description: () => i18n('class_archer'),
    thumbnail: 'images/upgrades/class-archer.png',
    effect: (player, underworld) => {
      changeMageType('Archer', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: 'Far Gazer',
    type: 'mageType',
    description: () => i18n('class_far_gazer'),
    thumbnail: 'images/upgrades/class-sniper.png',
    effect: (player, underworld) => {
      changeMageType('Far Gazer', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: i18n('Cleric'),
    type: 'mageType',
    description: () => i18n('class_cleric'),
    thumbnail: 'images/upgrades/class-cleric.png',
    effect: (player, underworld) => {
      changeMageType('Cleric', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: i18n('Witch'),
    type: 'mageType',
    description: () => i18n('class_witch'),
    thumbnail: 'images/upgrades/class-witch.png',
    effect: (player, underworld) => {
      changeMageType('Witch', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: i18n('Gambler'),
    type: 'mageType',
    description: () => i18n('class_gambler'),
    thumbnail: 'images/upgrades/class-gambler.png',
    effect: (player, underworld) => {
      changeMageType('Gambler', player, underworld);
    },
    probability: 1,
    cost: { healthCost: 0, manaCost: 0 },
  },

]
