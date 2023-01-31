import { chooseObjectWithProbability, chooseOneOf, randFloat } from "./jmath/rand";
import * as Unit from './entity/Unit';
import Underworld, { showUpgradesClassName } from "./Underworld";
import floatingText from './graphics/FloatingText';
import seedrandom from "seedrandom";
import { IPlayer } from "./entity/Player";
import { MESSAGE_TYPES } from "./types/MessageTypes";
import { setPlayerAttributeMax } from "./entity/Unit";
const elPerkList = document.getElementById('perkList');
const elPerksEveryLevel = document.getElementById('perkEveryLevel');
const elPerksEveryTurn = document.getElementById('perkEveryTurn');

export function cleanUpPerkList() {
    if (elPerksEveryLevel) {
        elPerksEveryLevel.innerHTML = '';
    }
    if (elPerksEveryTurn) {
        elPerksEveryTurn.innerHTML = '';
    }
}

// if omitWhen is set to true, it won't  the 'when' attribute of the perk
export function getPerkText(perk: AttributePerk, omitWhen: boolean = false): string {
    return `
${perk.certainty < 1.0 ? `🎲 ${Math.round(perk.certainty * 100)}% chance` : ``}
${perkAttributeToIcon(perk.attribute)} +${Math.round((perk.amount - 1.0) * 100)}% ${perkAttributeToString(perk.attribute)}
${omitWhen ? '' : perkWhenToString(perk.when)}`.trim();

}
export function createPerkElement(perk: AttributePerk, player: IPlayer, underworld: Underworld) {
    if (globalThis.headless) {
        // There is no DOM in headless mode
        return;
    }
    const { pie } = underworld;
    const element = document.createElement('div');
    element.classList.add('card', 'upgrade');
    element.classList.add('perk', 'ui-border');
    const elCardInner = document.createElement('div');
    elCardInner.classList.add('card-inner');
    element.appendChild(elCardInner);

    const desc = document.createElement('div');
    desc.classList.add('card-description');
    const descriptionText = document.createElement('div');
    descriptionText.innerHTML = getPerkText(perk);
    desc.appendChild(descriptionText);

    elCardInner.appendChild(desc);
    element.addEventListener('click', (e) => {
        // Prevent click from "falling through" upgrade and propagating to vote for overworld level
        e.stopPropagation();
        pie.sendData({
            type: MESSAGE_TYPES.CHOOSE_PERK,
            perk,
        });
    });
    element.addEventListener('mouseenter', (e) => {
        playSFXKey('click');
    });
    return element;
}

