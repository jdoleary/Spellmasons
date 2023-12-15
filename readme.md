![Gif of spells in action](./readme_images/combine-spells-large.gif)

Spellmasons is a turn-based, tactical roguelike where you devise spell combinations to overcome an onslaught of relentless enemies. Team up with your friends in online cooperative multiplayer, and delve into the intricacies of magic where clever combinations yield powerfully satisfying results. 

[![Buy Spellmasons on Steam](./readme_images/buy_spellmasons_CTA.png)](https://store.steampowered.com/app/1618380/Spellmasons/)

## Getting Started
- Install [Nodejs](https://nodejs.org/) on your development machine
- Clone this repository with git ([learn more about git](https://www.youtube.com/watch?v=HkdAHXoRtos))
- In your console, run `npm install`, then `npm start`.  Navigate a browser (Chrome recommended) to http://localhost:3000/ and you're good to go!  It will automatically refresh when changes are made to the code.
- Underworld.ts is the file that contains most of the game state.  Checkout Unit.ts and Player.ts too to get started making changes!


## Development Tips
- Press F12 to open the console (this works in the Steam version of the game too!)
- If you set `adminMode = true` in the console,  you can then `Shift + Left Click` during a live game to open the admin menu which allows you to spawn things and change unit stats.
- You can access the current game state in the console via `devUnderworld`.  To get you started messing around with the game in the console, move your character's position with the following: `devUnderworld.players[0].unit.x += 100`.
- Important note, there are some development-only features (such as auto picking upgrades) that are meant to speed up develoment.  If you need them off, go to the console (F12) and type `devAutoPickUpgrades=false;`

## License
Please read and respect the [licence](./LICENSE.md).  I am making this software publicly available because I love video games and I love making them and I want to give players and tinkerers the ability to see how I made it and the ability to make changes of their own.  I'd like the game to live beyond the time I spend working on it and so I am giving you the ability to fully edit the game for your own enjoyment!  If you want to use a portion of my work in your own separate project, please reach out to me for permission.

## Support my work
The best way you can support my work is to purchase Spellmasons on [Steam](https://store.steampowered.com/app/1618380/Spellmasons/) and review it on Steam!  Also spreading the word to friends helps :)
## Contact me
- Twitter: [@nestfall](https://twitter.com/nestfall)
- Email: spellmasons@gmail.com

![Logo](./readme_images/store_capsule_header.png)
