export interface Subsprite {
  imageName: string;
  alpha: number;
  anchor: {
    x: number;
    y: number;
  };
  scale: {
    x: number;
    y: number;
  };
}
export interface ISubsprites {
  [id: string]: Subsprite;
}

// Many subsprites are added automatically to this object 
// via registerModifiers / registerSpell
const Subsprites: ISubsprites = {
  heavy_armor: {
    imageName: 'heavy_armor.png',
    alpha: 1.0,
    anchor: {
      x: 0.5,
      y: 0.5,
    },
    scale: {
      x: 1,
      y: 1
    }
  },
  'disconnected.png': {
    imageName: 'disconnected.png',
    alpha: 1.0,
    anchor: {
      x: 0.5,
      y: 0.5,
    },
    scale: {
      x: 1,
      y: 1,
    },
  },
  "crown": {
    imageName: 'crown',
    alpha: 1.0,
    anchor: {
      x: -0.7,
      y: 3.0,
    },
    scale: {
      x: 0.5,
      y: 0.5,
    },
  }
};
export default Subsprites;
