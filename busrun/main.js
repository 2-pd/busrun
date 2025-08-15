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
                operation_data_store.delete([cursor.value["railroad_id"], cursor.value["operation_date"]]);
                cursor.continue();
            }
            
            resolve();
        };
    };
});



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
