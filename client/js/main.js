// Use of this source code is governed by an Apache license that can be
// found in the LICENSE file.
(function(){
	"use strict";
  var Util         = require("./util.js");
  var ModelManager = require("./modelManager.js");

  //Handling the AFrame components in a different file for clarity
  require("./aframeComponents.js");

  //Create the modelManager to handle A-Painter models
  window.modelManager = new ModelManager();

  window.onload = function(){
    /**
     * Check if there is a model URL in the address bar
     * If so, load the matching model
     */
    Util.extractFromUrl("url").then((url) => {
      if(!url){
        document.getElementById("butGallery").classList.add("show");
        document.getElementById("loaderDiv").classList.remove('make-container--visible');
        document.getElementById("butGallery").title = "";
        document.getElementById("butFav").classList.add("hide");
      }
      else{
        document.getElementById("butGalleryTip").classList.add("hide");
        modelManager.loadModel(url);
      }
    }).catch((err) => {
      console.log("[Error] Error in loading APainting", err);
    });

    //Launch a Service Worker (if possible) for Offline handling
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then(function(data) { 
          console.log('Service Worker Registered');
        })
        .catch(function(err){ console.log("Error in registering Service Worker", err)});
    }
  };
})();