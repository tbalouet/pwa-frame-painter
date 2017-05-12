(function(){
  "use strict";

  document.getElementById('butLoad').addEventListener('click', function() {
    // Open/show the load new model dialog
    toggleLoadDialog(true);
  });

  document.getElementById('butLoadURL').addEventListener('click', function() {
    // Load the new model
    var url = document.getElementById('loadURL').value;
    location.href = (location.host.indexOf("localhost") !== -1 ? "http://" : "https://") + location.host + location.pathname + "?url=" + url;
    toggleLoadDialog(false);
  });

  document.getElementById('butLoadCancel').addEventListener('click', function() {
    // Close the load new model dialog
    toggleLoadDialog(false);
  });

  // Toggles the visibility of the load new model dialog.
  function toggleLoadDialog(visible) {
    if (visible) {
      document.getElementsByClassName("dialog-container")[0].classList.add('dialog-container--visible');
    } else {
      document.getElementsByClassName("dialog-container")[0].classList.remove('dialog-container--visible');
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