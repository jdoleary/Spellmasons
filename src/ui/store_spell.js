import { writable } from 'svelte/store';

function createStore() {
  const { subscribe, update } = writable({
    spell_type: null,
    damage: 0,
    delay: 0,
    freeze: false,
    chain: false,
    aoe_radius: 0,
  });

  return {
    subscribe,
    updateDamage: (delta) =>
      update((spell) => {
        spell.damage += delta;
        return spell;
      }),
    toggle: (key) =>
      update((spell) => {
        spell[key] = !spell[key];
        return spell;
      }),
    set: (key, val) =>
      update((spell) => {
        spell[key] = val;
        return spell;
      }),
  };
}
const _store = createStore();
window.store = _store;
export default _store;
