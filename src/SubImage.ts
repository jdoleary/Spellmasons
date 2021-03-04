import type { AnimatableProps } from './AnimationManager';
const BASE_PATH = 'images/';

export default class SubImage {
  element: HTMLImageElement;
  imageName: string;
  transform: AnimatableProps = {
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 100,
    scale: 1,
  };

  constructor(
    transform: AnimatableProps | null,
    width: number,
    height: number,
    imageName: string,
  ) {
    // NOTE: SubImage does not automatically get added to the DOM, the instantiator should add it
    // where necessary
    this.element = document.createElement('img');
    this.element.src = BASE_PATH + imageName;
    this.element.width = width;
    this.element.height = height;
    // Save image path in unit so it's accessible when loading gamestate
    this.imageName = imageName;
    if (transform) {
      Object.assign(this.transform, transform);
    }
    window.animationManager.setTransform(this.element, this.transform);
  }
  cleanup() {
    // Remove DOM element
    this.element?.remove();
  }
}
