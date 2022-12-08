## 2022.12.08

- game files install to: C:\Users\Jordan\AppData\Local\spellmasons
- steam files download to: C:\Program Files (x86)\Steam\steamapps\common\Spellmasons
**Solving efficient updates**
- Requirements:
  1. it should work regardless of where a user's steam install directory is
  2. it should work on first run of the game, not needing a restart after downloading an update triggered by first run
- Options:
  - Pushing updates through Steam
    - This doesn't work well because Squirrel installs the game files in a different directory than the steam install directory and it's difficult to determine where the steam install directory is so communicating between those directories would be unreliable
  - Using Hazel or other build in electron update
    - This appears to require installing the entire app every time an update is pushed
    - This requires a restart after the update is installed so it doesn't support requirement #2
  - Having electron just render play.spellmasons.com
    - This would work like a regular website and so long as I have cache busting set up right it will satisfy both requirements.  The disadvantage is that an old version will be stored on steam perminantly and users will have to have an internet connection when the boot up the game in order to get the latest update

**Boss Design**
The more "advance notice" the players get the more interesting the boss is because they can react to it.
So if you know where he's going to teleport a full turn before you can prepare for it.  If you know what mobs he's gunna consume you can interact with them or change them.
Maybe the boss could be a larger, eviler spellmason.  Maybe with emanating particles.  He could teleport, spawn red portals that are linked to each other, summon guys, consume units to grow stronger etc.
What is second stage?

Boss aesthetic: Desaturated spellmason with eminating purple particles
Abilities: 
  - Consume NPCs to grow stronger
    - use "mana trail" like particles but make it a health trail
  - Can teleport but broadcasts teleport location one turn early.
  - Can resurrect allies
  - Can spawn "pickups" / red portals
    - red portals take you to the another red portal and disappears after use
      - maybe they hurt you when you go through them?

## 2022.12.01
Working on dynamically loading js to ensure that the steam install stays small for updates.
Turns out that the exe output by Squirrel is actually just an installer, not the game's exe.
Once installed, the game exe is placed `C:\Users\Jordan\AppData\Local\spellmasons\app-1.0.0`
as well as all the javascript and assets that it runs.  So you can either load javascript via 
Electron relative to the exe (the game not the installer) path like so:
```js
  // Load javascript
  const fileContents = fs.readFileSync('testDynamicImport.js', { encoding: 'utf-8' });
  console.log('Electron: javascript', fileContents);
  mainWindow.webContents.executeJavaScript(fileContents);
```
or you can put the js in `C:\Users\Jordan\AppData\Local\spellmasons\app-1.0.0\resources\app\src\build` and load it from js like so:
```js
// Dynamically import game scripts:
for (let url of ['./testDynamicImport2.js']) {
    console.log('Experiment: Attempting to import 2', url);
    const script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL
    document.head.appendChild(script);
}
```
---
- Use transform3d functions to trigger hardware acceleration: "In essence, any transform that has a 3D operation as one of its functions will trigger hardware compositing, even when the actual transform is 2D, or not doing anything at all (such as translate3d(0,0,0)). Note this is just current behaviour, and could change in the future (which is why we don’t document or encourage it). But it is very helpful in some situations and can significantly improve redraw performance."
## 2022.09.11
Amazing git command to ammend to a previous commit
`git config --global alias.amend-to '!f() { SHA=`git rev-parse "$1"`; git stash -k && git commit --fixup "$SHA" && GIT_SEQUENCE_EDITOR=true git rebase --interactive --autosquash "$SHA^" && git stash pop; }; f'`
from https://stackoverflow.com/a/48999882/4418836

## 2022.09.10
Was finally able to get npm link working with vite viahttps://dev.to/hontas/using-vite-with-linked-dependencies-37n7

```
rm -rf node_modules/.vite
npm link PACKAGE

// in vite config
export default {
  // ...
  optimizeDeps: {
    exclude: ['PACKAGE']
  }
}

```
## 2022.08.02
 Horizontall flip image:
 `magick playerAttackSmallMagic_*.png -flop -set filename:base "%[basename]" "%[filename:base].png"`
### Blue Ocean Principle
The primary unique driver behind Spellmasons is creativity in spellcasting.  So don't get distracted by all sorts of other things like upgrades and other roguelite elements.  Focus on making the spellcasting superb!

## 2021.04.18

It's really coming alone now. Dev Phase "Gameplay Core" is essentially done. Next will be to add more content and polish.

## 2021.03.13

Around 3 weeks of serious development into the project (around 3 montsh total) and I had the first day where I actually had a lot of fun with it!
Brad and I played for about 20 minutes and had a great time. I think this could really turn into a good game!

## 2022.06.02
To show original tiles:
1. ensure at least one player spawn is returned so it doesn't loop forever
2. Comment out "// Change all remaining base tiles to final tiles" section
---
The pathing only requires being inside an inverted poly if there is a single inverted poly anywhere, if there are none, it works fine with just
regular polys

## 2022.06.12
I have 8 working days until Erin and I leave on our June Trip.  By that time I think the game will be in a very good state. Major tasks I'll have done:
- Map Generation
- Liquid interaction
- New Spell Toolbar
- Stand alone server
- Server browser
- Better Menu

## 2022.06.13
Was able to horizontally flip images with the following command:
`magick *.png -flop -set filename:base "%[basename]" "%[filename:base].png"`