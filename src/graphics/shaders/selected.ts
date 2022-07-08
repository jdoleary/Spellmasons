import * as PIXI from 'pixi.js';
const fShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float alpha;
void main(void)
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    // Add red shade over the actual texture
    gl_FragColor = vec4(vec3(1.,0.,0.) * alpha + color.rgb * 1.0-alpha, color.w);
}`;
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
    const uniforms = {
        alpha: 0.0
    };
    return {
        filter: new PIXI.Filter(vShader, fShader, uniforms),
        uniforms
    };
}