/** Overlay object model for text / shapes / annotations / freehand (§5.1). */

export interface BaseOverlay {
  id: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  draggable: boolean;
}

export interface TextOverlay extends BaseOverlay {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string; // "normal" | "bold" | "italic" | "italic bold"
  fill: string;
  align: "left" | "center" | "right";
  stroke: string;
  strokeWidth: number;
  shadow: boolean;
  width?: number;
}

export interface ShapeOverlay extends BaseOverlay {
  type: "rect" | "ellipse";
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export interface LineOverlay extends BaseOverlay {
  type: "line" | "arrow";
  points: number[]; // [x1,y1,x2,y2] relative to x,y
  stroke: string;
  strokeWidth: number;
}

export interface DrawOverlay extends BaseOverlay {
  type: "draw";
  points: number[]; // flat [x,y,...] relative to x,y
  stroke: string;
  strokeWidth: number;
}

export type Overlay = TextOverlay | ShapeOverlay | LineOverlay | DrawOverlay;

export type ToolId =
  | "adjust"
  | "filters"
  | "crop"
  | "blur"
  | "transform"
  | "resize"
  | "text"
  | "shapes"
  | "draw";

let counter = 0;
export function overlayId(prefix = "ov"): string {
  counter += 1;
  return `${prefix}-${counter}-${counter * 2654435761}`;
}
