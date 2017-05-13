(function(){
  "use strict";

  document.getElementById('butLoad').addEventListener('click', function() {
    // Open/show the load new model dialog
    toggleLoadDialog(true, "dialog-container");
  });

  document.getElementById('butLoadURL').addEventListener('click', function() {
    // Load the new model
    var url = document.getElementById('loadURL').value;
    location.href = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host + location.pathname + "?url=" + url;
    toggleLoadDialog(false, "dialog-container");
  });

  document.getElementById('butLoadCancel').addEventListener('click', function() {
    // Close the load new model dialog
    toggleLoadDialog(false);
  });

  document.getElementById('butGallery').addEventListener('click', function() {
    // Open/show the gallery container
    toggleLoadDialog(true, "model-container");
  });

  document.getElementById('closeModel').addEventListener('click', function() {
    // Close the gallery container
    toggleLoadDialog(false, "model-container");
  });

  // Toggles the visibility of the load new model dialog.
  function toggleLoadDialog(visible, className) {
    if (visible) {
      document.getElementsByClassName(className)[0].classList.add('make-container--visible');
    } else {
      document.getElementsByClassName(className)[0].classList.remove('make-container--visible');
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

    document.getElementById("qrcodeDiv").style.display = "block";

    document.body.addEventListener("click", function(event){ 
      document.getElementById("qrcodeDiv").style.display = "none";
    });

    return false;
  });
})();