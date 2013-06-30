Cu.import("resource://gre/modules/jsdebugger.jsm");
addDebuggerToGlobal(window);

function demoCleanup(f) { demoCleanup.ups.push(f); }
// demoCleanup.ups = [];
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
'script' in demo.log[0]
demo.log[1]
demo.log[2]
'script' in demo.log[3]

function findPlotWindow() {
  for (let b of gBrowser.browsers) {
    let w = b.contentWindow.wrappedJSObject;
    if (w.document.URL.match(/\/demo.html$/)) {
      return w;
    }
  }
}

findPlotWindow()

function plotCallLog() {
  var canvas = findPlotWindow().document.getElementById('callplot');
  var ctx = canvas.getContext('2d');

  let width = canvas.width;
  let start = demo.log[0].time;
  let elapsed = demo.log[demo.log.length - 1].time - start;
  function x(t) { return (t - start) * width / elapsed; }
  function y(d) { return d * 10; }
  function c(t) { return (t - start) * 720 / elapsed; }

  let stack = [];

  if (1) {
    for (e of demo.log) {
      if ('script' in e) {
        stack.push(e);
      } else {
        let call = stack.pop();
        ctx.fillStyle = "hsl(" + c(call.time) + ",80%,50%)";
        ctx.fillRect(x(call.time), y(0),
                     Math.max(1,x(e.time - call.time)), y(stack.length + 1));
      }
    }
  }
  console.log("JIMB: stack depth at end: " + stack.length);
}

plotCallLog()
