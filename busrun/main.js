/* バスルン main.js */


const BUSRUN_INDEXEDDB_VERSION = 250801;


function get_default_config () {
    return {
        "busrun_version" : BUSRUN_VERSION,
        "refresh_interval" : 5,
        "operation_data_cache_period" : 7
    };
}

function save_config () {
    localStorage.setItem("busrun_config", JSON.stringify(config));
}

var config = {};
(function () {
    var config_json = localStorage.getItem("busrun_config");
    
    if (config_json !== null) {
        config = JSON.parse(config_json);
    }
    
    if (config["busrun_version"] !== BUSRUN_VERSION) {
        var default_config = get_default_config();
        
        config = Object.assign({}, default_config, config);
        
        Object.keys(config).forEach(function (key) {
            if (!(key in default_config)) {
                delete config[key];
            }
        });
        
        config["busrun_version"] = BUSRUN_VERSION;
        
        save_config();
    }
}());


function get_timestamp () {
    return Math.floor(Date.now() / 1000);
}

function get_date_string (ts) {
    var dt = new Date((ts - 14400) * 1000);
    return dt.getFullYear() + "-" + ("0" + String(dt.getMonth() + 1)).slice(-2) + "-" + ("0" + dt.getDate()).slice(-2);
}


var message_area_elm = document.getElementById("message_area");
var message_elm_list = [];

function mes (message_text, is_error = false, display_time = 10) {
    var box_elm = document.createElement("div");
    
    box_elm.innerText = message_text;
    
    var close_button_elm = document.createElement("button");
    
    box_elm.appendChild(close_button_elm);
    close_button_elm.className = "message_close_button";
    close_button_elm.onclick = function () {
        delete_mes(box_elm);
    }
    
    if (is_error) {
        box_elm.className = "error_message";
        
        console.error(BUSRUN_APP_NAME + ": " + message_text);
        
        if (message_elm_list.length >= 1 && message_elm_list[message_elm_list.length - 1].innerText === message_text) {
            delete_mes(message_elm_list[message_elm_list.length - 1]);
        }
    }
    
    if (message_elm_list.length >= 3) {
        delete_mes(message_elm_list[0]);
    }
    
    message_area_elm.prepend(box_elm);
    message_elm_list.push(box_elm);
    
    setTimeout(delete_mes, display_time * 1000, box_elm);
}

function delete_mes (box_elm) {
    var message_index = message_elm_list.indexOf(box_elm);
    
    if (message_index !== -1) {
        message_area_elm.removeChild(box_elm);
        message_elm_list.splice(message_index, 1);
    }
}


function idb_start_transaction (tables, writable, callback_func) {
    var open_request = indexedDB.open("busrun_caches", BUSRUN_INDEXEDDB_VERSION);
    
    open_request.onsuccess = function () {
        if (writable) {
            var transaction = open_request.result.transaction(tables, "readwrite");
        } else {
            var transaction = open_request.result.transaction(tables, "readonly");
        }
        
        open_request.result.close();
        
        callback_func(transaction);
    };
}

