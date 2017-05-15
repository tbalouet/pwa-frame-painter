var ModelManager;

(function(){
  "use strict";
  var DBManager = require("./dbManager.js");

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
    { ssn: "3b717cf7", url: "https://ucarecdn.com/3e089e07-be62-48e1-9f12-9a284c249e77/", type: TYPES.FEATURED },
    { ssn: "1400ac94", url: "https://ucarecdn.com/bacf6186-96b1-404c-9751-e955ece04919/", type: TYPES.FEATURED },
    { ssn: "672110ca", url: "https://ucarecdn.com/962b242b-87a9-422c-b730-febdc470f203/", type: TYPES.FEATURED },
  ];

  /**
   * Class to create the Models list DataBase
   * And to handle access to this list
   */
  ModelManager = function(){
    this.dbStructure = {
      dbName : "pwaFramePainterDB",
      dbVersion : 4,
      tableArray : [{
        name : "models",
        keyPath : "ssn",
        index : [
          { name : "url", unique : false},
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
    // Store values in the newly created objectStore.
    var objModelStore = this.dbManager.db.transaction(this.dbStructure.tableArray[0].name, "readwrite").objectStore(this.dbStructure.tableArray[0].name);
    for (var i in featuredModels) {
      objModelStore.add(featuredModels[i]);
    }

    this.populateModelContainer();
  };

  /**
   * Method to fill the UI with the Model's list
   * @return {[type]} [description]
   */
  ModelManager.prototype.populateModelContainer = function() {
    let tableName = this.dbStructure.tableArray[0].name;
    var objStore = this.dbManager.db.transaction(tableName).objectStore(tableName);

    //Reads all the entries in the model table and create icons to access it
    objStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        switch(cursor.value.type){
          case TYPES.FEATURED :
            let url = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host;
            url     = url + location.pathname + "?url=" + cursor.value.url;

            let imgLinkObj       = document.createElement("img");
            imgLinkObj.className = "imgModelLink";
            imgLinkObj.src       = "public/assets/images/" + cursor.value.ssn + ".png";
            imgLinkObj.addEventListener("click", function(){
              location.href = url;
            });

            document.getElementById("featuredRow").appendChild(imgLinkObj);
            break;
        }
        cursor.continue();
      }
    };
  };
})();

module.exports = ModelManager;