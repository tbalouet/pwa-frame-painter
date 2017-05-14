// Use of this source code is governed by an Apache license that can be
// found in the LICENSE file.

//cacheVersion needs to be updated at each code iteration,
//in order to replace the former cache in the browser
const CACHE_VERSION = 5;
const CURRENT_CACHES = {
  'PWA-Frame-Painter' : 'PWA-Frame-Painter-v' + CACHE_VERSION,
  'post-message'      : 'post-message-cache-v' + CACHE_VERSION
};

//List of the files representing the App shell
//i.e. what's needed for the app to launch
var filesToCache = [
  //scripts
  '/',
  '/index.html',
  '/manifest.json',
  '/public/js/script.js',
  '/public/js/aframe.min.js',
  '/public/js/a-painter-loader-component.min.js',
  '/public/js/qrcode.js',
  '/public/styles/inline.css',
  //images
  'public/assets/icons/favicon.ico',
  'public/assets/icons/icon-32x32.png',
  'public/assets/icons/icon-128x128.png',
  'public/assets/icons/icon-256x256.png',
  'public/assets/icons/ic_add_white_24px.svg',
  'public/assets/icons/qrcode.gif',
  'public/assets/icons/gallery.png',
  //models
  'https://cdn.aframe.io/link-traversal/models/ground.json'
];

/**
 * Installation is used to download the app shell,
 * files which are needed for the basic features to show
 */
self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CURRENT_CACHES['PWA-Frame-Painter']).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    }).catch(function(err){
      console.log("[ServiceWorker] Error in installing SW", err);
    })
  );
});

/**
 * Activation happens once the installation is done
 * it allows to take care of old cache by checking the cacheVersion
 */
self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate');

  var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    //Retrieve all the caches
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch(function(err){
      console.log("[ServiceWorker] Error in activating SW", err);
    })
  );
  //fixes a corner case in which the app wasn't returning the latest data
  return self.clients.claim();
});

/**
 * Evaluate Web fetch requests, search for them in the cache
 * or use fetch to get a copy from the network
 */
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CURRENT_CACHES['PWA-Frame-Painter']).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone()).catch((err) => {
            console.log("[ServiceWorker] Error in adding to cache", err);
          });
          return response;
        }).catch((err) => {
          console.log("[ServiceWorker] Error in fetching response", err);
        });
      }).catch((err) => {
        console.log("[ServiceWorker] Error in matching cache", err);
      });
    }).catch((err) => {
      console.log("[ServiceWorker] Error in resolving fetch", err);
    }));
});

/**
 * Handles the message events from the client to save images
 * Inspired by https://github.com/GoogleChrome/samples/tree/gh-pages/service-worker/post-message
 * @param  {[type]} event) 
 * @return {[type]}        [description]
 */
self.addEventListener('message', function(event) {
  console.log('[ServiceWorker] Handling message event:', event);
  var p = caches.open(CURRENT_CACHES['post-message']).then(function(cache) {
    switch (event.data.command) {
      case 'get':
        caches.open(CURRENT_CACHES['post-message']).then(function(cache) {
          return cache.match(event.data.url).then(function (response) {
            console.log("[ServiceWorker] response from post-message for " + event.data.url, response);
            event.ports[0].postMessage({
              file : response
            });
          }).catch((err) => {
            event.ports[0].postMessage({
              error: err.toString()
            });
          });
        }).catch((err) => {
          event.ports[0].postMessage({
            error: err.toString()
          });
        });
        break;
      
      // This command adds a new request/response image pair to the cache.
      case 'add':
        var request = new Request(event.data.url, {mode: 'no-cors'});
        var init = {
            status     : 200,
            statusText : "OK",
            headers    : {'Content-Type': 'image/png'}
        };

        var response = new Response(event.data.file, init);
        return cache.put(event.data.url, response).then(function() {
          event.ports[0].postMessage({
            error: null
          });
        });
        break;

      // This command removes a request/response pair from the cache (assuming it exists).
      case 'delete':
        return cache.delete(event.data.url).then(function(success) {
          event.ports[0].postMessage({
            error: (success ? null : 'Item was not found in the cache.')
          });
        });
        break;

      default:
        // This will be handled by the outer .catch().
        throw Error('Unknown command: ' + event.data.command);
    }
  }).catch(function(error) {
    // If the promise rejects, handle it by returning a standardized error message to the controlled page.
    console.error('[ServiceWorker] Message handling failed:', error);

    event.ports[0].postMessage({
      error: error.toString()
    });
  });

  // Beginning in Chrome 51, event is an ExtendableMessageEvent, which supports
  // the waitUntil() method for extending the lifetime of the event handler
  // until the promise is resolved.
  if ('waitUntil' in event) {
    event.waitUntil(p);
  }

  // Without support for waitUntil(), there's a chance that if the promise chain
  // takes "too long" to execute, the service worker might be automatically
  // stopped before it's complete.
});