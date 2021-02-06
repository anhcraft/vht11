export class RenderEvents {
    get onTick(): any {
        return this._onTick;
    }

    set onTick(value: any) {
        this._onTick = value;
    }

    get onPickChoice(): any {
        return this._onPickChoice;
    }

    set onPickChoice(value: any) {
        this._onPickChoice = value;
    }

    get onPickCard(): any {
        return this._onPickCard;
    }

    set onPickCard(value: any) {
        this._onPickCard = value;
    }

    get onSubmitCount(): any {
        return this._onSubmitCount;
    }

    set onSubmitCount(value: any) {
        this._onSubmitCount = value;
    }

    get onSelectPoint(): any {
        return this._onSelectPoint;
    }

    set onSelectPoint(value: any) {
        this._onSelectPoint = value;
    }

    get onFillingBlank(): any {
        return this._onFillingBlank;
    }

    set onFillingBlank(value: any) {
        this._onFillingBlank = value;
    }

    get onPlayOffline(): any {
        return this._onPlayOffline;
    }

    set onPlayOffline(value: any) {
        this._onPlayOffline = value;
    }

    get onPlayOnline(): any {
        return this._onPlayOnline;
    }

    set onPlayOnline(value: any) {
        this._onPlayOnline = value;
    }

    get onJoinGroup(): any {
        return this._onJoinGroup;
    }

    set onJoinGroup(value: any) {
        this._onJoinGroup = value;
    }

    get onCreateGroup(): any {
        return this._onCreateGroup;
    }

    set onCreateGroup(value: any) {
        this._onCreateGroup = value;
    }

    private _onTick: any = function() {};
    private _onPickChoice: any = function() {};
    private _onPickCard: any = function() {};
    private _onSubmitCount: any = function() {};
    private _onSelectPoint: any = function() {};
    private _onFillingBlank: any = function() {};
    private _onPlayOffline: any = function() {};
    private _onPlayOnline: any = function() {};
    private _onJoinGroup: any = function() {};
    private _onCreateGroup: any = function() {};
}
