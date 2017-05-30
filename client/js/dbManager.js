var DBManager;
(function(){
  "use strict";
  var Dexie = require("./dexie.js");

  /**
   * Object to handle data storage in an IndexedDB
   */
  DBManager = function(opts){
    var that = this;

    let promiseArr = [];
    this.db = new Dexie(opts.dbName);
    this.modelName = opts.tableModel.name;

    let table = {};
    table[that.modelName] = (opts.tableModel.keyPath + "," + opts.tableModel.index.map(function(key){ return key.name;}).join(","))

    this.db.version(opts.dbVersion).stores(table);

    this.db.open().catch(function(error) {
      console.log("[DBManager] Error", error);
    });
  };

  /**
   * Function to browse the object store and deploy a function on each key value
   * @param  {func} cbFunc    the function to apply to each retrieved line
   */
  DBManager.prototype.browseObjStore = function(cbFunc){
    return this.db[this.modelName].each(cbFunc);
  };

  /**
   * Promise to check if a KeyPair already exists in a table
   * @param  {object} ssnKey   key defining what we're looking for
   * @return {[type]}           [description]
   */
  DBManager.prototype.getEntry = function(ssnKey){
    return this.db[this.modelName].get(ssnKey);
  }

  /**
   * Promise to add a KeyPair in the model table
   * @param  {object} row object we want to insert in the table
   * @return {[type]}           [description]
   */
  DBManager.prototype.addEntry = function(row){
    return this.db[this.modelName].add(row);
  }
})();

module.exports = DBManager;