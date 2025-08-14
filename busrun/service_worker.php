<?php
include "./version.php";

define("BUSRUN_APP_ID", "busrun");

header("Content-Type: text/javascript");
?>
var files_to_cache = [
        "/",
        "/main.js?v=<?php print BUSRUN_VERSION ?>",
        "/assets.css?v=<?php print BUSRUN_VERSION ?>",
        "/apple-touch-icon.webp",
        "/maskable_icon.webp",
        "/favicon.ico"
    ];

var new_cache_name = "<?php print BUSRUN_APP_ID."_v".BUSRUN_VERSION ?>";

self.addEventListener("install", function (evt) {
    evt.waitUntil(
        caches.open(new_cache_name).then(function (cache) {
            return cache.addAll(files_to_cache);
        })
    );
});

self.addEventListener("fetch", function (evt) {
    evt.respondWith(
        caches.match(evt.request).then(function (response) {
            if (response) {
                return response;
            }
            
            return fetch(evt.request);
        })
    );
});

self.addEventListener("activate", function (evt) {
    evt.waitUntil(
        caches.keys().then(function (cache_names) {
            return Promise.all(cache_names.map(function (cache_name) {
                if (cache_name !== new_cache_name) {
                    return caches.delete(cache_name);
                }
            }));
        })
    );
});
