# Shader

## Procedural Texture
- [Playground example](https://www.pixiplayground.com/#/edit/k3LQY3-KoA0E61Nu07UBI)
- [Thread: Custom shader for graphic fills](https://github.com/pixijs/pixijs/discussions/7728)
- [Better tiling of textures](https://iquilezles.org/articles/texturerepetition/)
- [Simple shader on image](https://codepen.io/omarshe7ta/pen/zqQxRQ)
- [Simple shader on image](https://codepen.io/jdoleary/pen/jOzLGZv?editors=1010)
- [Displacement filter example](https://codepen.io/chles/pen/aNxMxQ)

- [Display an image in a shader](https://stackoverflow.com/a/73111831/4418836)
- [Repeating Texture](https://codepen.io/jdoleary/pen/RwMZQbr?editors=0010)
```js
// Repeating Texture
// Create a pixi instance
const width = 800;
const height = 400;
const app = new PIXI.Application({ width, height });
document.body.appendChild(app.view);
// Create the container that we will apply the shader to
var container = new PIXI.Container();
app.stage.addChild(container);


// Bring in some images
const spriteForShader = new PIXI.Sprite.from('https://assets.codepen.io/292864/internal/avatars/users/default.png?fit=crop&format=auto&height=512&version=1&width=512')
spriteForShader.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
// This image is a random image from imgur (which has CORS enabled so Codepen can grab it)
const skyrimComic = new PIXI.Sprite.from('https://i.imgur.com/6BheBL1.jpeg')
// Note: The container must be rendering something in order for the shader to show,
// which is why we add this sprite to it.  It is a different sprite than spriteForShader
// to prove that the shader is rendering the spriteForShader ONLY via the texture uniform
// and not because it's a child.  Try removing the filter to see what it looks like without the
// shader applied
container.addChild(skyrimComic);

var shaderCode = `
  varying vec2 vTextureCoord;
  uniform sampler2D uTexture;

  void main(void) {
    // The size of the texture in the uniform
    vec2 texSize = vec2(64.0,64.0);
    // the size of the space the texture is rendering onto
    vec2 sourceSize = vec2(${width}.0, ${height}.0);
    vec2 coord = vTextureCoord * (sourceSize / texSize);
    gl_FragColor = texture2D(uTexture, coord);
    // Set the red to 0 just to show that the shader is having an effect
    // this will make the texture render without any red
    gl_FragColor.r = 0.0;
  }
`;
var uniforms = {
      // Pass the texture to the shader uniform
      // "uTexture" could be named whatever you want
      uTexture: spriteForShader.texture
}
var simpleShader = new PIXI.Filter('',shaderCode,uniforms);
container.filters = [simpleShader]
```