function perkWhenToString(when: WhenUpgrade): string {
    if (when == 'everyLevel') {
        return '🗺️ every level';
    } else if (when == 'everyTurn') {
        return '🕰️ every turn️';
    } else if (when == 'immediately') {
        return '';
    }
    return '';
}
function perkAttributeToIcon(attr: string): string {
    if (attr == 'manaMax') {
        return `🔵`;
    }
    if (attr == 'healthMax') {
        return `❤️`;
    }
    if (attr == 'staminaMax') {
        return `🏃‍♂️`;
    }
    if (attr == 'mana') {
        return `🔵`;
    }
    if (attr == 'health') {
        return `❤️`;
    }
    if (attr == 'stamina') {
        return `🏃‍♂️`;
    }
    if (attr == 'attackRange') {
        return `🎯`;

    }
    return '';
}
function perkAttributeToString(attr: string): string {
    if (attr == 'manaMax') {
        return `Mana Capacity`;
    }
    if (attr == 'healthMax') {
        return `Health Capacity`;
    }
    if (attr == 'staminaMax') {
        return `Stamina Capacity`;
    }
    if (attr == 'mana') {
        return `single-turn Mana`;
    }
    if (attr == 'health') {
        return `single-turn Health`;
    }
    if (attr == 'stamina') {
        return `single-turn Stamina`;
    }
    if (attr == 'attackRange') {
        return `Cast Range`;

    }
    return attr;
}
export type UpgradableAttribute = 'staminaMax' | 'stamina' | 'healthMax' | 'health' | 'manaMax' | 'mana' | 'attackRange'
export type WhenUpgrade = 'immediately' | 'everyLevel' | 'everyTurn';
export function generatePerks(number: number, underworld: Underworld): AttributePerk[] {
    const perks: AttributePerk[] = [];
    const preRolledCertainty = chooseOneOf([0.1, 0.2, 0.3]) || 0.2;
    let failedDueToDuplicateCount = 0;
    for (let i = 0; i < number; i++) {

        let when: WhenUpgrade = 'immediately';// Default, should never be used
        let amount = 1.1;// Default, should never be used
        // certainty is a preportion 0.0 - 1.0
        let certainty: number = 1.0;// Default, should never be used
        let attribute: UpgradableAttribute = 'stamina';//Default, should never be used

        // Choose attribute type
        const seed = seedrandom(getUniquePerkSeedString(underworld, globalThis.player));
        const choiceAttributeType = chooseObjectWithProbability([{ attr: 'maxStat', probability: 10 }, { attr: 'stat', probability: 3 }], seed)?.attr || 'maxStat';
        if (choiceAttributeType == 'maxStat') {
            attribute = chooseOneOf(['staminaMax', 'healthMax', 'manaMax', 'attackRange']) || 'stamina';
            when = chooseOneOf<WhenUpgrade>(['immediately', 'everyLevel']) || 'immediately';
            if (when == 'everyLevel') {
                amount = 1.03;
                if (attribute == 'healthMax') {
                    amount = 1.08;
                }
                certainty = 1.0;
            } else if (when == 'immediately') {
                amount = 1.15;
                if (attribute == 'healthMax') {
                    amount = 1.4;
                }
                certainty = 1.0;
            }
        } else {
            attribute = chooseOneOf(['stamina', 'health', 'mana']) || 'stamina';
            // Regular stats' when should be recurring because regular stats wouldn't do much good as an
            // upgrade if they were only changed once
            when = chooseOneOf<WhenUpgrade>(['everyLevel', 'everyTurn']) || 'everyLevel';
            if (when == 'everyLevel') {
                amount = 1.3;
                certainty = 1.0;
            } else if (when == 'everyTurn') {
                amount = 1.2;
                certainty = preRolledCertainty;
            } else {
                console.error('Unexpected: Invalid when for regular stat perk');
            }

        }
        const newPerk = {
            attribute,
            when,
            amount,
            certainty
        };

        // Prevent duplicates
        const duplicate = perks.find(p => JSON.stringify(p) == JSON.stringify(newPerk));
        if (duplicate) {
            i--;
            failedDueToDuplicateCount++;
            if (failedDueToDuplicateCount > 100) {
                console.error('Infinite loop protection, could not generate unique perk', JSON.stringify(perks));
                return perks;
            }
            continue;
        }

        perks.push(newPerk);
    }

    return perks;

}
export function choosePerk(perk: AttributePerk, player: IPlayer, underworld: Underworld) {
    // Reset reroll counter now that player has chosen a perk 
    player.reroll = 0;
    // Ensure the player cannot pick more perks than they have available
    if (player.perksLeftToChoose <= 0) {
        // if current player, manage the visibility of the upgrade screen
        if (player == globalThis.player) {
            console.log('Cannot choose another perk');
            // Clear upgrades
            document.body?.classList.toggle(showUpgradesClassName, false);
            // There may be upgrades left to choose
            underworld.showUpgrades();
            return;
        }
    }
    if (perk.when == 'immediately') {
        // Note: random doesn't need to be seeded for 'immediate' perks because they
        // are guarunteed to proc
        tryTriggerPerk(perk, player, 'immediately', seedrandom(), underworld, 0);
    } else {
        player.attributePerks.push(perk);
    }
    // Decrement and 
    // Ensure it doesn't go negative
    player.perksLeftToChoose = Math.max(0, player.perksLeftToChoose - 1);
    if (player == globalThis.player) {
        // Clear upgrades when current player has picked one
        document.body?.classList.toggle(showUpgradesClassName, false);
        // Show next round of upgrades
        underworld.showUpgrades();
    }
}
export function hidePerkList() {
    if (elPerkList) {
        elPerkList.classList.toggle('visible', false);
    }
}
export function showPerkList(player: IPlayer) {
    if (!globalThis.headless) {
        if (elPerkList && elPerksEveryLevel && elPerksEveryTurn) {
            if (player.attributePerks.length) {
                elPerkList.classList.toggle('visible', true);
                const everyLevel = player.attributePerks.filter(p => p.when == 'everyLevel');
                const everyTurn = player.attributePerks.filter(p => p.when == 'everyTurn');
                // Clear previous perks now that they will be replaced
                elPerksEveryLevel.innerHTML = '';
                elPerksEveryTurn.innerHTML = '';
                everyLevel.forEach(p => perkToListItem(p, elPerksEveryLevel));
                everyTurn.forEach(p => perkToListItem(p, elPerksEveryTurn));
            } else {
                console.log('PerkList: No perks to show.');
                elPerkList.classList.toggle('visible', false);
            }
        } else {
            console.error('Could not render perkList')
        }
    }

}
function perkToListItem(perk: AttributePerk, container: HTMLElement) {
    const el = document.createElement('div');
    el.innerHTML = getPerkText(perk, true);
    container.appendChild(el);
}
export interface AttributePerk {
    attribute: UpgradableAttribute;
    // certainty is a preportion 0.0 - 1.0
    certainty: number;
    when: WhenUpgrade;
    // amount is a preportion 0.0 - 1.0
    amount: number;
}
export function getUniquePerkSeedString(underworld: Underworld, player?: IPlayer): string {
    // Seeded random based on the turn so it's consistent across all clients
    // based on player client ids so it's unique to each player
    return `${underworld.seed}-${underworld.levelIndex}-${underworld.turn_number}-${player?.clientId || '0'}`;
}
export function tryTriggerPerk(perk: AttributePerk, player: IPlayer, when: WhenUpgrade, random: seedrandom.PRNG, underworld: Underworld, offsetNotifyByMs: number) {
    if (perk.when == when) {
        const pick = random.quick();
        const doTriggerPerk = pick <= perk.certainty;
        const oldAttributeAmount = player.unit[perk.attribute];
        if (doTriggerPerk) {
            if (perk.attribute == 'manaMax' || perk.attribute == 'healthMax' || perk.attribute == 'staminaMax') {
                setPlayerAttributeMax(player.unit, perk.attribute, player.unit[perk.attribute] * perk.amount)
            } else {
                let maxAmount = player.unit[perk.attribute];
                if (perk.attribute == 'mana') {
                    maxAmount = player.unit['manaMax'];
                } else if (perk.attribute == 'health') {
                    maxAmount = player.unit['healthMax'];
                } else if (perk.attribute == 'stamina') {
                    maxAmount = player.unit['staminaMax'];
                }
                player.unit[perk.attribute] = perk.amount * maxAmount;
                player.unit[perk.attribute] = Math.ceil(player.unit[perk.attribute]);
            }
            if (player === globalThis.player) {
                setTimeout(() => {
                    floatingText({ coords: player.unit, text: `+${Math.round(player.unit[perk.attribute] - oldAttributeAmount)} ${perkAttributeToString(perk.attribute)}` });
                }, offsetNotifyByMs);
            }
            // Now that the player unit's properties have changed, sync the new
            // state with the player's predictionUnit so it is properly
            // refelcted in the bar
            // (note: this would be auto corrected on the next mouse move anyway)
            underworld.syncPlayerPredictionUnitOnly();
            Unit.syncPlayerHealthManaUI(underworld);
        }
    }
}