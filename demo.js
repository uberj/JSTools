Cu.import("resource://gre/modules/jsdebugger.jsm");
addDebuggerToGlobal(window);

function demoCleanup(f) { demoCleanup.ups.push(f); }
demoCleanup.ups = [];
demoCleanup.run = function () {
  while (demoCleanup.ups.length > 0) {
    demoCleanup.ups[0]();
    demoCleanup.ups.shift();
  }
}
demoCleanup.run()

var demo = demo || {};

(function () {
  // Clean up any prior demo effects.
  demoCleanup.run();

  // Let 'tab' be the currently selected tab.
  let tab = gBrowser.selectedBrowser;

  // Create a debugger.
  let dbg = new Debugger;
  demoCleanup(function () { dbg.removeAllDebuggees(); dbg.enabled = false; });

  // Make it watch code running in the tab's current page.
  dbg.addDebuggee(tab.contentWindow.wrappedJSObject);

  // Watch for new pages being visited in the tab, and add those
  // as debuggees too.
  tab.addEventListener("DOMWindowCreated", newWindow, true);
  tab.addEventListener("pageshow", newWindow, true);
  demoCleanup(function () {
    tab.removeEventListener("DOMWindowCreated", newWindow, true);
    tab.removeEventListener("pageshow", newWindow, true);
  });

  function newWindow(event) {
    dbg.addDebuggee(event.target.defaultView.wrappedJSObject);
  }

  // Log all frame enter and exit events.
  demo.start = function () {
    demo.log = [];

    dbg.onEnterFrame = function (frame) {
      demo.log.push({ time: window.performance.now(), script: frame.script, offset: frame.offset });
      frame.onPop = function () {
        demo.log.push({ time: window.performance.now() });
      }
    }
  };

  demo.stop = function () {
    dbg.onEnterFrame = undefined;
  };

})();

demo.start();
demo.log.length
demo.stop()

function findPlotWindow() {
  for (let b of gBrowser.browsers) {
    let w = b.contentWindow.wrappedJSObject;
    if (w.document.URL.match(/\/plot.html$/)) {
      return w;
    }
  }
}

function plotCallLog() {
  var canvas = findPlotWindow().document.getElementById('callplot');
  var ctx = canvas.getContext('2d');

  let start = demo.log[0].time;
  let elapsed = demo.log[demo.log.length - 1].time - start;
  function x(t) { return (t - start) * canvas.width / elapsed; }
  function y(d) { return d * 10; }
  function c(t) { return (t - start) * 720 / elapsed; }

  function rect(start, end, depth) {
    let rx = x(start);
    let ry = y(depth);
    ctx.fillStyle = "hsl(" + c(start) + ",80%,50%)";
    ctx.fillRect(rx, canvas.height - ry, Math.ceil(x(end) - rx), ry - y(depth + 1));
  }

  let stack = [];

  ctx.fillStyle = "rgb(255,255,255)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (e of demo.log) {
    if ('script' in e) {
      e.caller = stack.length > 0 ? stack[stack.length - 1] : null;
      stack.push(e);
    } else {
      let call = stack.pop();
      e.caller = stack.length > 0 ? stack[stack.length - 1] : null;
      rect(call.time, e.time, stack.length);
    }
  }
}

plotCallLog()

// calagator.org
(function () {

  var mouseMoveListener;
  var posElt = findPlotWindow().document.getElementById('position');
  var canvasElt = findPlotWindow().document.getElementById('callplot');
  canvasElt.onmousemove = makeInfallible(onMouseMove);

  function onMouseMove(event) {
    let x = event.clientX - canvasElt.offsetLeft;
    let y = event.clientY - canvasElt.offsetTop;

    let start = demo.log[0].time;
    let elapsed = demo.log[demo.log.length - 1].time - start;

    let t = start + (x / canvasElt.width * elapsed);
    let d = Math.floor((canvasElt.height - y) / 10);

    console.log("JIMB: " + t + "," + d);
    displayFrame(t, d);
  }

  function displayFrame(t, d) {
    let e = findFrame(findStack(t), d);
    if (e) {
      posElt.firstChild.textContent =
        uneval(e.script.url) + ":" +
        e.script.getOffsetLine(e.offset);
    } else {
      posElt.firstChild.textContent = '<none>';
    }
  }

  function findStack(t) {
    let lower = 0, upper = demo.log.length - 1;
    while (lower < upper) {
      let mid = Math.ceil((lower + upper) / 2);
      if (demo.log[mid].time <= t)
        lower = mid;
      else
        upper = mid - 1;
    }

    return demo.log[lower];
  }

  function findFrame(s, d) {
    var a = [];
    for (;s; s = s.caller)
      a.push(s);
    if (d < a.length)
      return a[a.length - 1 - d];
    return null;
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
