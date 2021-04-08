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
  disconnected: {
    imageName: 'images/disconnected.png',
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
  headband: {
    imageName: 'images/headband.png',
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
  ownCharacterMarker: {
    imageName: 'images/units/unit-underline.png',
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
