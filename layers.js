function showLayers(objectId, shownClass) {
  var svgDoc = document.getElementById(objectId + ":" + shownClass).contentDocument;
  var flips = svgDoc.getElementsByClassName('flip');
  var i;
  for (i = 0; i < flips.length; i++) {
    var flip = flips[i];
    if (flip.getAttribute('style') == 'display:inline')
      flip.removeAttribute('style');

    if (flip.classList.contains(shownClass))
      flip.setAttribute('display', 'inherit');
    else
      flip.setAttribute('display', 'none');
  }
}
