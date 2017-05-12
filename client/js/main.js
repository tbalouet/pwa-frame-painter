// Use of this source code is governed by an Apache license that can be
// found in the LICENSE file.

(function(){
	"use strict";
  var Util = require("./util.js");
  //Handling the AFrame components in a different file for clarity
  require("./aframeComponents.js");

  window.onload = function(){
    /**
     * Check if there is a model URL in the address bar
     * If so, load the matching model
     */
    Util.extractFromUrl("url").then((url) => {
      if(url){
        let newModel = document.createElement("a-entity");
        newModel.setAttribute("a-painter-loader", "src:" + url);
        newModel.setAttribute("position", "0 0 -2");
        document.getElementsByTagName("a-scene")[0].appendChild(newModel);
      }
    }).catch((err) => {
      console.log("[Error] Error in loading APainting", err);
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then(function() { 
          console.log('Service Worker Registered');
        })
        .catch(function(err){ console.log("Error in registering Service Worker", err)});
    }
  };
})();