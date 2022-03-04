export interface Vec2 {
  x: number;
  y: number;
}


export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  AI_melee,
  AI_bishop,
  AI_rook,
  AI_reach,
  AI_summoner,
  AI_demon,
  AI_priest,
  AI_poisoner,
  PLAYER_CONTROLLED,
}

export enum Faction {
  PLAYER,
  ENEMY,
}


// The order of the verticies (which is prev and which is next)
// is important because that determines what is INSIDE the polygon and OUTSIDE.
// For example, given the pseudo vertex:
// {prev: {x:0, y:1}, x:0,y:0, next: {x:1,y:0}}
// This vertex has an INSIDE angle of 45 degrees and an OUTSIDE angle of 
// 315.  This can be determined by taking the angle of the edge from 
// the vertex's Vec2 to prev and finding the angle to the edge from the Vec2 to next.
// The ordering of these is important so that a Polygon made up of Vertexes maintains
// a sense of inside and outside
export type Vertex = Vec2 & { prev: Vertex, next: Vertex };

// For the purposes of this usage, Polygons are closed, non self-intersecting,
// made up of verts which act like a doubly-linked list.  The polygon can be traced
// by starting from the startVertex and walking .next.next.next until you arrive
// back at the first vertex.
export interface Polygon {
  startVertex: Vertex;
  length: number;
}