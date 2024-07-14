# Modding Spellmasons 🧙🔧

With Spellmasons mods you can create 🔮**new spells**, 👹**new enemies**, 🥶**new modifiers**, ⚗️**new potions**, 🖼️**custom animations**, 💥**custom sound effects**.

All you need is a good idea and a little [Typescript](https://www.typescriptlang.org/) and [Github](https://github.com/) knowhow!

Let's get started!

## Getting Started
### Installation
1. Install [Node.js](https://nodejs.org)
2. If you haven't already, clone this repository
3. Open a terminal window and navigate to where the repository was cloned (such as `cd C:\\Spellmasons`) and run `npm install`.  (This installs all the packages needed to run Spellmasons)
4. Now you're ready to run a development version the game locally!  Type `npm start`.  If all goes well, you can open a browser window to `http://localhost:3000/` and you'll see the game.

Now let's modify our first mod!

### Tweaking a sample mod

### Mod Rules
1. Mods can import any `type`
For example 
`import type { Vec2 } from './jmath/Vec';`
2. Mods may **not** import anything else from outside the mod's folder that isn't exposed via SpellmasonsAPI
Example:
```js
// INCORRECT:
import * as cardUtils from "./cards/cardUtils";
import * as PlanningView from './graphics/PlanningView';
import * as cards from './cards/index';

// Correct:
const {
    cardUtils,
    PlanningView,
    cards,
} = globalThis.SpellmasonsAPI;
```

## Publishing Your Mod
TODO
To publish your mod so it's available on the Community Servers and available to all players, clone the [mods repository](https://github.com/jdoleary/spellmasons-mods), and move your mod into that folder.

You may need to update the imports.  Make sure that the imports follow the "Mod Rules" outlined above.

Finally, open a PR.  If the mod works well and is bug free (I will help with Quality Assurance), I will merge it into the mods repo and it will ship out with the next update!

You will also earn the "Modder" role in the Discord!

# DOCS BELOW ARE UNDER CONSTRUCTION
## INTERNAL _ Jordan todo
- [ ] Make sample mods for
  - [ ] New Spell
  - [ ] New Enemy
  - [ ] New Modifier
  - [ ] New Pickup
  - [ ] New Animation and SFX

## Background
[The game engine repository](https://github.com/jdoleary/Spellmasons) holds the Spellmasons game and engine code.  There you can run the game locally and test out your mod quickly!  When you're ready to make your mod public, it will have to be moved to the [mods repository](https://github.com/jdoleary/spellmasons-mods).  But I'll show you how to do that later.  

Let's start with a quick example.
## Footguns
- When making a targeting spell be sure to iterate it like so:
```js
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        // Do stuff here
        if(isConditionMet){
            addTarget(newTarget, state);
        }
      }
```
NOT like:
```js
for(let target of targets){
    // Do stuff here
    if(isConditionMet){
        addTarget(newTarget, state);
    }

}
```
This is because `addTarget` mutates the target array and you will get undesired behavior if
you invoke addTarget within a for..of that iterates targets array.