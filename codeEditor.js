/*==================================
======= Code-editor functions ======
====================================*/

const codeEditor = ace.edit(code, {
  mode: "ace/mode/javascript",
  tabSize: 2,
  selectionStyle: "text"
});
codeEditor.setTheme("ace/theme/monokai");
codeEditor.container.id = 'code';

const testsEditor = ace.edit(tests, {
  mode: "ace/mode/javascript",
  tabSize: 2,
  selectionStyle: "text"
});
testsEditor.setTheme("ace/theme/monokai");
testsEditor.container.id = 'tests';

/*==================================
====== Restore code from hash ======
====================================*/
let recovered = false;
if (window.location.hash && window.location.hash.length > 1) {
  const {code: scode, tests: stests} = hash.load() || {code: false, tests: false};
  if (scode || stests){
    codeEditor.setValue(scode || '', -1);
    testsEditor.setValue(stests || '', -1);
  }
  recovered = true;
}

/*==================================
=== Choose between Code n Tests ====
====================================*/
const toggleCode = (cl) => {
  codeColumn.className = cl;
}
codeColumn.querySelectorAll('nav a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    toggleCode(e.target.dataset.class);
  })
})

/*==================================
=== Allow adjust of column sizes ===
====================================*/
dragger.addEventListener("dragstart", (event) => {
  document.body.classList.add('dragging');
  dragger.style.opacity = "0";
}, false);
dragger.addEventListener("drag", (event) => {
  x = event.clientX;
  x && (codeColumn.style.width = x + 'px');
  dragger.style.opacity = "";
});
dragger.addEventListener("dragend", (event) => {
  document.body.classList.remove('dragging');
}, false);

/*==================================
======= Show welcome message =======
====================================*/
if (!recovered && !ls.get('welcome')) {
  welcome.show();
  welcome.querySelector('footer button').focus();
}
welcome.addEventListener('close', () => {
  ls.set('welcome', true);
});

/* == After the header ended async loading == */
window.addEventListener('load-header', () => {
  /*==================================
  ======= Code-runner functions ======
  ====================================*/
  run.addEventListener('click', (e) => {
    e.preventDefault();
    runner.contentWindow.postMessage({
      code: codeEditor.getValue(),
      tests: testsEditor.getValue(),
    }, '*');
    const saved = {...hash.load(), code: codeEditor.getValue(), tests: testsEditor.getValue()};
    hash.save(saved);
  });

  document.addEventListener('keydown', e => {
    if ((e?.metaKey || e.ctrlKey)  && e.key === 's') {
      e.preventDefault();
      run.click();
    }
  });

  const {autorun} = hash.load() || {autorun: false};
  if (autorun) {
    run.dispatchEvent(new Event('click'));
  }
});