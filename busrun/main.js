/* バスルン main.js */




function menu_click (force_close = false) {
    var menu_elm = document.getElementById("menu");
    var menu_button_elm = document.getElementById("menu_button");
    
    if (menu_elm.className === "menu_open" || force_close) {
        menu_elm.classList.remove("menu_open");
        menu_button_elm.classList.remove("menu_button_active");
    } else {
        menu_elm.classList.add("menu_open");
        menu_button_elm.classList.add("menu_button_active");
    }
}


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service_worker.php");
}
