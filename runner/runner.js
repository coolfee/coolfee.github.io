
/*===============================================
Allow the iframe to receive data from code editor
===============================================*/
const allowedOrigins = ['https://coolfee.github.io', 'http://127.0.0.1:5500'];
let originalCode = '';
window.addEventListener('message', function(event) {
  if (!allowedOrigins.includes(event.origin)) return;
  if (typeof event.data.light !== "undefined") {
    document.body.classList.toggle('light', event.data.light);
    return;
  }
  const code = event.data.code;
  const tests = event.data.tests;
  originalCode = code + '\n' + tests;
  output.innerHTML = '';
  try {
    eval(originalCode);
  } catch (error) {
    output.insertAdjacentHTML('beforeend', `🔥 There was an error when running the tests. This error originated from your own code, not from my engine:<br><br>${error.message}<br><br>`);
    const stack = error.stack.split('\n').find((l) => l.includes('<anonymous>:'));
    let line = stack?.split('<anonymous>:')?.[1]?.split(':')[0] || false;
    if (!line || line > code.split(/\r?\n|\r|\n/g).length) return;
    const lineCode = originalCode.split(/\r?\n|\r|\n/g)[line - 1];
    if (lineCode && lineCode.trim()) {
      output.insertAdjacentHTML('beforeend', `Line ${line}:<br>`);
      console.log('','=> ', `${lineCode.trim()}<br>`);
    }
  }
});

/*==================================
======= Protect some methods =======
====================================*/
fetch = () => {};
XMLHttpRequest = () => {};
XMLHttpRequestEventTarget = () => {};
XMLHttpRequestEventTarget = () => {};
alert = (w) => console.log('Alert:', w);

/*==================================
===== Output-related functions =====
====================================*/
(() => {
  let doc = document;
  document = {};

  console.log = function (...m) {
    output.insertAdjacentHTML("beforeend", `<span class="line"></span>`);
    m.forEach((e) => {
      if (typeof e === 'object') e = JSON.stringify(e);
      doc.querySelector('#output > span:last-child').insertAdjacentHTML('beforeend', `<span>${e}</span>`);
    });
    doc.querySelector('#output').insertAdjacentHTML('beforeend', '<br>');
  };

  console.success = (m) => {
    output.insertAdjacentHTML("beforeend", `<span class="title success">✔ ${m}</span>`);
    doc.querySelector('#output').insertAdjacentHTML('beforeend', '<br>');
  }

  console.info = (m) => {
    output.insertAdjacentHTML("beforeend", `<span class="title info">${m}</span>`);
    doc.querySelector('#output').insertAdjacentHTML('beforeend', '<br>');
  }

  console.error = (m) => {
    output.insertAdjacentHTML("beforeend", `<span class="title error">✘ ${m}</span>`);
    doc.querySelector('#output').insertAdjacentHTML('beforeend', '<br>');
  }
})();

/*==================================
====== Type checker related  =======
====================================*/
const checkType = {
  "number": (r) => typeof r === "number",
  "array": (r) => typeof r === "object" && Array.isArray(r),
  "object": (r) => typeof r === "object" && !Array.isArray(r) && r !== null,
  "string": (r) => typeof r === "string",
}
const sameType = (r1, e) => {
  if (Array.isArray(e)) return Array.isArray(r1);
  if (e === null) return r1 === null;
  return typeof r1 === typeof e;
};
const checkTypes = (vars, toBeIn) => vars.every((r2) => checkType?.[toBeIn](r2) || typeof r2 === toBeIn);
const pair = (vars, allowed) => vars.every((r3) => allowed.some((t) => checkType[t](r3)));
const typeOf = (p) => {
  for(const typ in checkType) {
    if (checkType[typ](p)) return typ;
  }
  return typeof p;
}


/*==================================
======== Comparing methods =========
====================================*/
const deepEqual = (r, e, _key = '', deepness = 0) => {
  if (Array.isArray(e) || (typeof e === "object" && e !== null)) {
    if (Object.keys(e).length !== Object.keys(r).length) {
      throw new Error(JSON.stringify({
        key: _key,
        expected: 'Length of '+ Object.keys(e).length,
        received: 'Length of '+ Object.keys(r).length
      }));
    }
    if (Array.isArray(e) && !Array.isArray(r)) throw new Error(JSON.stringify({key: _key, expected: e, received: r}));
    if (typeof e === "object" && typeof r !== "object") throw new Error(JSON.stringify({key: _key, expected: e, received: r}));
    if (r === null) throw new Error(JSON.stringify({key: _key, expected: e, received: r}));
    for(const key in e) {
      deepEqual(r[key], e[key], _key+(Array.isArray(e) ? `[${key}]` : `['${key}']`), deepness + 1);
    }
  } else {
    if (r !== e) throw new Error(JSON.stringify({key: _key, expected: e, received: r}));
    return true;
  }
}

