interface AnimationCombo {
    // Triggers a callback when the frame is changed to.
    // This is used to fire off other animations, like an archers
    // arrow at the moment when the archer releases the arrow, even though that's
    // not the end of the animation
    keyFrame?: number;
    primaryAnimation: string;
    // OneOff animations that play with and belong to the primary animation.
    companionAnimations: string[];
    SFX?: string;
}
const combos: { [spritePath: string]: AnimationCombo } = {
    'playerAttackSmall': {
        keyFrame: 11,
        primaryAnimation: 'units/playerAttackSmall',
        companionAnimations: ['units/playerAttackSmallMagic'],
    },
    'playerAttackMedium0': {
        // At the moment the wizard's staff hits the ground
        keyFrame: 7,
        primaryAnimation: 'units/playerAttack',
        companionAnimations: ['units/playerAttackZap'],
        SFX: 'cast',
    },
    'playerAttackMedium1': {
        // At the moment the wizard's staff hits the ground
        keyFrame: 7,
        primaryAnimation: 'units/playerAttack',
        companionAnimations: ['units/playerAttackSingle'],
        SFX: 'cast',
    },
    'playerAttackMedium2': {
        // At the moment the wizard's staff hits the ground
        keyFrame: 7,
        primaryAnimation: 'units/playerAttack',
        companionAnimations: ['units/playerAttackBomb'],
        SFX: 'cast',
    },
    'playerAttackEpic': {
        keyFrame: 23,
        primaryAnimation: 'units/playerAttackEpic',
        companionAnimations: ['units/playerAttackEpicMagic'],
    },
    'units/lobberAttack': {
        keyFrame: 4,
        primaryAnimation: 'units/lobberAttack',
        companionAnimations: []
    },
    'units/archerAttack': {
        keyFrame: 6,
        primaryAnimation: 'units/archerAttack',
        companionAnimations: []
    },
    'units/summonerAttack': {
        keyFrame: 8,
        primaryAnimation: 'units/summonerAttack',
        companionAnimations: []
    }

}
export default combos;