import * as PIXI from 'pixi.js';
const fShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;

varying vec2 vTextureCoord;
// The image data from the PIXI object that the filter is applied to
uniform sampler2D uSampler;
uniform sampler2D uTexture;


void main() {
  vec4 texColor = texture2D(uTexture, vTextureCoord);
  gl_FragColor = texColor;
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
export default function () {
    if (!globalThis.pixi) {
        return undefined
    }
    const uniforms = {
        uResolution: new PIXI.Point(800, 600),
        uTexture: new PIXI.Texture.from('images/tiles/all_liquid.png'),
    };
    return {
        filter: new globalThis.pixi.Filter(vShader, fShader, uniforms),
        uniforms
    };
}