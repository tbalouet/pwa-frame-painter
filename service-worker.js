// Use of this source code is governed by an Apache license that can be
// found in the LICENSE file.

//cacheVersion needs to be updated at each code iteration,
//in order to replace the former cache in the browser
var cacheVersion = 'PWA-Frame-Painter-v3';

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
  '/public/js/qrcode.min.js',
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
    caches.open(cacheVersion).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    }).catch(function(err){
      console.log("Error in installing SW", err);
    })
  );
});

/**
 * Activation happens once the installation is done
 * it allows to take care of old cache by checking the cacheVersion
 */
self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    //Retrieve all the caches
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        //Compare every cache returned to the actual cacheVersion
        cacheNames.map(function(aCache) {
          if (aCache !== cacheVersion) {
            console.log('[ServiceWorker] Removing old cache', aCache);
            return caches.delete(aCache);
          }
        })
      );
    }).catch(function(err){
      console.log("Error in activating SW", err);
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
  // console.log('[ServiceWorker] Fetch', event.request.url);
  // event.respondWith(
  //   caches.match(event.request).then(function(response) {
  //     return response || fetch(event.request);
  //   })
  // );
  event.respondWith(
    caches.open(cacheVersion).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone()).catch((err) => {
            console.log("[Error in adding to cache]", err);
          });
          return response;
        }).catch((err) => {
          console.log("[Error in fetching response]", err);
        });
      }).catch((err) => {
        console.log("[Error in matching cache]", err);
      });
    }).catch((err) => {
      console.log("[Error in resolving fetch]", err);
    }));
});