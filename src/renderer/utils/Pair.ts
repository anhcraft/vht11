export class Pair<A, B> {
    private _first: A;
    private _second: B;

    constructor(first: A, second: B) {
        this._first = first;
        this._second = second;
    }

    get second(): B {
        return this._second;
    }

    set second(value: B) {
        this._second = value;
    }

    get first(): A {
        return this._first;
    }

    set first(value: A) {
        this._first = value;
    }
}
