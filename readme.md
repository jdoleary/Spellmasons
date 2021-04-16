## Features

- Alt click to ping a cell on the board to other players
- Use window.save and window.load to persist the game state
- Left click to select or cast, right-click to move
- Press 'Z' key to toggle planning view
- Press 'Escape' to clear selected cards
- Hold 'Shift' to temporarily hide selected cards to allow for click inspecting

## Dev information

- Images are stored NOT in the public/ director because they are processed into a sprite sheet and the sprite sheet is added to that directory

## Cards, Modifiers and Effects

Cards use a common api to allow for them to compose with each other.
Some cards add modifiers and modifiers add events. Events are functions that are triggered when certain events occur.

## Assets

Using kenny game assets

## Notes

Minor versions are incremented for functional non-broken commit states that should be able to run without changes.
