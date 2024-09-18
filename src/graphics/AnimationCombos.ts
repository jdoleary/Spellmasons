interface AnimationCombo {
    // Triggers a callback when the frame is changed to.
    // This is used to fire off other animations, like an archers
    // arrow at the moment when the archer releases the arrow, even though that's
    // not the end of the animation
    keyFrame?: number;
    primaryAnimation: string;
    // OneOff animations that play with and belong to the primary animation.
    companionAnimations: string[];
    SFX?: string[];
}
const combos: { [spritePath: string]: AnimationCombo } = {
    'playerAttackSmall': {
        keyFrame: 11,
        primaryAnimation: 'playerAttackSmall',
        companionAnimations: ['playerAttackSmallMagic'],
        SFX: ['playerCharacterSmallCast']
    },
    'playerAttackMedium0': {
        // At the moment the wizard's staff hits the ground
        keyFrame: 7,
        primaryAnimation: 'playerAttack',
        companionAnimations: ['playerAttackZap'],
        SFX: ['playerCharacterMediumCast', 'playerCharacterMediumCast2'],
    },
    'playerAttackMedium1': {
        // At the moment the wizard's staff hits the ground
        keyFrame: 7,
        primaryAnimation: 'playerAttack',
        companionAnimations: ['playerAttackBomb'],
        SFX: ['playerCharacterMediumCast', 'playerCharacterMediumCast2'],
    },
    'playerAttackEpic': {
        keyFrame: 23,
        primaryAnimation: 'playerAttackEpic',
        companionAnimations: ['playerAttackEpicMagic'],
        SFX: ['playerCharacterLargeCast', 'playerCharacterLargeCast2']
    },
    'gruntAttack': {
        keyFrame: 6,
        primaryAnimation: 'gruntAttack',
        companionAnimations: [],
        SFX: ['golemAttack']
    },
    'lobberAttack': {
        keyFrame: 4,
        primaryAnimation: 'lobberAttack',
        companionAnimations: [],
        SFX: ['lobberAttack']
    },
    'guruAttack': {
        keyFrame: 10,
        primaryAnimation: 'guruAttack',
        companionAnimations: [],
        SFX: ['goruAttack']
    },
    'archerAttack': {
        keyFrame: 7,
        primaryAnimation: 'archerAttack',
        companionAnimations: [],
        SFX: ['archerAttack']
    },
    'summonerAttack': {
        keyFrame: 8,
        primaryAnimation: 'summonerAttack',
        companionAnimations: [],
        SFX: ['summonerSummon']
    },
    'poisAttack': {
        keyFrame: 7,
        primaryAnimation: 'poisAttack',
        companionAnimations: [],
        SFX: []
    }

}
export default combos;