import * as PIXI from 'pixi.js';
global.PIXI = PIXI;
const {mathjax} = require('mathjax-full/js/mathjax.js');
const {MathML} = require('mathjax-full/js/input/mathml.js');
const {SVG} = require('mathjax-full/js/output/svg.js');
const {liteAdaptor} = require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler} = require('mathjax-full/js/handlers/html.js');
require('mathjax-full/js/util/entities/all.js');

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const html = mathjax.document('', {
    InputJax: new MathML(),
    OutputJax: new SVG({
        fontCache: 'local'
    })
});

export class MathMLRenderer {
    private static normalize(input: string) : string {
        return input.substring(
            "<mjx-container class=\"MathJax\" jax=\"SVG\">".length,
            input.length - "</mjx-container>".length
        );
    }

    private static mml2svg(input : string) : string {
        const node = html.convert(input, {
            display: true,
            em: 3,
            ex: 5,
            containerWidth: 100
        });
        return this.normalize(adaptor.outerHTML(node));
    }

    public static mml2canvas(code: string) : string {
        const doc = new DOMParser().parseFromString(code, "text/html");
        const codes = doc.getElementsByClassName("mathml-code");
        for(let i = 0; i < codes.length; i++){
            const elem = codes[i];
            elem.innerHTML = MathMLRenderer.mml2svg(elem.innerHTML);
        }
        let out = new XMLSerializer().serializeToString(doc.documentElement);
        out = out.substring("<html xmlns=\"http://www.w3.org/1999/xhtml\"><head></head><body>".length);
        out = out.substring(0, out.length - ("</body></html>".length));
        return out;
    }
}
