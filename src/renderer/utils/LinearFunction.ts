import {Vector} from "./Vector";

type Restriction =
    'X_UPPER'       // Gioi han cuc dai X
    | 'X_LOWER'     // Gioi han cuc tieu X
    | 'Y_UPPER'     // Gioi han cuc dai Y
    | 'Y_LOWER'     // Gioi han cuc tieu Y
    | 'NONE';

export class LinearFunction extends Vector {
    public eval(x: number, ...restrictions: Restriction[]): number {
        if(restrictions.includes('X_UPPER')) {
            x = Math.min(x, Math.max(this.begin.x, this.end.x));
        }
        if(restrictions.includes('X_LOWER')) {
            x = Math.max(x, Math.min(this.begin.x, this.end.x));
        }
        // lap phuong trinh duong thang
        let y = (this.end.y - this.begin.y) * (x - this.begin.x) / (this.end.x - this.begin.x) + this.begin.y;
        if(restrictions.includes('Y_UPPER')) {
            y = Math.min(y, Math.max(this.begin.y, this.end.y));
        }
        if(restrictions.includes('Y_LOWER')) {
            y = Math.max(y, Math.min(this.begin.y, this.end.y));
        }
        return y;
    }
}