var db_open_promise = new Promise(function (resolve, reject) {
    var open_request = indexedDB.open("busrun_caches", BUSRUN_INDEXEDDB_VERSION);
    
    open_request.onerror = function () {
        mes("IndexedDBの初期化に失敗したため、" + BUSRUN_APP_NAME + "は正常に動作できません", true);
    };
    
    open_request.onupgradeneeded = function () {
        var db = open_request.result;
        
        var object_store_names = [...db.objectStoreNames];
        
        if (!object_store_names.includes("agency_info")) {
            db.createObjectStore("agency_info", {keyPath : "agency_id"});
        }
        if (!object_store_names.includes("vehicle_icons")) {
            db.createObjectStore("vehicle_icons", {keyPath : "agency_id"});
        }
        if (!object_store_names.includes("vehicles")) {
            db.createObjectStore("vehicles", {keyPath : "agency_id"});
        }
        if (!object_store_names.includes("diagram_revisions")) {
            db.createObjectStore("diagram_revisions", {keyPath : "agency_id"});
        }
        if (!object_store_names.includes("stop_info")) {
            db.createObjectStore("stop_info", {keyPath : ["agency_id", "diagram_revision"]});
        }
        if (!object_store_names.includes("route_info")) {
            db.createObjectStore("route_info", {keyPath : ["agency_id", "diagram_revision"]});
        }
        if (!object_store_names.includes("diagram_info")) {
            db.createObjectStore("diagram_info", {keyPath : ["agency_id", "diagram_revision"]});
        }
        if (!object_store_names.includes("operation_tables")) {
            db.createObjectStore("operation_tables", {keyPath : ["agency_id", "diagram_revision", "service_id"]});
        }
        if (!object_store_names.includes("timetables")) {
            db.createObjectStore("timetables", {keyPath : ["agency_id", "diagram_revision", "service_id"]});
        }
        if (!object_store_names.includes("stop_timetables")) {
            db.createObjectStore("stop_timetables", {keyPath : ["agency_id", "diagram_revision", "service_id", "stop_id"]});
        }
        if (!object_store_names.includes("operation_data")) {
            var operation_data_store = db.createObjectStore("operation_data", {keyPath : ["agency_id", "operation_date"]});
            operation_data_store.createIndex("idx_od1", "operation_date");
        }
    };
    
    open_request.onsuccess = function () {
        var transaction = open_request.result.transaction("operation_data", "readwrite");
        open_request.result.close();
        
        var operation_data_store = transaction.objectStore("operation_data");
        var idx_od1 = operation_data_store.index("idx_od1");
        
        var cursor_request = idx_od1.openCursor(IDBKeyRange.upperBound(get_date_string(get_timestamp() - 10800 - 86400 * (config["operation_data_cache_period"])), true), "next");
        
        cursor_request.onsuccess = function () {
            var cursor = cursor_request.result;
            
            if (cursor !== null) {
                operation_data_store.delete([cursor.value["agency_id"], cursor.value["operation_date"]]);
                cursor.continue();
            }
            
            resolve();
        };
    };
});


function ajax_post (end_point_name, query_str, callback_func, timeout = 30) {
    var ajax_request = new XMLHttpRequest();
    ajax_request.onloadend = function () {
        if (ajax_request.responseText.substring(0, 6) === "ERROR:") {
            mes(ajax_request.responseText, true);
            callback_func(false, null);
        } else if (ajax_request.status === 0) {
            mes("ERROR: ネットワークが不安定です", true);
            callback_func(false, null);
        } else if (ajax_request.status !== 200) {
            mes("ERROR: データの取得に失敗しました(" + ajax_request.status + ")", true);
            callback_func(false, null);
        } else {
            callback_func(ajax_request.responseText, ajax_request.getResponseHeader("last-modified"));
        }
    };
    
    ajax_request.open("POST", "/api/" + end_point_name, true);
    ajax_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
    ajax_request.timeout = timeout * 1000;
    ajax_request.send(query_str);
}


function escape_html (text) {
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function add_slashes (text) {
    return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "\\\"");
}

