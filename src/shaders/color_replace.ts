export default {};
// In player.ts
// import * as PIXI from 'pixi.js';
// import { ColorReplaceFilter } from '@pixi/filter-color-replace';
//   if (player.unit.image) {
//     console.log('jtest', player.unit.image.sprite.filters);
//     // if(!player.unit.image.sprite.filters){

//     // }
//     const colorReplaceFilter = new ColorReplaceFilter()
//     window.c = colorReplaceFilter;
//     player.unit.image.sprite.filters?.push(colorReplaceFilter);
//   }

// In console
// 11: 17: 22.444 window.c.uniformGroup.uniforms
// 11: 17: 22.458
// Object { originalColor: Float32Array(3), newColor: Float32Array(3), epsilon: 0.4, uSampler: {… }, filterGlobals: {… }, globals: {… } }

// epsilon: 0.4

// filterGlobals: Object { group: true, dirtyId: 1668, id: 2, … }

// globals: Object { group: true, dirtyId: 5090, id: 1, … }

// newColor: Float32Array(3)[0, 0, 0]

// originalColor: Float32Array(3)[1, 0, 0]

// uSampler: Object { _eventsCount: 0, noFrame: true, valid: true, … }

// <prototype>: Object { … }

// 11: 18: 40.051 window.c.uniformGroup.uniforms.originalColor
// 11: 18: 40.067
// Float32Array(3)[1, 0, 0]

// 11: 18: 45.906 window.c.uniformGroup.uniforms.originalColor[1] = 1
// 11: 18: 45.922 1
// 11: 18: 47.355 window.c.uniformGroup.uniforms.originalColor
// 11: 18: 47.368
// Float32Array(3)[1, 1, 0]

// 11: 18: 50.418 window.c.uniformGroup.uniforms.originalColor[2] = 1
// 11: 18: 50.433 1
// 11: 19: 23.962 const jacket = [65, 127, 129]
// 11: 19: 23.976 undefined
// 11: 19: 37.482 jacket.map(x => x / 255)
// 11: 19: 37.499
// Array(3)[0.2549019607843137, 0.4980392156862745, 0.5058823529411764]

// 11: 19: 54.778 window.c.uniformGroup.uniforms.originalColor[0] = jacket.map(x => x / 255)[0]
// 11: 19: 54.797 0.2549019607843137
// 11: 19: 58.906 window.c.uniformGroup.uniforms.originalColor[1] = jacket.map(x => x / 255)[1]
// 11: 19: 58.921 0.4980392156862745
// 11: 20: 03.050 window.c.uniformGroup.uniforms.originalColor[2] = jacket.map(x => x / 255)[2]
// 11: 20: 03.066 0.5058823529411764
// 11: 20: 14.226 window.c.uniformGroup.uniforms
// 11: 20: 14.242
// Object { originalColor: Float32Array(3), newColor: Float32Array(3), epsilon: 0.4, uSampler: {… }, filterGlobals: {… }, globals: {… } }

// epsilon: 0.4

// filterGlobals: Object { group: true, dirtyId: 14886, id: 2, … }

// globals: Object { group: true, dirtyId: 44744, id: 1, … }

// newColor: Float32Array(3)[0, 0, 0]

// originalColor: Float32Array(3)[0.2549019753932953, 0.49803921580314636, 0.5058823823928833]

// uSampler: Object { _eventsCount: 0, noFrame: true, valid: true, … }

// <prototype>: Object { … }

// 11: 20: 20.226 window.c.uniformGroup.uniforms.epsilon = 0.1
// 11: 20: 20.244 0.1
// 11: 20: 57.714 const newJacket = [116, 188, 99]
// 11: 20: 57.731 undefined
// 11: 21: 09.098 window.c.uniformGroup.uniforms.newColor[2] = newJacket.map(x => x / 255)[2]
// 11: 21: 09.116 0.38823529411764707
// 11: 21: 12.793 window.c.uniformGroup.uniforms.newColor[1] = newJacket.map(x => x / 255)[1]
// 11: 21: 12.816 0.7372549019607844
// 11: 21: 16.154 window.c.uniformGroup.uniforms.newColor[0] = newJacket.map(x => x / 255)[0]
// 11: 21: 16.172 0.4549019607843137 