**Spellmasons is a multiplayer, turn-based spell-weaving game about building powerful spells from small pieces and working together with your fellow wizards to decimate hordes of enemies!**

https://www.spellmasons.com

View dependecy graph as svg:
Run `depcruise --include-only "^src" --output-type dot src > depcruise-out.dot`
// Copy output to:
https://dreampuf.github.io/GraphvizOnline

View dependecy graph as table:
Run `depcruise --include-only "^src" --output-type html src > depcruise-out.html`

## Dev information

- Images are stored NOT in the public/ director because they are processed into a sprite sheet and the sprite sheet is added to that directory

How to update the sprite sheet:
Using TexturePacker, add images, public/spell, and public/upgrades as smart folders and publish.  Make sure both the png and the json are saved.  This is done by choosing Pixijs in the Data Format.
## Cards, Modifiers and Effects

Cards use a common api to allow for them to compose with each other.
Some cards add modifiers and modifiers add events. Events are functions that are triggered when certain events occur.

## Notes

Minor versions are incremented for functional non-broken commit states that should be able to run without changes.

## Backup
Backup repositories are on Gitlab and Keybase.  The primary repository is on Github


## Pushing a new version
To Update the headless servers, start Docker Desktop and run `./deploy.sh`
- Run alias `publish` as a shortcut to update the master branch (this is not production) but it will update play.spellmasons.com
- To Fully build and push a new version to production
    - Run `npm run build` in the `Golems-menu` repo (if menu has changed)
    - Run `backup` to push to gitlab and keybase
    - These 2 should always be done together:
        - UPDATES BACKEND: Run `./deploy.sh` to push new version to the backend servers on Digital Ocean
        - Go to `Golems-Electron-Build` and follow instructions to push a new package to Steam 