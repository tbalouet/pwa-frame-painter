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
      dbVersion : 4,
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