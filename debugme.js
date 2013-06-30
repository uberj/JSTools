var x = "montpellier/debugme.js's global value of x";
var f, g;

function fibonacci(n) {
    if (n < 2)
        return 1;
    else return fibonacci(n-1) + fibonacci(n-2);
}

function update() {
    var inputElt = document.getElementById('argument');
    var argument = Number(inputElt.value);
    var result = fibonacci(argument);
    var resultElt = document.getElementById('result');
    resultElt.innerHTML = '' + result;
}

function updateExpression() {
  try {
    var expressionElt = document.getElementById('expression');
    showResult(eval(expressionElt.value));
  } catch (x) {
    showString("exception: " + x + "\n"
               + "stack:\n" + x.stack);
  }
}

function showResult(v) {
  var formatted;
  try {
    formatted = uneval(v);
    if (v && typeof v == 'object')
      formatted += '\n' + v.toString();
  } catch (x) {
    formatted = "<error formatting value as string>";
  }

  showString(formatted);
}

function showString(s) {
  var valueElt = document.getElementById('value');
  valueElt.firstChild.textContent = s;
}
