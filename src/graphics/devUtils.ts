import type * as PIXI from 'pixi.js';
import { LineSegment } from '../jmath/lineSegment';
import floatingText from './FloatingText';
import { Vec2 } from '../jmath/Vec';

// document.body.addEventListener('mousemove', (e) => {
//   if (window.underworld) {


//     const mouseTarget = window.underworld.getMousePos();
//     if (window.t) {
//       const ts = window.t.sort((u, v) => distance(getCenterPoint(u.lineSegment), mouseTarget) - distance(getCenterPoint(v.lineSegment), mouseTarget));
//       const t1 = ts[0];
//       window.drawT(t1);
//     }
//   }

// });
export default function devUtils(graphics: PIXI.Graphics) {

    // const drawT = ({ lineSegment: line, polygon }, lineColor) => {
    //     window.debugDrawLineSegments(window.a5);
    //     window._debugDrawLineSegments(polygon, 0x00ff00);
    //     graphics.lineStyle(3, 0xff0000, 0.8);
    //     graphics.drawCircle(line.p1.x, line.p1.y, 2);
    //     graphics.drawCircle(line.p2.x, line.p2.y, 2);
    // }
    const _debugDrawLineSegments = (lines: LineSegment[], lineColor = 0x0000ff) => {
        for (let line of lines) {
            graphics.lineStyle(3, lineColor, 0.5);
            graphics.moveTo(line.p1.x, line.p1.y);
            graphics.lineTo(line.p2.x, line.p2.y);
            graphics.lineStyle(3, 0x00ffff, 0.5);
            graphics.drawCircle(line.p1.x, line.p1.y, 2);
            graphics.drawCircle(line.p2.x, line.p2.y, 2);

        }
    }
    const debugDrawLineSegments = (lines: LineSegment[]) => {
        graphics.clear();
        _debugDrawLineSegments(lines);
    }
    const debugDrawVec2s = (points: Vec2[]) => {
        const timeoutAdd = 500;//ms
        let timeout = 0;
        for (let point of points) {
            timeout += timeoutAdd;
            setTimeout(() => {
                floatingText({
                    coords: point,
                    text: '🎈',
                });

            }, timeout)

        }

    }
    return { debugDrawLineSegments, debugDrawVec2s }
}