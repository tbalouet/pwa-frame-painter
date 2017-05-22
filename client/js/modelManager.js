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
    { ssn: "3b717cf7", url: "https://ucarecdn.com/3e089e07-be62-48e1-9f12-9a284c249e77/", thumb : "public/assets/images/3b717cf7.png", type: TYPES.FEATURED },
    { ssn: "1400ac94", url: "https://ucarecdn.com/bacf6186-96b1-404c-9751-e955ece04919/", thumb : "public/assets/images/1400ac94.png", type: TYPES.FEATURED },
    { ssn: "672110ca", url: "https://ucarecdn.com/962b242b-87a9-422c-b730-febdc470f203/", thumb : "public/assets/images/672110ca.png", type: TYPES.FEATURED },
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
          { name : "url", unique : true},
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
    this.registerData(featuredModels, false);

    this.populateModelContainer();
  };

  /**
   * Add an array of data in the object store
   * @param {[type]} dataArray [description]
   */
  ModelManager.prototype.registerData = function(dataArray, addToContainer){
    var that = this;

    var objModelStore = this.dbManager.db.transaction(this.dbStructure.tableArray[0].name, "readwrite").objectStore(this.dbStructure.tableArray[0].name);
    for (var i in dataArray) {
      var idbObject = objModelStore.add(dataArray[i]);
      if(addToContainer){
        idbObject.onsuccess = function(event) {
          that.addToContainer(dataArray[i]);
        };
      }
    }
  };

  /**
   * Method to fill the UI with the Model's list
   * @return {[type]} [description]
   */
  ModelManager.prototype.populateModelContainer = function() {
    var that = this;
    let tableName = this.dbStructure.tableArray[0].name;
    var objStore = this.dbManager.db.transaction(tableName).objectStore(tableName);

    //Reads all the entries in the model table and create icons to access it
    objStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        that.addToContainer(cursor.value);
        cursor.continue();
      }
    };
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
    let canvas = document.querySelector('a-scene').components.screenshot.getCanvas('perspective');
    let img    = canvas.toDataURL();
    try {
        img = img.split(',')[1];
    } catch(e) {
        img = img.split(',')[1];
    }

    let httpPost = new XMLHttpRequest(),
      path       = 'https://api.imgur.com/3/image',
      data       = JSON.stringify({image: img});
    httpPost.onreadystatechange = function(err) {
      if (httpPost.readyState == 4 && httpPost.status == 200){
        try{
          let data    = JSON.parse(httpPost.responseText).data;
          let imgLink = data.link.replace(".png", "m.png");//Get the image medium thumbnail link

          let model = [{
            "ssn"   : Util.guid() + Util.guid(),
            "url"   : that.currentModel.url, 
            "thumb" : imgLink, 
            "type"  : type
          }];
          that.registerData(model, true);
          console.log("[ModelManager] Model thumb saved");
        }
        catch(err){
          console.log(err);
        }
      }
    };
    // Set the content type of the request to json since that's what's being sent
    httpPost.open("POST", path, true);
    httpPost.setRequestHeader('Content-Type', 'application/json');
    httpPost.setRequestHeader('Authorization', 'Client-ID 36484f1fb6bfeeb');
    httpPost.send(data);
  };
})();

module.exports = ModelManager;