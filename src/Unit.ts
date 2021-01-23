import {UNIT_BASE_HEALTH} from './config'
import type Grid from './Game'

export default class Unit {
    x:number;
    y:number;
    health:number = UNIT_BASE_HEALTH;
    alive = true;
    grid: Grid;

    constructor(x:number, y:number, grid: Grid){
        this.x = x;
        this.y = y;
        this.grid = grid;
    }
    move(dx:number, dy:number){
        
    }
}