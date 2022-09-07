// const fragment = `
// varying vec2 vTextureCoord;
// uniform sampler2D uSampler;
// uniform float time;
// void main(void)
// {
//     // vec2 coord = mod(vTextureCoord + vec2(time, 0.0), 1.0);
//     vec2 coord = vTextureCoord + vec2(0.5, 0.0);
//     vec4 color = texture2D(uSampler, coord);
//     // Make a little transparent just to show that the shader is working
//     gl_FragColor = vec4(color.rgb * 0.5, color.w);
// }`;
// // Default pixi vShader
// const vertex = `
// attribute vec2 aVertexPosition;
// attribute vec2 aTextureCoord;
// uniform mat3 projectionMatrix;
// varying vec2 vTextureCoord;
// void main(void)
// {
//     gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
//     vTextureCoord = aTextureCoord;
// }`;
const fragment = `
varying vec2 vFilterCoord;
varying vec2 vTextureCoord;

uniform vec2 scale;
uniform mat2 rotation;
uniform sampler2D uSampler;
uniform sampler2D mapSampler;

uniform highp vec4 inputSize;
uniform vec4 inputClamp;

void main(void)
{
  vec4 map =  texture2D(mapSampler, vFilterCoord);

  map -= 0.5;
  map.xy = scale * inputSize.zw * (rotation * map.xy);

  gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), inputClamp.xy, inputClamp.zw));
}

`;
const vertex = `
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform mat3 filterMatrix;

varying vec2 vTextureCoord;
varying vec2 vFilterCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
	gl_Position = filterVertexPosition();
	vTextureCoord = filterTextureCoord();
	vFilterCoord = ( filterMatrix * vec3( vTextureCoord, 1.0)  ).xy;
}

`;
// const filter = function () {
//     if (!globalThis.pixi) {
//         return undefined
//     }
//     const uniforms = {
//         time: 0.0
//     };
//     return {
//         filter: new globalThis.pixi.Filter(vertex, fragment, uniforms),
//         uniforms
//     };
// }
// export default filter;
import { Filter } from '@pixi/core';
import { Matrix, Point } from '@pixi/math';

import type { CLEAR_MODES } from '@pixi/constants';
import type { FilterSystem, RenderTexture, Texture, ISpriteMaskTarget } from '@pixi/core';

/**
 * The DisplacementFilter class uses the pixel values from the specified texture
 * (called the displacement map) to perform a displacement of an object.
 *
 * You can use this filter to apply all manor of crazy warping effects.
 * Currently the `r` property of the texture is used to offset the `x`
 * and the `g` property of the texture is used to offset the `y`.
 *
 * The way it works is it uses the values of the displacement map to look up the
 * correct pixels to output. This means it's not technically moving the original.
 * Instead, it's starting at the output and asking "which pixel from the original goes here".
 * For example, if a displacement map pixel has `red = 1` and the filter scale is `20`,
 * this filter will output the pixel approximately 20 pixels to the right of the original.
 * @memberof PIXI.filters
 */
export default class DisplacementFilter extends Filter {
    public maskSprite: ISpriteMaskTarget;
    public maskMatrix: Matrix;
    public scale: Point;

    /**
     * @param {PIXI.Sprite} sprite - The sprite used for the displacement map. (make sure its added to the scene!)
     * @param scale - The scale of the displacement
     */
    constructor(sprite: ISpriteMaskTarget, scale?: number) {
        const maskMatrix = new Matrix();

        sprite.renderable = false;

        super(vertex, fragment, {
            mapSampler: sprite._texture,
            filterMatrix: maskMatrix,
            scale: { x: 1, y: 1 },
            rotation: new Float32Array([1, 0, 0, 1]),
        });

        this.maskSprite = sprite;
        this.maskMatrix = maskMatrix;

        if (scale === null || scale === undefined) {
            scale = 20;
        }

        /**
         * scaleX, scaleY for displacements
         * @member {PIXI.Point}
         */
        this.scale = new Point(scale, scale);
    }

    /**
     * Applies the filter.
     * @param filterManager - The manager.
     * @param input - The input target.
     * @param output - The output target.
     * @param clearMode - clearMode.
     */
    public apply(
        filterManager: FilterSystem, input: RenderTexture, output: RenderTexture, clearMode: CLEAR_MODES
    ): void {
        // fill maskMatrix with _normalized sprite texture coords_
        this.uniforms.filterMatrix = filterManager.calculateSpriteMatrix(this.maskMatrix, this.maskSprite);
        this.uniforms.scale.x = this.scale.x;
        this.uniforms.scale.y = this.scale.y;

        // Extract rotation from world transform
        const wt = this.maskSprite.worldTransform;
        const lenX = Math.sqrt((wt.a * wt.a) + (wt.b * wt.b));
        const lenY = Math.sqrt((wt.c * wt.c) + (wt.d * wt.d));

        if (lenX !== 0 && lenY !== 0) {
            this.uniforms.rotation[0] = wt.a / lenX;
            this.uniforms.rotation[1] = wt.b / lenX;
            this.uniforms.rotation[2] = wt.c / lenY;
            this.uniforms.rotation[3] = wt.d / lenY;
        }

        // draw the filter...
        filterManager.applyFilter(this, input, output, clearMode);
    }

    /** The texture used for the displacement map. Must be power of 2 sized texture. */
    get map(): Texture {
        return this.uniforms.mapSampler;
    }

    set map(value: Texture) {
        this.uniforms.mapSampler = value;
    }
}
