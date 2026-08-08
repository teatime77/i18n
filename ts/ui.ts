import { assert, sum } from "./util";
import { Vec2 } from "./vector";

function pixUI(s : string) : number {
    assert(s.endsWith("px"));
    return parseFloat(s.slice(0, -2));
}

export function ratioUI(s: string) : number {
    assert(s.endsWith("%"));
    return parseFloat(s.slice(0, -1)) / 100;
}

function ratioSum(ratioes : string[]) : number {
    const pix_nums = ratioes.map(x => ratioUI(x));
    return sum(pix_nums);
}

function minTotalSize(columns : string[], pix_sum : number, min_size : number) : number {
    const ratio_columns = columns.filter(x => x.endsWith("%"));
    if(ratio_columns.length == 0){
        return 0;
    }

    const ratio_sum = ratioSum(ratio_columns);

    if(min_size < pix_sum){
        return 0;
    }

    const ratio_pix = min_size - pix_sum;

    // grid-width * ratio_sum = ratio_pix
    return ratio_pix / ratio_sum;
}

export interface AbstractUIAttr {
    padding? : number | [number, number] | [number, number, number, number];
    colSpan? : number;
    rowSpan? : number;
    borderWidth? : number;
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

const UI_padding : Padding = new Padding(5, 5, 5, 5);
const UI_borderWidth : number = 5;

export abstract class AbstractUI {
    colSpan? : number;
    rowSpan? : number;
    colIdx!  : number;
    rowIdx!  : number;
    fixedSize? : Vec2;
    minSize  : Vec2 = Vec2.zero();
    netSize  : Vec2 = Vec2.zero();
    borderWidth? : number;
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

    getPadding() : Padding {
        return this.padding ?? UI_padding;
    }

    getBorderWidth() : number {
        return this.borderWidth !== undefined ? this.borderWidth : UI_borderWidth;
    }

    getPaddingBorderSize() : Vec2 {
        const padding = this.getPadding();
        const borderWidth = this.getBorderWidth();

        const width  = padding.width()  + 2 * borderWidth;
        const height = padding.height() + 2 * borderWidth;
        return Vec2.fromXY(width, height);
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

type AbstractGrid = AbstractUI & IGrid;

function getColumnsPix(grid : AbstractGrid){
    const pix_columns = new Array(grid.numCols).fill(0) as number[];

    for(const [col_idx, col] of grid.columns.entries()){
        if(col.endsWith("px")){
            pix_columns[col_idx] = pixUI(col);
        }
        else if(col == "*"){
            const col_children = grid.absChildren().filter(x => x.colIdx == col_idx && x.getColSpan() == 1);

            if(col_children.length != 0){
                pix_columns[col_idx] = Math.max(...col_children.map(x => x.minSize.x));
            }
        }
    }

    return pix_columns;
}

function getRowsPix(grid : AbstractGrid){
    const pix_rows = new Array(grid.numRows).fill(0) as number[];

    for(const [row_idx, row] of grid.rows.entries()){
        if(row.endsWith("px")){
            pix_rows[row_idx] = pixUI(row);
        }
        else if(row == "*"){
            const row_children = grid.absChildren().filter(x => x.rowIdx == row_idx && x.getRowSpan() == 1);

            if(row_children.length != 0){
                pix_rows[row_idx] = Math.max(...row_children.map(x => x.minSize.y));
            }
        }
    }

    return pix_rows;
}

export function setMinSizeGrid(grid : AbstractGrid) : void {
    assert(!isNaN(grid.numCols) && !isNaN(grid.numRows));

    grid.absChildren().forEach(x => x.setMinSize());

    if(grid.fixedSize !== undefined){

        grid.minSize.copyFrom(grid.fixedSize);
    }
    else{

        const padding_border_size : Vec2 = grid.getPaddingBorderSize();

        let max_grid_ratio_width  = 0;
        let max_grid_ratio_height = 0;

        grid.columnsPix = getColumnsPix(grid);
        grid.rowsPix    = getRowsPix(grid);

        for(const child of grid.absChildren()){
            const columns = grid.columns.slice(child.colIdx, child.colIdx + child.getColSpan());
            const pix_col_sum = sum(grid.columnsPix.slice(child.colIdx, child.colIdx + child.getColSpan()));
            max_grid_ratio_width = Math.max(max_grid_ratio_width, minTotalSize(columns, pix_col_sum, child.minSize.x));

            const rows = grid.rows.slice(child.rowIdx, child.rowIdx + child.getRowSpan());
            const pix_row_sum = sum(grid.rowsPix.slice(child.rowIdx, child.rowIdx + child.getRowSpan()));
            max_grid_ratio_height = Math.max(max_grid_ratio_height, minTotalSize(rows, pix_row_sum, child.minSize.y));
        }

        const grid_pix_width  = sum(grid.columnsPix);
        const grid_pix_height = sum(grid.rowsPix);

        grid.minSize.x = grid_pix_width  + max_grid_ratio_width  + padding_border_size.x;
        grid.minSize.y = grid_pix_height + max_grid_ratio_height + padding_border_size.y;
    }

    grid.netSize.copyFrom(grid.minSize);
}
