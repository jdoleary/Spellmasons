import * as PIXI from 'pixi.js';
const fShader = `
#ifdef GL_ES
precision mediump float;
#endif


varying vec2 vTextureCoord;
// The image data from the PIXI object that the filter is applied to
uniform sampler2D uSampler;
// The resolution of whatever container the texture is being painted onto
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform float uZoom;


void main() {
    // The size of the texture in the uniform
    vec2 texSize = vec2(64.0,64.0);
    vec2 coord = vTextureCoord * (uResolution / texSize / uZoom);
    gl_FragColor = texture2D(uTexture, coord);
}
`;
// Default pixi vShader
const vShader = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat3 projectionMatrix;
varying vec2 vTextureCoord;
void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`;
export const liquidUniforms = {
    uResolution: new PIXI.Point(800, 600),
    uTexture: PIXI.Texture.from('images/tiles/all_liquid.png'),
    uZoom: 1.0
}
export default function () {
    if (!globalThis.pixi) {
        return undefined
    }
    liquidUniforms.uTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    return {
        filter: new globalThis.pixi.Filter(vShader, fShader, liquidUniforms),
        uniforms: liquidUniforms
    };
}