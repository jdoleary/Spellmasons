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