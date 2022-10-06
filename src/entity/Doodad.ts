import { HasSpace } from "./Type"
import * as Image from '../graphics/Image';

export function isDoodad(maybeDoodad: any): maybeDoodad is IDoodad {
    return maybeDoodad && maybeDoodad.type == 'doodad';
}
export type IDoodad = HasSpace & {
    type: 'doodad';
    image?: Image.IImageAnimated;
}