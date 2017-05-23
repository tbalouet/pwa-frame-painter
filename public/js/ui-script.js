(function(){
  "use strict";

  document.getElementById('butLoad').addEventListener('click', function() {
    // Open/show the load new model dialog
    toggleDialog("loadModel");
  });

  document.getElementById('butLoadURL').addEventListener('click', function() {
    // Load the new model
    var url = document.getElementById('loadURL').value;
    location.href = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host + location.pathname + "?url=" + url;
    toggleDialog("loadModel");
  });

  document.getElementById('butLoadCancel').addEventListener('click', function() {
    // Close the load new model dialog
    toggleDialog("loadModel");
  });

  document.getElementById('butGallery').addEventListener('click', function() {
    // Open/show the gallery container
    toggleDialog("gallery");
  });

  document.getElementById('butFav').addEventListener('click', function() {
    // Add current model to favorites
    if(modelManager){
      modelManager.saveThumb(2);//ModelManager.TYPES.STARRED
    }
  });

  document.getElementById('closeModel').addEventListener('click', function() {
    // Close the gallery container
    toggleDialog("gallery");
  });

  // Toggles the visibility of the load new model dialog.
  function toggleDialog(eltID) {
    let domElt = document.getElementById(eltID);
    if(!domElt){
      return;
    }

    if (domElt.classList.contains('make-container--visible')) {
      domElt.classList.remove('make-container--visible');
    } else {
      domElt.classList.add('make-container--visible');
    }
  };

  document.getElementById("butQRCode").addEventListener("click", function(event){
    event.stopPropagation();

    let typeNumber           = 12;//We need a model a bit high for long URLs. 12 should do it
    let errorCorrectionLevel = 'L';
    let qr                   = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(location.href);
    qr.make();
    document.getElementById('qrcode').innerHTML = qr.createImgTag(4);

    toggleDialog("qrCodeDiv");

    document.body.addEventListener("click", function(event){ 
      toggleDialog("qrCodeDiv");
    });

    return false;
  });
})();