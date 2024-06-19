// const fragment = `
// varying vec2 vTextureCoord;
// varying vec2 vMappedMatrix;
// uniform sampler2D uSampler;
// uniform float time;
// void main(void)
// {
//     // vec2 coord = mod(vTextureCoord + vec2(time, 0.0), 1.0);
//     // vec2 coord = vTextureCoord + vec2(0.5, 0.0);
//     vec2 mapCoord = vTextureCoord * vMappedMatrix;
//     vec4 color = texture2D(uSampler, mapCoord);
//     // Make a little transparent just to show that the shader is working
//     gl_FragColor = vec4(color.rgb * 0.5, color.w);


// }`;
const fragment = `
varying vec2 vTextureCoord;
varying vec2 vMappedMatrix;
uniform float time;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor = texture2D(uSampler, mod(vTextureCoord.st + vec2(time,0), 1.0));
//    gl_FragColor = texture2D(uSampler, vTextureCoord + vec2(time,0));
    // vec2 coord = vec2(vTextureCoord.s, 1.0-vTextureCoord.t);
    // gl_FragColor = texture2D(uSampler, coord);
}
`;
// const fragment = `
// varying vec2 vFilterCoord;
// varying vec2 vTextureCoord;

// uniform vec2 scale;
// uniform mat2 rotation;
// uniform sampler2D uSampler;
// uniform sampler2D mapSampler;

// uniform highp vec4 inputSize;
// uniform vec4 inputClamp;

// void main(void)
// {
//   vec4 map =  texture2D(mapSampler, vFilterCoord);

//   map -= 0.5;
//   map.xy = scale * inputSize.zw * (rotation * map.xy);

//   gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), inputClamp.xy, inputClamp.zw));
// }
// `;
// Default pixi vShader
const vertex = `
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying vec2 vMappedMatrix;

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
    vMappedMatrix = ((vTextureCoord * inputSize.xy) + outputFrame.xy) / outputFrame.zw;
}`;
// const vertex = `
// attribute vec2 aVertexPosition;

// uniform mat3 projectionMatrix;
// uniform mat3 filterMatrix;

// varying vec2 vTextureCoord;
// varying vec2 vFilterCoord;
// varying vec3 vMap;

// uniform vec4 inputSize;
// uniform vec4 outputFrame;

// vec4 filterVertexPosition( void )
// {
//     vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

//     return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
// }

// vec2 filterTextureCoord( void )
// {
//     return aVertexPosition * (outputFrame.zw * inputSize.zw);
// }

// void main(void)
// {
// 	gl_Position = filterVertexPosition();
// 	vTextureCoord = filterTextureCoord();
//     vec3 mappedMatrix = ((vTextureCoord * inputSize.xy) + outputFrame.xy) / outputFrame.zw;
//     vMap = vec3( vTextureCoord.xy,1)*mappedMatrix;
// 	vFilterCoord = ( filterMatrix * vec3( vTextureCoord, 1.0)  ).xy;
// }
// `;
const filter = function () {
    if (!globalThis.pixi) {
        return undefined
    }
    const uniforms = {
        time: 0.0
    };
    return {
        filter: new globalThis.pixi.Filter(vertex, fragment, uniforms),
        uniforms
    };
}
export default filter;