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

onOpenSection["multiplayer-menu"] = function () {
    const nick = localStorage.getItem("last-nickname");
    if(nick != null) {
        (document.getElementById("nickname") as HTMLInputElement).value = nick;
    }
    const log = document.getElementById("join-form-log");
    if(log != null) {
        log.innerHTML = "";
        log.classList.add("hidden");
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
    client = new Client(false, "", function () {
        client = null;
        openSection("main-menu");
    });
    client.start();
});

addClickEvent(document.getElementById("join-submit"), function () {
    const nick = document.getElementById("nickname") as HTMLInputElement;
    const nickname = nick.value.trim();
    if(nickname.length > 15 || nickname.length < 1) {
        const log = document.getElementById("join-form-log");
        if(log != null) {
            log.innerHTML = "Biệt danh quá ngắn hoặc quá dài!";
            log.classList.remove("hidden");
        }
        return;
    }
    client = new Client(true, nickname, function () {
        if(client?.connection?.connectFailed) {
            openSection("multiplayer-menu");
            const log = document.getElementById("join-form-log");
            if(log != null) {
                log.innerHTML = "Đã có ai đó chọn biệt danh này!";
                log.classList.remove("hidden");
            }
        } else {
            openSection("main-menu");
        }
        client = null;
    });
    setTimeout(function () {
        if(!client?.connection?.connectFailed) {
            client?.start();
        } else {
            const log = document.getElementById("join-form-log");
            if(log != null) {
                log.innerHTML = "Kết nối máy chủ thất bại!";
                log.classList.remove("hidden");
            }
        }
    }, 3000)
});

openSection("main-menu");
