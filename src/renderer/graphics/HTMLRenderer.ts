import * as PIXI from 'pixi.js';
import html2canvas from "html2canvas";

global.PIXI = PIXI;

export class HTMLRenderer {
    private static createDummyCanvas(code: string, maxWidth: number, callback: any) {
        const dummy = document.createElement("div");
        dummy.style.width = maxWidth + "px";
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

    public static createTexture(code: string, maxWidth: number, callback: any){
        this.createDummyCanvas(code, maxWidth, function (this : HTMLRenderer, canvas : HTMLCanvasElement) {
            callback.call(undefined, PIXI.Texture.from(canvas.toDataURL()))
        });
    }
}
