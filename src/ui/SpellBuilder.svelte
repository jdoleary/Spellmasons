<script>
  import { getManaCost } from '../Spell.ts';
  import store_spell from './store_spell.js';
  let aoe_radius = 0;
  let mana_cost = 0;
  store_spell.subscribe((spell) => {
    mana_cost = getManaCost({
      ...spell,
      summon: spell.spell_type == 'summon',
    });
  });
</script>
<div>
  <h3>Spell Type</h3>
  <button
    on:click="{()=> {
        store_spell.set('spell_type','summon')
    }}"
  >
    Summon
  </button>
  <button
    on:click="{()=> {
        store_spell.set('spell_type','direct')
    }}"
  >
    Direct
  </button>
</div>
<div>
  {#if $store_spell.spell_type=='direct'}
  <h3>Spell Modifiers</h3>
  <div>
    <button on:click="{()=> {store_spell.updateDamage(-1)}}">+ Heal</button>
    {#if $store_spell.damage >= 0} {$store_spell.damage} Damage {:else}
    {-$store_spell.damage} Heal {/if}
    <button on:click="{()=> {store_spell.updateDamage(1)}}">+ Damage</button>
  </div>

  <div>
    <input
      type="checkbox"
      checked="{$store_spell.freeze}"
      on:click="{() => {
        store_spell.toggle('freeze');
    }}"
    />
    Freeze
  </div>
  <div>
    <input
      type="checkbox"
      checked="{$store_spell.chain}"
      on:click="{() => {
        store_spell.toggle('chain');
    }}"
    />
    Chain
  </div>
  <div>
    <input
      type="range"
      value="{aoe_radius}"
      on:change="{(event) => {store_spell.set('aoe_radius', parseInt(event.target.value));}}"
      min="0"
      max="2"
    />
    AOE Radius {$store_spell.aoe_radius}
  </div>

  {:else}
  <!-- TODO summon modifiers -->
  {/if}
  <div>Mana cost: {mana_cost}</div>
</div>
