export class Utils {
    public static randomRange(min: number, max: number) {
        if (min < max) {
            return ~~(Math.random() * (max - min + 1)) + min;
        } else {
            return ~~(Math.random() * (min - max + 1)) + max;
        }
    }

    public static shuffleArray(array: number[]): number[] {
        let m = array.length, t, i;

        while (m) {
            i = Math.floor(Math.random() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }

        return array;
    }

    public static arrayEquals(a: number[], b: number[]) {
        return a.length === b.length && a.every((val, index) => val === b[index]);
    }

    public static arrayEqualReversed(a: number[], b: number[]) {
        return a.length === b.length && a.every((val, index) => val === b[b.length - index - 1]);
    }

    public static safeMin(a: number | undefined, b: number) : number{
        return a === undefined ? b : Math.min(a, b);
    }

    public static safeMax(a: number | undefined, b: number) : number{
        return a === undefined ? b : Math.max(a, b);
    }
}
