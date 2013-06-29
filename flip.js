window.flip = {};

(function () {
  window.addEventListener('DOMContentLoaded', makeInfallible(scan));

  function iter(arrayish) {
    for (let i = 0; i < arrayish.length; i++) {
      yield arrayish[i];
    }
  }

  // Find all 'object' elements embedding SVG documents with 'flipClass' or
  // 'flipIds' attributes, and selectively display elements of the embedded
  // SVG as those attributes direct. For example:
  //
  // Display 'flip' elements only if they also have the 'desktop' class:
  //   <object data="foo.svg" type="image/svg+xml" flipClass='desktop'>
  //
  // Display 'flip' elements only if they have one of the named ids:
  //   <object data="foo.svg" type="image/svg+xml" flipIds='a b c'>
  function scan() {
    for (let object of iter(document.getElementsByTagName('object'))) {
      var flipClassAttr = object.getAttribute('flipClass');
      if (flipClassAttr)
        flipClass(object.contentDocument, flipClassAttr);

      var flipIdsAttr = object.getAttribute('flipIds');
      if (flipIdsAttr)
        flipIds(object.contentDocument, new Set(flipIdsAttr.split(/[, ]/)));
    }
  }

  // In svgDoc, display elements with the 'flip' class only if they also
  // have showClass.
  function flipClass(svgDoc, showClass) {
    clean(svgDoc);

    for (let elt of iter(svgDoc.getElementsByClassName('flip'))) {
      if (elt.classList.contains(showClass))
        elt.setAttribute('style', 'display:inline');
      else
        elt.setAttribute('style', 'display:none');
    }
  }

  // In svgDoc, display elements with the 'flip' class only if their id is
  // in idSet.
  function flipIds(svgDoc, idSet) {
    console.log("JIMB: flipIds: " + [uneval(id) for (id of idSet)]);
    clean(svgDoc);

    for (let elt of iter(svgDoc.getElementsByClassName('flip'))) {
      console.log("JIMB: flipIds: elt: " + uneval(elt.id) + ", " + idSet.has(elt.id));
      if (idSet.has(elt.id))
        elt.setAttribute('style', 'display:inline');
      else
        elt.setAttribute('style', 'display:none');
    }
  }

  // For all Inkscape layers in svgDoc, remove 'display:none' style if
  // present.
  //
  // In Inkscape, if you make a layer hidden (which is handy to do while
  // editing), Inkscape saves that as a 'display:none' style on the <g>
  // element representing the layer. So what I consider my personal editing
  // session state ends up affecting how the drawing displays, in the
  // presentation.
  //
  // It's a pain to have to remember to make all layers visible every time I
  // save the document, so just clean them off here.
  function clean(svgDoc) {
    for (let group of iter(svgDoc.getElementsByTagName('g'))) {
      if (group.getAttribute('inkscape:groupmode') == 'layer' &&
          group.getAttribute('style') == 'display:none') {
        group.removeAttribute('style');
      }
    }
  }

  function makeInfallible(f) {
    return function (...args) {
      try {
        return f.apply(this, args);
      } catch (ex) {
        console.log(f.name + " threw an exception: " + ex);
        console.log(ex.stack);
        return undefined;
      }
    }
  }
})();
