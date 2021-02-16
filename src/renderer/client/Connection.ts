export class Connection {
    private readonly _socket: WebSocket;
    private _closed: boolean = false;
    private _connectFailed: boolean = false;
    private onScoreUpdate: any;
    private onConnectionClose: any;

    get socket(): WebSocket {
        return this._socket;
    }

    get closed(): boolean {
        return this._closed;
    }

    get connectFailed(): boolean {
        return this._connectFailed;
    }

    constructor(onScoreUpdate: any, onConnectionClose: any, nick: string) {
        this.onScoreUpdate = onScoreUpdate;
        this.onConnectionClose = onConnectionClose;

        this._socket = new WebSocket('ws://vht11.tk:8080');
        this._socket.addEventListener('open', function (this: Connection) {
            this._socket.send(JSON.stringify({
                nickname: nick
            }));
        }.bind(this));
        this._socket.addEventListener('message', function (event) {
            const json = JSON.parse(event.data);
            if (json.type == "update") {
                onScoreUpdate(json.player, json.score);
            } else if (json.type == "bulkUpdate") {
                const arr: any[] = json.data as any[];
                for (let i = 0; i < arr.length; i++) {
                    onScoreUpdate(arr[i].player, arr[i].score);
                }
            } else if (json.type == "quit") {
                onScoreUpdate(json.player, -1);
            }
        });
        this._socket.addEventListener('close', function (this: Connection) {
            this._closed = true;
            onConnectionClose();
        }.bind(this));
        this._socket.addEventListener('error', function (this: Connection) {
            this._closed = true;
            this._connectFailed = true;
            onConnectionClose();
        }.bind(this));
    }
}
