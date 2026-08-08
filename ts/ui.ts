import { Vec2 } from "./vector";

export interface AbstractUIAttr {
    padding? : number | [number, number] | [number, number, number, number];
    colSpan? : number;
    rowSpan? : number;
}


export class Padding {
    left   : number;
    right  : number;
    top    : number;
    bottom : number;

    constructor(left : number, right : number, top : number, bottom : number){
        this.left  = left;
        this.right  = right;
        this.top    = top;
        this.bottom = bottom;
    }

    width() : number {
        return this.left + this.right;
    }

    height() : number {
        return this.top + this.bottom;
    }
}

export abstract class AbstractUI {
    colSpan? : number;
    rowSpan? : number;
    colIdx!  : number;
    rowIdx!  : number;
    minSize  : Vec2 = Vec2.zero();
    padding? : Padding;

    abstract getPosition() : Vec2;
    abstract setPosition(position : Vec2) : void;

    setMinSize() : void {        
    }

    layout(position : Vec2, size : Vec2, nest : number = 0) : void {        
    }

    getColSpan() : number {
        return this.colSpan ?? 1;
    }

    getRowSpan() : number {
        return this.rowSpan ?? 1;
    }

    copyFromUIAttr(data : AbstractUIAttr){
        if(data.padding !== undefined){
            if(typeof data.padding == "number"){
                this.padding = new Padding(data.padding, data.padding, data.padding, data.padding);
            }
            else if(data.padding.length == 2){
                this.padding = new Padding(data.padding[0], data.padding[0], data.padding[1], data.padding[1]);
            }
            else{
                this.padding = new Padding(... data.padding);
            }
        }
    }
}

export interface IGrid {
    columns : string[];
    rows    : string[];
    numCols : number;
    numRows : number;
    columnsPix : number[];
    rowsPix    : number[];

    absChildren() : AbstractUI[];
}
