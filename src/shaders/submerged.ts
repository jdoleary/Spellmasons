import * as PIXI from 'pixi.js';
// TODO: convert from shadertoy:
// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     float thresholdY = sin(iTime);
//     float thresholdX = cos(iTime)+1.5;

//     ivec2 size = textureSize(iChannel0, 1);


//     vec2 size2 = vec2(size);
//     vec2 coord = fragCoord;
//     float waveHeight = 20.0;
//     float wavePeriod = 80.0;
//     float waveSpeed = 200.0;

//     if(coord.x <= size2.x && coord.y <= size2.y && coord.x >= 0.0 && coord.y >= 0.0){
//         //if(coord.y < size2.y/2.0 + mod(coord.x,thresholdX*200.0) /waveHeight){
//         if(coord.y < size2.y/2.0 + cos((coord.x+iTime*waveSpeed)/wavePeriod)*waveHeight){

//             fragColor = vec4(0.4);
//         }else{
//             vec2 xy = coord.xy / size2;//Condensing this into one line
//             vec4 texColor = texture(iChannel0,xy);//Get the pixel at xy from iChannel0

//             fragColor = texColor;//Set the screen pixel to that color
//         }
//     }else{
//         fragColor = vec4(0.3);
//     }

// }

// float mod_float(float base, float div){
//     return div - (base * floor(div/base));
// }
// https://github.com/pixijs/pixijs/wiki/v4-Creating-Filters
const fShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float time;
uniform vec4 filterArea;
uniform vec2 dimensions;
void main(void)
{
    float howHighUpAndDown = 5.0;
    vec2 pixelCoord = vTextureCoord * filterArea.xy;
    vec2 normalizedCoord = pixelCoord / dimensions;
    vec4 color = texture2D(uSampler, vTextureCoord);
    if(normalizedCoord.y < 0.1){
        gl_FragColor = vec4(0.0,0.0,0.0,0.0);
    }else{
        gl_FragColor = color;
    }
}`;
// if(vTextureCoord.y + sin(time/1000.0)/8.0 > 0.6){
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
function submerged() {
    const uniforms = {
        time: 0.0,
        dimensions: []
    };
    const filter = new PIXI.Filter(vShader, fShader, uniforms)
    filter.apply = function (filterManager, input, output, clear) {
        this.uniforms.dimensions[0] = input.width;
        this.uniforms.dimensions[1] = input.height;
        // filterManager.calculateSpriteMatrix
        // draw the filter...
        filterManager.applyFilter(this, input, output, clear);
    }
    return {
        filter,
        uniforms
    };
}
export default submerged();