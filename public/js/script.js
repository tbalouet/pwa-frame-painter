(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(){
  "use strict";

  /**
   * Loads and setup ground model.
   * @param  {[type]} ) {                 var objectLoader;      var object3D [description]
   * @return {[type]}   [description]
   */
  AFRAME.registerComponent('ground', {
    init: function () {
      var objectLoader;
      var object3D = this.el.object3D;
      var MODEL_URL = 'https://cdn.aframe.io/link-traversal/models/ground.json';
      if (this.objectLoader) { return; }
      objectLoader = this.objectLoader = new THREE.ObjectLoader();
      objectLoader.crossOrigin = '';
      objectLoader.load(MODEL_URL, function (obj) {
        obj.children.forEach(function (value) {
          value.receiveShadow = true;
          value.material.shading = THREE.FlatShading;
        });
        object3D.add(obj);
      });
    }
  });

  /**
   * Load the sky gradient for the skybox
   * @param  {[type]} 'skyGradient'   [description]
   * @param  {[type]} options.schema: {                                                       colorTop: {   type:            'color',      default: 'black', is:           'uniform' [description]
   * @param  {[type]} colorBottom:    {            type:         'color', default: 'red', is: 'uniform' }                                           }       [description]
   * @param  {[type]} vertexShader:   [                                                        'varying  vec3 vWorldPosition;' [description]
   * @param  {[type]} 'void           main(         [description]
   * @return {[type]}                 [description]
   */
  AFRAME.registerShader('skyGradient', {
    schema: {
      colorTop: { type: 'color', default: 'black', is: 'uniform' },
      colorBottom: { type: 'color', default: 'red', is: 'uniform' }
    },

    vertexShader: [
      'varying vec3 vWorldPosition;',

      'void main() {',

        'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
        'vWorldPosition = worldPosition.xyz;',

        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

      '}'

    ].join('\n'),

    fragmentShader: [
      'uniform vec3 colorTop;',
      'uniform vec3 colorBottom;',

      'varying vec3 vWorldPosition;',

      'void main()',

      '{',
        'vec3 pointOnSphere = normalize(vWorldPosition.xyz);',
        'float f = 1.0;',
        'if(pointOnSphere.y > - 0.2){',

          'f = sin(pointOnSphere.y * 2.0);',

        '}',
        'gl_FragColor = vec4(mix(colorBottom,colorTop, f ), 1.0);',

      '}'
    ].join('\n')
  });
})();
},{}],2:[function(require,module,exports){
var DBManager;
(function(){
  "use strict";

  /**
   * Object to handle data storage in an IndexedDB
   */
  DBManager = function(opts){
    var that                = this;

    this.tableArray         = opts.tableArray;
    let request             = window.indexedDB.open(opts.dbName, opts.dbVersion);
    request.onupgradeneeded = this.onUpgradeNeeded.bind(this);

    request.onsuccess       = function(event){
      that.db = event.target.result;
      opts.onCompleteCB(event);
    }
    
    //DB creation wasn't allowed or failed, we need fallback
    request.onerror         = function(event) {
      console.log("[DBManager] Error", event.target.error);
    };
  };

  /**
   * Function called to handle changes in the DB structure
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */
  DBManager.prototype.onUpgradeNeeded = function(event) {
    this.db = event.target.result;

    //Run through the tables to add them to the Database
    for(let key in this.tableArray){
      let aTable = this.tableArray[key];

      //Create an ObjectStore to handle models URLs
      let objModelStore = this.db.createObjectStore(aTable.name, { keyPath: aTable.keyPath });
      for(let i = 0, len = aTable.index.length; i < len; ++i){
        objModelStore.createIndex(aTable.index[i].name, aTable.index[i].name, { unique: aTable.index[i].unique });
      }
    }
  };

  /**
   * Function to browse the object store and deploy a function on each key value
   * @param  {string} tableName the name of the table to browse
   * @param  {func} cbFunc    the function to apply to each retrieved line
   */
  DBManager.prototype.browseObjStore = function(tableName, cbFunc){
    return new Promise((resolve, reject) => {
      if(!this.db){
        reject("DB wasn't initialized properly, aborting browsing");
      }

      let objStore = this.db.transaction(tableName).objectStore(tableName);

      //Reads all the entries in the model table and create icons to access it
      objStore.openCursor().onsuccess = function(event) {
        let cursor = event.target.result;
        if (cursor) {
          cbFunc(cursor.value);
          cursor.continue();
        }
        else{
          resolve(true);
        }
      };
    })
  };

  /**
   * Promise to check if a KeyPair already exists in a table
   * @param  {string} tableName name of the table
   * @param  {object} keyPair   object {key: ..., value: ...} defining what we're looking for
   * @return {[type]}           [description]
   */
  DBManager.prototype.getEntry = function(tableName, ssnKey){
    return new Promise((resolve, reject) => {
      if(!this.db){
        reject("DB wasn't initialized properly, aborting getEntry");
      }

      let objStore = this.db.transaction(tableName).objectStore(tableName);

      // get record by key from the object store
      let objStoreReq = objStore.get(ssnKey);

      objStoreReq.onsuccess = function(event) {
        resolve(event.target.result);
      };
      objStoreReq.onerror = function(event) {
        reject(event);
      };
    })
  }
})();

module.exports = DBManager;
},{}],3:[function(require,module,exports){
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
      modelManager.loadModel(url);
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
},{"./aframeComponents.js":1,"./modelManager.js":4,"./util.js":5}],4:[function(require,module,exports){
var ModelManager;

(function(){
  "use strict";
  var DBManager = require("./dbManager.js");
  var Util = require("./util.js");

  /**
   * Different types of Models saved in the Gallery container
   * @type {Object}
   */
  const TYPES = {
    "FEATURED" : 0,
    "RECENT"   : 1,
    "STARRED"  : 2
  }

  /**
   * Models to add to the featured one (should be extracted from online in the future)
   * @type {Array}
   */
  const featuredModels = [
    { ssn: "https://ucarecdn.com/3e089e07-be62-48e1-9f12-9a284c249e77/_0", url: "https://ucarecdn.com/3e089e07-be62-48e1-9f12-9a284c249e77/", thumb : "public/assets/images/3b717cf7.png", type: TYPES.FEATURED },
    { ssn: "https://ucarecdn.com/bacf6186-96b1-404c-9751-e955ece04919/_0", url: "https://ucarecdn.com/bacf6186-96b1-404c-9751-e955ece04919/", thumb : "public/assets/images/1400ac94.png", type: TYPES.FEATURED },
    { ssn: "https://ucarecdn.com/962b242b-87a9-422c-b730-febdc470f203/_0", url: "https://ucarecdn.com/962b242b-87a9-422c-b730-febdc470f203/", thumb : "public/assets/images/672110ca.png", type: TYPES.FEATURED },
  ];

  /**
   * Class to create the Models list DataBase
   * And to handle access to this list
   */
  ModelManager = function(){
    this.currentModel = undefined;
    this.dbStructure  = {
      dbName : "pwaFramePainterDB",
      dbVersion : 3,
      tableArray : [{
        name : "models",
        keyPath : "ssn",
        index : [
          { name : "url", unique : false},
          { name : "thumb", unique : false},
          { name : "type", unique : false},
        ],
      }],
      onCompleteCB : this.onDBReady.bind(this)
    };

    this.dbManager = new DBManager(this.dbStructure);
  };

  /**
   * Method to fill the database with the featured Models if this hasn't been done
   * @param  {[type]} event [description]
   * @return {[type]}       [description]
   */
  ModelManager.prototype.onDBReady = function(event) {
    console.log("[ModelManager] DB structure created, adding fixed values");
    this.registerData(featuredModels, false).catch((err) => {
      console.log("[ModelManager] Error in populating DB and Container", err);
    }).then(() => {
      return this.dbManager.browseObjStore(this.dbStructure.tableArray[0].name, this.addToContainer.bind(this));
    })
  };

  /**
   * Add an array of data in the object store
   * @param {[type]} dataArray [description]
   */
  ModelManager.prototype.registerData = function(dataArray){
    return new Promise((resolve, reject) => {
      var that = this;

      if(!this.dbManager.db){
        reject("DB wasn't initialized properly, aborting data registering");
      }

      let tableName = this.dbStructure.tableArray[0].name;
      let promArray = [];
      for (let i in dataArray) {
        let keyValue = dataArray[i].url + "_" + dataArray[i].type;

        promArray.push(this.dbManager.getEntry(this.dbStructure.tableArray[0].name, keyValue).then((val) => {
          //Check if entries already belong to the DB
          if(val === undefined){
            let objModelStore = that.dbManager.db.transaction(tableName, "readwrite").objectStore(tableName);
            let idbObject = objModelStore.add(dataArray[i]);
            idbObject.onerror = ((err) => {
              console.log("[ModelManager] Error in adding field", dataArray[i], err.target.error);
            });
          }
          return true;
        }));
      }
      //Wait for all data to be enter in the DB before resolving promise
      Promise.all(promArray).then(() => {
        resolve(true);
      })
    })
  };

  /**
   * Add data to the appropriate GUI container
   * @param {object} data with type, url and id 
   */
  ModelManager.prototype.addToContainer = function(data){
    //Force https in URLs when not on localhost
    let url = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host;
    url     = url + location.pathname + "?url=" + data.url;

    let imgLinkObj       = document.createElement("img");
    imgLinkObj.className = "imgModelLink";
    imgLinkObj.src       = data.thumb;
    imgLinkObj.addEventListener("click", function(){
      //On click on the thumbnail, we reload with model address as URL variable
      location.href = url;
    });

    let divID = (data.type === TYPES.FEATURED ? "featuredRow" : (data.type === TYPES.RECENT ? "recentRow" : "starredRow"));

    //Add thumbnail to the appropriate div in the gallery dialog
    let firstChild = (document.getElementById(divID).children.length > 1 ? document.getElementById(divID).children[1] : null);
    if(firstChild){
      document.getElementById(divID).insertBefore( imgLinkObj, firstChild );
    }
    else{
      document.getElementById(divID).appendChild(imgLinkObj);
    }

    return true;
  };

  /**
   * Load a new model in the A-Frame scene, based on its URL
   * @param  {string} url of the A-Frame painter model
   * @return {[type]}     [description]
   */
  ModelManager.prototype.loadModel = function(url){
    var that = this;
    if(url){
      let newModel = document.createElement("a-entity");
      newModel.addEventListener("model-loaded", function(data){
        that.saveThumb();
        document.getElementById("loaderDiv").classList.remove('make-container--visible');
      });

      newModel.setAttribute("a-painter-loader", "src:" + url);
      newModel.setAttribute("position", "0 0 -2");
      document.getElementsByTagName("a-scene")[0].appendChild(newModel);
      this.currentModel = {
        "url" : url
      }
    }
  };

  /**
   * Save the thumbnail of the actual model and add it to the base
   * @param  {string} type of model saved
   * @return {[type]}      [description]
   */
  ModelManager.prototype.saveThumb = function(type) {
    var that   = this;
    type       = type || TYPES.RECENT;

    let keyValue = this.currentModel.url + "_" + type;

    if(!this.dbManager.db){
      console.log("DB wasn't initialized properly, aborting thumbnail saving");
      return;
    }

    this.dbManager.getEntry(this.dbStructure.tableArray[0].name, keyValue).then((val) => {
      if(val !== undefined){
        console.log("[ModelManager] model already exists");
        that.currentModel = val;
        return true;
      }

      //Change the gallery button icon to show we are loading image
      document.getElementById("butGallery").classList.remove('butGallery');
      document.getElementById("butGallery").classList.add('butGalleryLoad');

      //If thumb has already been generated (adding fav), we don't upload it again
      if(that.currentModel && that.currentModel.thumb){
        let model = [{
          "ssn"   : that.currentModel.url + "_" + type,
          "url"   : that.currentModel.url, 
          "thumb" : that.currentModel.thumb, 
          "type"  : type
        }];
        return that.onModelData(model);
      }

      //We extract a screenshot image from the A-Frame canvas
      let canvas = document.querySelector('a-scene').components.screenshot.getCanvas('perspective');
      //We remove the string "data:image/png;base64" from the toDataURL return, otherwise it bugs with Imgur
      let img    = canvas.toDataURL().split(',')[1];

      var formData = new FormData()
      formData.append('type', 'json')
      formData.append('image', img)

      //Send the image generated from canvas to the Imgur API to get an Image file
      return fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Accept        : 'application/json',
          Authorization : 'Client-ID 36484f1fb6bfeeb'// imgur specific
        },
        body: formData
      }).then((response) => {
        if(!response.ok){
          throw response;
        }

        return response.json().then((obj) => {
          let imgLink = obj.data.link.replace(".png", "m.png");//Get the image medium thumbnail link
          imgLink = imgLink.replace("http://", "https://");

          let model = [{
            "ssn"   : that.currentModel.url + "_" + type,
            "url"   : that.currentModel.url, 
            "thumb" : imgLink, 
            "type"  : type
          }];
          that.currentModel = model[0];
          return that.onModelData(model);
        })
      }).catch((errResponse) => {
        console.log("[ModelManager] Error in posting request", errResponse.statusText, "Error " + errResponse.status);
      });
    }).catch((err) => {
      console.log("[ModelManager] Error in saving thumb", err);
    });
  };

  /**
   * Register a model data (if not already registered)
   * and add it to the gallery dialog container
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
  ModelManager.prototype.onModelData = function(model){
    var that = this;

    return this.registerData(model).then(() => {
      console.log("[ModelManager] Model thumb saved");
      return true;
    }).then(() => {
      document.getElementById("butGallery").classList.remove('butGalleryLoad');
      document.getElementById("butGallery").classList.add('butGallery');
      return that.addToContainer(model[0]);
    }).catch((err) => {
      console.log("[ModelManager] Error in registering data", err);
      return false;
    })
  };
})();

module.exports = ModelManager;
},{"./dbManager.js":2,"./util.js":5}],5:[function(require,module,exports){
var Util = {};
(function(){
  "use strict";
  /**
   * Check if user is on mobile
   * Useful for needed user interaction for media video/audio
   * @return {Boolean} if user is on mobile
   */
  Util.isMobile = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

  /**
   * Analyse an URL search part, look for 'varToExtract=somevalue' in the string
   * @param  {[type]} varToExtract variable we want to extract from the URL
   * @return {[type]} the value associated to the varToExtract, or null if nothing was found
   */
  Util.extractFromUrl = function(varToExtract){
    return new Promise((resolve, reject) => {
      try{
        let parser  = document.createElement('a');
        parser.href = location.href;
        let value   = parser.search.substring(1).split("&").filter(function(cell){ return (cell.indexOf(varToExtract + "=") !== -1);});
        value       = (value.length > 0 ? value[0].split("=") : null);

        resolve(value && value.length > 0 ? value[1] || null : null);
      }
      catch(err){
        reject(err);
      }
    })
  };

  /**
   * Generate an Unique ID
   * @return {string} Unique ID of length 4
   */
  Util.guid = function(){
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4();
  }
})()

module.exports = Util;
},{}]},{},[3]);