const toBe = (r, e) => {
  if (!sameType(r, e)) {
    throw new Error(JSON.stringify({
      expected: typeof e,
      received: typeof r,
    }));
  }
  if (r === e) return true;
  const areObjectsOrArrays = (pair([e], ["object","array"]));
  if (areObjectsOrArrays) {
    if (JSON.stringify(r) === JSON.stringify(e)) return true;
    throw new Error(JSON.stringify({
      notice: "With objects and arrays, the best approach would be using toEqual",
      expected: JSON.stringify(e),
      received: JSON.stringify(r),
    }));
  }
  throw new Error(JSON.stringify({expected: e, received: r}));
};

const toBeCloseTo = (received, expected, precision = 2) => {
  if (!checkTypes([received, expected], "number")) {
    throw new Error(JSON.stringify({
      expected: typeof expected,
      received: typeof received,
    }));
  }
  let pass = false;
  let expectedDiff = 0;
  let receivedDiff = 0;

  if (received === Infinity && expected === Infinity) {
    pass = true; // Infinity - Infinity is NaN
  } else if (received === -Infinity && expected === -Infinity) {
    pass = true; // -Infinity - -Infinity is NaN
  } else {
    expectedDiff = Math.pow(10, -precision) / 2;
    receivedDiff = Math.abs(expected - received);
    pass = receivedDiff < expectedDiff;
  }
  if (!pass) throw new Error(JSON.stringify({expected, received}));
  return true;
}

const toEqual = (r, e) => {
  if (pair([r, e], ["string", "number"])) {
    if (parseFloat(r) !== parseFloat(e)) throw new Error(JSON.stringify({expected: e, received: r}));
  } else if (pair([r, e], ["object"]) || pair([r, e], ["array"])) {
    deepEqual(r, e);
  } else if (typeof r === "undefined" && typeof e !== "undefined") {
    throw new Error(JSON.stringify({expected: typeOf(e), received: typeOf(r)}));
  } else if (e != r) {
    throw new Error(JSON.stringify({expected: e, received: r}));
  }
  return true;
}

const toBeUndefined = (r) => {
  if (typeof r !== "undefined") {
    throw new Error(JSON.stringify({expected: "undefined", received: r}));
  }
}

const toThrow = (cb, message = '') => {
  try {
    cb();
  } catch (error) {
    if (message !== '') {
      if (error.message !== message) {
        throw new Error(JSON.stringify({expected: "error " + message, received: error.message}));
      }
    }
    return;
  }
  throw new Error(JSON.stringify({expected: "error " + message, received: cb()}));
}

const isJSON = (str) => {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

/*==================================
========= Jest-ish methods =========
====================================*/
const describe = (msg, cb) => {
  console.info(msg);
  cb();
}

const notMethod = (method, ...params) => {
  try {
    method(...params);
  } catch (error) {
    return;
  }
  console.log(params[0]);
  throw new Error(JSON.stringify({expected: "not " + params[1], received: params[0]}));
}

const expect = (r) => {
  return {
    toBe: (e) => toBe(r, e),
    toBeCloseTo: (e, precision = 2) => toBeCloseTo(r, e, precision),
    toEqual: (e) => toEqual(r, e),
    toBeUndefined: () => toBeUndefined(r),
    toThrow: (e) => toThrow(r, e),
    not: {
      toBeUndefined: (e) => notMethod(toBeUndefined, r, e),
      toBe: (e) => notMethod(toBe, r, e),
      toBeCloseTo: (e, precision = 2) => notMethod(toBeCloseTo, r, e, precision),
      toEqual: (e) => notMethod(toEqual, r, e),
      toThrow: (e) => notMethod(toThrow, r, e),
    },
  }
}

const test = (message, cb) => {
  try {
    cb();
    console.success(message);
  } catch (e) {
    if (isJSON(e.message)) {
      error = JSON.parse(e.message);
      console.error(message);
      error?.key && console.log('Key:', error.key);
      console.log(`Expected:`, `<i>${error.expected}</i>`);
      console.log(`Received:`, error.received);
      error?.notice && console.log(`Notice: ${error.notice}`);
      const stack = e.stack.split(/\r?\n|\r|\n/g).find((l) => l.includes('<anonymous>:'));
      const line = stack.split('<anonymous>:')[1].split(':')[0];
      console.log('','=> ',originalCode.split(/\r?\n|\r|\n/g)[line - 1]);
      console.log(``);
    } else {
      throw new Error(e);
    }
  }
}
const it = test;
