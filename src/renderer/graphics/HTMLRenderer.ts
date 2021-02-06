import * as PIXI from 'pixi.js';
import html2canvas from "html2canvas";

global.PIXI = PIXI;

export class HTMLRenderer {
    private static createDummyCanvas(code: string, callback: any) {
        const dummy = document.createElement("div");
        dummy.innerHTML = code;
        let container = document.getElementById("dummy-canvas-container");
        if(container == null) {
            container = document.createElement("div");
            container.id = "dummy-canvas-container";
            document.body.appendChild(container);
        }
        container.prepend(dummy);

    //    setTimeout(function () {
            html2canvas(dummy, {
                useCORS: true,
                backgroundColor: null,
                logging: false
            }).then(function(canvas) {
                dummy.remove();
                callback.call(undefined, canvas);
            });
      //  }, 500)
    }

    public static createTexture(code: string, callback: any){
        this.createDummyCanvas(code, function (this : HTMLRenderer, canvas : HTMLCanvasElement) {
            callback.call(undefined, PIXI.Texture.from(canvas.toDataURL()))
        });
    }
}
