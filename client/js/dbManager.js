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

    // Use transaction oncomplete to make sure the objectStore creation is 
    // finished before adding data into it.
    request.onsuccess       = function(event){
      that.db = event.target.result;
      opts.onCompleteCB(event);
    }
    
    //DB creation wasn't allowed or failed, we need fallback
    request.onerror         = this.onError.bind(this);
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

  DBManager.prototype.onError = function(event) {
    console.log("[DBManager] Error", event.target.error);
  };
})();

module.exports = DBManager;