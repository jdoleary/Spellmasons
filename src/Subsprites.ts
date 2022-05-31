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
  [key: string]: Subsprite;
}
const Subsprites: ISubsprites = {
  heavy_armor: {
    imageName: 'units/heavy_armor.png',
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
  disconnected: {
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
};
export default Subsprites;