function convert_to_html (text) {
    var split_text = escape_html(text).replace(/https?:\/\/[^\s\\`\|\[\]\{\}\^]+/g, "<a href='$&' target='_blank' class='external_link'>$&</a>").split("\n");
    
    for (var cnt = 0; cnt < split_text.length; cnt++) {
        if (split_text[cnt].substring(0, 2) === "# ") {
            split_text[cnt] = "<h4>" + split_text[cnt].substring(2) + "</h4>";
        } else if (cnt + 1 < split_text.length && split_text[cnt + 1].substring(2) !== "# ") {
            split_text[cnt] += "<br>";
        }
    }
    
    return split_text.join("");
}


function change_title (title_text, url = null) {
    document.getElementsByTagName("title")[0].innerText = title_text;
    
    if (url !== null && url !== location.pathname + location.hash) {
        history.pushState(null, "", url);
    }
}


var instance_info;

function update_instance_info () {
    change_title(instance_info["instance_name"]);
    document.getElementById("header_instance_name").innerText = instance_info["instance_name"];
    document.getElementById("menu_instance_name").innerText = instance_info["instance_name"];
    document.getElementById("menu_reload_button").innerText = instance_info["instance_name"];
    
    var menu_manual_button_elm = document.getElementById("menu_manual_button");
    if ("manual_url" in instance_info) {
        menu_manual_button_elm.style.display = "block";
        menu_manual_button_elm.setAttribute("href", instance_info["manual_url"]);
    } else {
        menu_manual_button_elm.style.display = "none";
    }
    
    if (location.pathname === "/") {
        document.getElementById("splash_screen_instance_name").innerText = instance_info["instance_name"];
    }
}

(function () {
    var instance_info_json = localStorage.getItem("busrun_instance_info");
    
    if (instance_info_json !== null) {
        instance_info = JSON.parse(instance_info_json);
        
        var last_modified_timestamp_q = "last_modified_timestamp=" + instance_info["last_modified_timestamp"];
    } else {
        instance_info = {
            instance_name : BUSRUN_APP_NAME
        };
        
        var last_modified_timestamp_q = null;
    }
    
    update_instance_info();
    
    if (navigator.onLine) {
        ajax_post("instance_info.php", last_modified_timestamp_q, function (response, last_modified) {
            if (response !== false && response !== "NO_UPDATES_AVAILABLE") {
                instance_info = JSON.parse(response);
                
                var last_modified_date = new Date(last_modified);
                instance_info["last_modified_timestamp"] = Math.floor(last_modified_date.getTime() / 1000);
                
                localStorage.setItem("busrun_instance_info", JSON.stringify(instance_info));
                
                update_instance_info();
            }
        });
    }
}());


var splash_screen_elm = document.getElementById("splash_screen");


var agencies = null;

function get_agency_list (callback_func) {
    if (agencies !== null) {
        callback_func(agencies, true);
        
        return;
    }
    
    var cache_json = localStorage.getItem("busrun_agencies_cache");
    
    if (cache_json !== null) {
        agencies = JSON.parse(cache_json);
    } else {
        agencies = {
            agencies : {},
            categories : [],
            last_modified_timestamp : 0
        };
    }
    
    if (navigator.onLine) {
        if (agencies["categories"].length >= 1) {
            callback_func(agencies, false);
        }
        
        ajax_post("agencies.php", "last_modified_timestamp=" + agencies["last_modified_timestamp"], function (response, last_modified) {
            if (response !== false && response !== "NO_UPDATES_AVAILABLE") {
                agencies = JSON.parse(response);
                
                var last_modified_date = new Date(last_modified);
                agencies["last_modified_timestamp"] = Math.floor(last_modified_date.getTime() / 1000);
                
                localStorage.setItem("busrun_agencies_cache", JSON.stringify(agencies));
            }
            
            callback_func(agencies, true);
        }, 10);
    } else {
        callback_func(agencies, true);
    }
}

var agency_list_area;
var agency_links_area;

function update_agency_list (agencies, area_elm = null, loading_completed = true) {
    if (area_elm !== null) {
        agency_list_area = area_elm;
    } else {
        area_elm = agency_list_area;
    }
    
    var categories_html = "";
    var agency_links_html = "";
    var heading_cnt = 0;
    
    for (var category of agencies["categories"]) {
        var category_html = " style='color: " + category["category_color"] + ";'><b>" + escape_html(category["category_name"]) + "</b></";
        categories_html += "<li class='category_index' onclick='scroll_to_category(" + heading_cnt + ");'" + category_html + "li>";
        agency_links_html += "<h3 class='agencies_heading'" + category_html + "h3>";
        
        heading_cnt++;
        for (var agency_id of category["agencies"]) {
            var css_code = "background-color: " + agencies["agencies"][agency_id]["base_color"] + ";";
            if ("color_stripes" in agencies["agencies"][agency_id]) {
                var gradient_code = "";
                for (var stripe_data of agencies["agencies"][agency_id]["color_stripes"]) {
                    gradient_code += (gradient_code.length >= 1 ? "," : "") + " linear-gradient(to bottom, transparent 0% " + stripe_data["start"] + "%, " + stripe_data["color"] + " " + stripe_data["start"] + "% " + stripe_data["end"] + "%, transparent " + stripe_data["end"] + "% 100%)";
                }
                
                css_code += " background-image:" + gradient_code + ";";
            }
            
            agency_links_html += "<a href='/agency_" + agency_id + "/' onclick='event.preventDefault(); select_agency(\"" + agency_id + "\");' style='" + css_code + ";'><span>" + escape_html(agencies["agencies"][agency_id]["agency_name"]) + "</span></a>";
        }
    }
    
    if (!loading_completed) {
        categories_html += "<div class='loading_icon'></div>";
    } else if (agencies["categories"].length === 0) {
        agency_links_html = "<div class='no_data'>利用可能なデータがありません</div>";
    }
    
    area_elm.innerHTML = "<ul id='category_area'>" + categories_html + "</ul><div id='agency_links_area' onscroll='agency_links_area_onscroll();'>" + agency_links_html + "</div>";
    
    splash_screen_elm.className = "splash_screen_loaded";
    
    agency_links_area = document.getElementById("agency_links_area");
    
    agency_links_area_onscroll();
}

function scroll_to_category (index_val) {
    agency_links_area.scrollTop += document.getElementsByClassName("agencies_heading")[index_val].getBoundingClientRect().top - agency_links_area.getBoundingClientRect().top - 5;
}

function agency_links_area_onscroll () {
    var heading_elms = document.getElementsByClassName("agencies_heading");
    var index_elms = document.getElementById("category_area").getElementsByTagName("li");
    
    var agency_links_area_top = agency_links_area.getBoundingClientRect().top;
    
    for (var cnt = 0; cnt < heading_elms.length; cnt++) {
        if (heading_elms[cnt].getBoundingClientRect().top > agency_links_area_top) {
            index_elms[cnt].classList.add("active_index");
            
            break;
        }
        
        index_elms[cnt].classList.remove("active_index");
    }
    
    for (cnt++; cnt < heading_elms.length; cnt++) {
        index_elms[cnt].classList.remove("active_index");
    }
}


window.onload = function () {
    db_open_promise.then(function () {
        if (location.pathname.startsWith("/agency_")) {
            
        } else {
            get_agency_list(function (agencies, loading_completed) {
                update_agency_list(agencies, document.getElementById("splash_screen_inner"), loading_completed);
            });
        }
    });
};


var popup_background_elm = document.getElementById("popup_background");
var popup_history = [];
var square_popup_is_open = false;

function open_popup (id, title = null) {
    if (square_popup_is_open) {
        close_square_popup();
    }
    
    popup_background_elm.style.display = "block";
    
    var elm = document.getElementById(id);
    
    if (elm === null) {
        elm = document.createElement("div");
        elm.id = id;
        elm.className = "popup";
        
        var buf = "<button type='button' class='popup_close_button' onclick='popup_close();'></button>";
        
        if (title !== null) {
            buf += "<h2>" + title + "</h2>";
        }
        
        buf += "<div id='" + id + "_inner'></div>";
        
        elm.innerHTML = buf;
        
        document.getElementsByTagName("body")[0].appendChild(elm);
    }
    
    for (var cnt = 0; cnt < popup_history.length; cnt++) {
        document.getElementById(popup_history[cnt]).style.zIndex = cnt + 51;
        
        if (popup_history[cnt] === id) {
            popup_history.splice(cnt, 1);
            cnt--;
        }
    }
    
    popup_history.push(id);
    elm.style.zIndex = 50 + popup_history.length;
    
    if (!elm.classList.contains("popup_active")) {
        elm.classList.add("popup_active");
        
        menu_click(true);
    }
    
    history.pushState(null, "", location.pathname + "#" + id);
    
    return document.getElementById(id + "_inner");
}

function popup_close (close_all = false, update_url = true) {
    if (popup_history.length === 0) {
        return;
    }
    
    var id = popup_history.pop();
    
    if (popup_history.length === 0) {
        popup_background_elm.style.display = "none";
    }
    
    document.getElementById(id).classList.remove("popup_active");
    
    if (update_url) {
        if (popup_history.length >= 1) {
            history.replaceState(null, "", location.pathname + "#" + popup_history[popup_history.length - 1]);
        } else {
            history.replaceState(null, "", location.pathname);
        }
    }
    
    if (close_all && popup_history.length >= 1) {
        popup_close(true);
    }
}

var screen_elm = document.getElementById("popup_screen");
var wait_screen_elm = document.getElementById("wait_screen");

function open_square_popup (id, is_preview_popup = false, title = null) {
    if (square_popup_is_open) {
        close_square_popup();
    }
    
    screen_elm.className = "popup_screen_active";
    
    var elm = document.getElementById(id);
    
    if (elm === null) {
        elm = document.createElement("div");
        elm.id = id;
        
        if (is_preview_popup) {
            elm.className = "preview_popup";
        } else {
            elm.className = "square_popup";
        }
        
        var buf = "<button type='button' class='popup_close_button' onclick='close_square_popup();'></button>";
        
        if (title !== null) {
            buf += "<h3>" + title + "</h3>";
        }
        
        buf += "<div id='" + id + "_inner'></div>";
        
        elm.innerHTML = buf;
        
        screen_elm.appendChild(elm);
    }
    
    elm.classList.add("popup_active");
    
    popup_history.push(id);
    square_popup_is_open = true;
    
    history.pushState(null, "", location.pathname + "#" + id);
    
    return document.getElementById(id + "_inner");
}

function close_square_popup (update_url = true) {
    var id = popup_history.pop();
    
    screen_elm.className = "";
    document.getElementById(id).classList.remove("popup_active");
    
    square_popup_is_open = false;
    
    if (update_url) {
        if (popup_history.length >= 1) {
            history.replaceState(null, "", location.pathname + "#" + popup_history[popup_history.length - 1]);
        } else {
            history.replaceState(null, "", location.pathname);
        }
    }
    
    menu_click(true);
}

function open_wait_screen () {
    wait_screen_elm.style.display = "block";
    screen_elm.style.backgroundColor = "transparent";
}

function close_wait_screen () {
    wait_screen_elm.style.display = "none";
    screen_elm.style.backgroundColor = "";
}


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


function show_about () {
    var popup_inner_elm = open_popup("about_popup");
    
    var buf = "<img src='/apple-touch-icon.webp' alt='" + BUSRUN_APP_NAME + "' id='busrun_icon'>";
    buf += "<h2>" + escape_html(instance_info["instance_name"]) + "</h2>";
    
    if ("introduction_text" in instance_info) {
        buf += "<div class='long_text'>" + convert_to_html(instance_info["introduction_text"]) + "</div>";
    }
    
    if ("manual_url" in instance_info) {
        buf += "<div class='link_block'><a href='" + add_slashes(instance_info["manual_url"]) + "' target='_blank' class='external_link'>" + escape_html(instance_info["instance_name"]) + "の使い方</a></div>";
    }
    
    buf += "<h3>アプリケーション情報</h3>";
    buf += "<h4>" + BUSRUN_APP_NAME + " v" + BUSRUN_VERSION + "</h4>";
    buf += "<div class='link_block'><a href='" + BUSRUN_APP_INFO_URL + "' target='_blank' class='external_link'>" + BUSRUN_APP_NAME + "について</a></div>";
    buf += "<h5>ライセンス</h5>";
    buf += "<div class='informational_text'>" + BUSRUN_LICENSE_TEXT + "</div>";
    buf += "<h5>ソースコード</h5>";
    buf += "<div class='link_block'><a href='" + BUSRUN_REPOSITORY_URL + "' target='_blank' class='external_link'>" + BUSRUN_REPOSITORY_URL + "</a></div>";
    
    popup_inner_elm.innerHTML = buf;
}


function reload_app () {
    open_wait_screen();
    
    setTimeout(function () {
        if (location.pathname === "/") {
            location.reload();
        } else {
            location.pathname = "/";
        }
    }, 100);
}


window.onpopstate = function () {
    if (square_popup_is_open) {
        close_square_popup(false);
    } else if (popup_history.length >= 1) {
        popup_close(false, false);
    } else {
        if (location.pathname === "/") {
            reload_app();
            return;
        }
    }
};


if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service_worker.php");
}
