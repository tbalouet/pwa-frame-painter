var ModelManager;

(function(){
  "use strict";
  var DBManager = require("./dbManager.js");
  var Util = require("./util.js");

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

      let tableName = this.dbStructure.tableArray[0].name;
      let promArray = [];
      for (let i in dataArray) {
        let keyValue = dataArray[i].url + "_" + dataArray[i].type;

        promArray.push(this.dbManager.getEntry(this.dbStructure.tableArray[0].name, keyValue).then((val) => {
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
    let url = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host;
    url     = url + location.pathname + "?url=" + data.url;

    let imgLinkObj       = document.createElement("img");
    imgLinkObj.className = "imgModelLink";
    imgLinkObj.src       = data.thumb;
    imgLinkObj.addEventListener("click", function(){
      location.href = url;
    });

    switch(data.type){
      case TYPES.FEATURED :
        document.getElementById("featuredRow").appendChild(imgLinkObj);
        break;
      case TYPES.RECENT :
        let firstChild = document.getElementById("recentRow").children > 1 ? document.getElementById("recentRow").children[1] : null;
        if(firstChild){
          document.getElementById("recentRow").insertBefore( imgLinkObj, firstChild );
        }
        else{
          document.getElementById("recentRow").appendChild(imgLinkObj);
        }
        break;
    }
    return true;
  };

  /**
   * Load a new model in the scene, based on its URL
   * @param  {string} url of the A-Frame painter model
   * @return {[type]}     [description]
   */
  ModelManager.prototype.loadModel = function(url){
    var that = this;
    if(url){
      let newModel = document.createElement("a-entity");
      newModel.addEventListener("model-loaded", function(data){
        that.saveThumb();
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

    this.dbManager.getEntry(this.dbStructure.tableArray[0].name, keyValue).then((val) => {
      if(val !== undefined){
        console.log("[ModelManager] model already exists");
        return true;
      }

      let canvas = document.querySelector('a-scene').components.screenshot.getCanvas('perspective');
      let img    = canvas.toDataURL().split(',')[1];

      var formData = new FormData()
      formData.append('type', 'json')
      formData.append('image', img)

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

          let model = [{
            "ssn"   : that.currentModel.url + "_" + type,
            "url"   : that.currentModel.url, 
            "thumb" : imgLink, 
            "type"  : type
          }];
          return that.registerData(model).then(() => {
            console.log("[ModelManager] Model thumb saved");
            return true;
          }).then(() => {
            return that.addToContainer(model[0]);
          }).catch((err) => {
            console.log("[ModelManager] Error in registering data", err);
            return false;
          })
        })
      }).catch((errResponse) => {
        console.log("[ModelManager] Error in posting request", errResponse.statusText, "Error " + errResponse.status);
      });
    }).catch((err) => {
      console.log("[ModelManager] Error in saving thumb", err);
    });
  };
})();

module.exports = ModelManager;