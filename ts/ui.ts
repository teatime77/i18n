import { Vec2 } from "./vector";

export interface AbstractUIAttr {
    colSpan? : number;
    rowSpan? : number;
}

export abstract class AbstractUI {
    colSpan? : number;
    rowSpan? : number;
    colIdx!  : number;
    rowIdx!  : number;
    minSize  : Vec2 = Vec2.zero();

    abstract getPosition() : Vec2;
    abstract setPosition(position : Vec2) : void;

    getColSpan() : number {
        return this.colSpan ?? 1;
    }

    getRowSpan() : number {
        return this.rowSpan ?? 1;
    }
}
