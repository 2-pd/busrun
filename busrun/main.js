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
    
    /*if (location.pathname === "/") {
        document.getElementById("splash_screen_instance_name").innerText = instance_info["instance_name"];
    }*/
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


window.onload = function () {
    db_open_promise.then(function () {
        
    });
};


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
