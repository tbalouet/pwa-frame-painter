(function(){
  "use strict";

  /**
   * ===============================
   * ======== LOAD MODEL UI ========
   */

  document.getElementById('butLoad').addEventListener('click', function() {
    // Open/show the load new model dialog
    toggleDialog("loadModel");
    toggleDialog("gallery", true);
    event.stopPropagation();
  });

  document.getElementById('butLoadURL').addEventListener('click', function() {
    // Load the new model
    var url = document.getElementById('loadURL').value;
    location.href = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host + location.pathname + "?url=" + url;
    toggleDialog("loadModel");
    event.stopPropagation();
  });

  document.getElementById('butLoadCancel').addEventListener('click', function() {
    // Close the load new model dialog
    toggleDialog("loadModel");
    event.stopPropagation();
  });


  /**
   * ============================
   * ======== GALLERY UI ========
   */

  /**
   * Open/show the gallery container
   */
  document.getElementById('butGallery').addEventListener('click', function(event) {
    toggleDialog("gallery");
    toggleDialog("loadModel", true);
    event.stopPropagation();
  });

  /**
   * Hide the tooltip under the gallery button
   */
  document.getElementById("butGallery").addEventListener('mouseover', function(){
    document.getElementById("butGallery").classList.remove("show");
    document.getElementById("butGallery").classList.remove("ttFirst");
    document.getElementById("butGallery").classList.add("tt");
  });

  /**
   * Close the gallery container
   */
  document.getElementById('closeModel').addEventListener('click', function() {
    toggleDialog("gallery");
    event.stopPropagation();
  });


  /**
   * ========================
   * ======== FAV UI ========
   */

  /**
   * Add current model to favorites
   */
  document.getElementById('butFav').addEventListener('click', function() {
    if(modelManager){
      modelManager.saveThumb(2);//2 = ModelManager.TYPES.STARRED
    }
  });


  /**
   * ============================
   * ======== QR Code UI ========
   */
  
  /**
   * Generate the QR Code image and display it
   */
  document.getElementById("butQRCode").addEventListener("click", function(event){
    let typeNumber           = 12;//We need a model a bit high for long URLs. 12 should do it
    let errorCorrectionLevel = 'L';
    let qr                   = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(location.href);
    qr.make();
    document.getElementById('qrcode').innerHTML = qr.createImgTag(4);

    toggleDialog("qrCodeDiv");


    document.getElementById("closeQRCode").addEventListener("click", function(event){
      toggleDialog("qrCodeDiv");
    });

    event.stopPropagation();
  });


  /**
   * Toggles the visibility of the appropriate dialog screen. 
   * @param  {string} eltID ID of the screen to show/hide
   * @param  {boolean} forceClose force close even if not open (remove check)
   */
  function toggleDialog(eltID, forceClose) {
    let domElt = document.getElementById(eltID);
    if(!domElt){
      return;
    }

    if (domElt.classList.contains('make-container--visible') || forceClose) {
      domElt.classList.remove('make-container--visible');
    } else {
      domElt.classList.add('make-container--visible');
    }
  };
})();