import {Client} from "./client/Client";

let activeSection: Element | null;
const onOpenSection: any = {};

function openSection(id: string | null) {
    if(id != null) {
        closeSection();
        activeSection = document.getElementById(id);
        if(activeSection != null) {
            activeSection.classList.remove("hidden");
            if(onOpenSection.hasOwnProperty(id)){
                onOpenSection[id].call();
            }
        }
    }
}

function closeSection(){
    if(activeSection != null) {
        activeSection.classList.add("hidden");
    }
}

function addClickEvent(elem: Element | null, callback: any){
    if(elem != null) {
        elem.addEventListener("click", callback);
    }
}

onOpenSection["multiplayer-join"] = function () {
    const log = document.getElementById("join-form-log");
    if(log != null) {
        log.innerHTML = "";
    }
};

Array.from(document.querySelectorAll("*[data-open-section]")).forEach((el) => {
    addClickEvent(el, function (){
        openSection(el.getAttribute("data-open-section"));
    });
});

let client: Client | null = null;

addClickEvent(document.getElementById("btn-offline-play"), function () {
    closeSection();
    client = new Client(null, function () {
        client = null;
        openSection("main-menu");
    });
    client.start();
});

addClickEvent(document.getElementById("join-submit"), function () {

});

openSection("main-menu");
