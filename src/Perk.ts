import { chooseOneOf, randFloat } from "./jmath/rand";
import Underworld, { showUpgradesClassName } from "./Underworld";
import floatingText from './graphics/FloatingText';
import seedrandom from "seedrandom";
import { IPlayer } from "./entity/Player";
import { MESSAGE_TYPES } from "./types/MessageTypes";
import { setPlayerAttributeMax } from "./entity/Unit";

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
    descriptionText.innerHTML = `
${perk.certainty < 1.0 ? `🎲 ${Math.round(perk.certainty * 100)}% chance to increase` : `Increase`}
${perkAttributeToString(perk.attribute)}
by ${Math.round((perk.amount - 1.0) * 100)}%
${perkWhenToString(perk.when)}`;
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
        return 'at the start of every 🗺️ level';
    } else if (when == 'everyTurn') {
        return 'at the start of every 🕰️ turn️';
    } else if (when == 'immediately') {
        return '';
    }
    return '';
}
function perkAttributeToString(attr: string): string {
    if (attr == 'manaMax') {
        return `<span class=''>🔵 Mana permantently</span>`;
    }
    if (attr == 'healthMax') {
        return `<span class=''>❤️ Health permanently</span>`;
    }
    if (attr == 'staminaMax') {
        return `<span class=''>🏃‍♂️ Stamina permanently</span>`;
    }
    if (attr == 'mana') {
        return `<span class=''>🔵 Mana temporarily</span>`;
    }
    if (attr == 'health') {
        return `<span class=''>❤️ Health temporarily</span>`;
    }
    if (attr == 'stamina') {
        return `<span class=''>🏃‍♂️ Stamina temporarily</span>`;
    }
    if (attr == 'attackRange') {
        return `🎯 Cast Range`;

    }
    return attr;
}
export type UpgradableAttribute = 'staminaMax' | 'stamina' | 'healthMax' | 'health' | 'manaMax' | 'mana' | 'attackRange'
export type WhenUpgrade = 'immediately' | 'everyLevel' | 'everyTurn';
export function generatePerks(number: number, underworld: Underworld): AttributePerk[] {
    const perks = [];
    const preRolledCertainty = chooseOneOf([0.1, 0.2, 0.3]) || 0.2;
    for (let i = 0; i < number; i++) {

        let when: WhenUpgrade = 'immediately';// Default, should never be used
        let amount = 1.1;// Default, should never be used
        // certainty is a preportion 0.0 - 1.0
        let certainty: number = 1.0;// Default, should never be used
        let attribute: UpgradableAttribute = 'stamina';//Default, should never be used

        // Choose attribute type
        const choiceAttributeType = chooseOneOf(['maxStat', 'stat']);
        if (choiceAttributeType == 'maxStat') {
            attribute = chooseOneOf(['staminaMax', 'healthMax', 'manaMax', 'attackRange']) || 'stamina';
            when = chooseOneOf<WhenUpgrade>(['immediately', 'everyLevel']) || 'immediately';
            if (when == 'everyLevel') {
                amount = 1.05;
                certainty = 1.0;
            } else if (when == 'immediately') {
                amount = 1.2;
                certainty = 1.0;
            }
        } else {
            attribute = chooseOneOf(['stamina', 'health', 'mana']) || 'stamina';
            // Regular stats' when should be recurring because regular stats wouldn't do much good as an
            // upgrade if they were only changed once
            when = chooseOneOf<WhenUpgrade>(['everyLevel', 'everyTurn']) || 'everyLevel';
            if (when == 'everyLevel') {
                amount = 1.8;
                certainty = 1.0;
            } else if (when == 'everyTurn') {
                amount = 1.4;
                certainty = preRolledCertainty;
            } else {
                console.error('Unexpected: Invalid when for regular stat perk');
            }

        }

        perks.push({
            attribute,
            when,
            amount,
            certainty
        });
    }

    return perks;

}
export function choosePerk(perk: AttributePerk, player: IPlayer, underworld: Underworld) {
    if (perk.when == 'immediately') {
        tryTriggerPerk(perk, player, 'immediately', underworld);
    } else {
        player.attributePerks.push(perk);
        // Due to the perks showing up after tryTriggerPerk for the everyLevel perks has already been called,
        // when a user chooses an everyLevel perk it should both trigger immediately, and get added to their
        // attributePerks array
        if (perk.when == 'everyLevel') {
            tryTriggerPerk(perk, player, 'everyLevel', underworld);
        }
    }
    // Reset reroll counter now that player has chosen a perk 
    player.reroll = 0;
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
export interface AttributePerk {
    attribute: UpgradableAttribute;
    // certainty is a preportion 0.0 - 1.0
    certainty: number;
    when: WhenUpgrade;
    // amount is a preportion 0.0 - 1.0
    amount: number;

}
export function tryTriggerPerk(perk: AttributePerk, player: IPlayer, when: WhenUpgrade, underworld: Underworld) {
    if (perk.when == when) {
        // Seeded random based on the turn so it's consistent across all clients
        const random = seedrandom(`${underworld.seed}-${underworld.levelIndex}-${underworld.turn_number}`);
        const pick = random.quick();
        const doTriggerPerk = pick <= perk.certainty;
        if (doTriggerPerk) {
            if (perk.attribute == 'manaMax' || perk.attribute == 'healthMax' || perk.attribute == 'staminaMax') {
                setPlayerAttributeMax(player.unit, perk.attribute, player.unit[perk.attribute] * perk.amount)
            } else {
                player.unit[perk.attribute] *= perk.amount;
                player.unit[perk.attribute] = Math.ceil(player.unit[perk.attribute]);
            }
            // TODO: offset multiple
            floatingText({ coords: player.unit, text: `Perk Applied!` });
            // Now that the player unit's properties have changed, sync the new
            // state with the player's predictionUnit so it is properly
            // refelcted in the bar
            // (note: this would be auto corrected on the next mouse move anyway)
            underworld.syncPlayerPredictionUnitOnly();
        }
    }
}