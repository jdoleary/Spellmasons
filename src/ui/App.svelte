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
  }
</script>
