<script>
  import SpellBuilder from './SpellBuilder.svelte'
  import {MESSAGE_TYPES} from '../index.ts'
  import { CELL_SIZE } from '../Image';
  import store_spell from './store_spell'
  let currentSpell = null;
  store_spell.subscribe((spell) => {
    currentSpell = spell;
  });
  function clickOnBoard(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell_x = Math.floor(x / CELL_SIZE);
    const cell_y = Math.floor(y / CELL_SIZE);
    console.log('Click in cell:', cell_x, cell_y, currentSpell);
    if(currentSpell){
      const {spell_type,...spell} = currentSpell;
      if(spell_type === 'summon'){
        const vy = cell_y > 3 ? -1 : 1
        window.pie.sendData({ type: MESSAGE_TYPES.SPELL, spell:{
          x: cell_x,
          y: cell_y,
          summon: { vx:0, vy, imagePath: 'crocodile.png' },
        }});
      }else{
        window.pie.sendData({ type: MESSAGE_TYPES.SPELL, spell:{...spell, x:cell_x, y:cell_y} });
      }
    }
  }
</script>

<div id="game-container">
  <div id="board"  on:click="{clickOnBoard}">
    <div id="board-contents">
      <img
        id="grid-background"
        src="images/grid.png"
        width="512"
        height="512"
      />
    </div>
  </div>
  <div id="tools">
    <div>
      <SpellBuilder/>
      <button on:click="{() => {
    pie.sendData({ type: MESSAGE_TYPES.END_TURN });
        }}">End Turn</button>
    </div>
    <div>
      <pre id="log"></pre>
    </div>
  </div>
</div>