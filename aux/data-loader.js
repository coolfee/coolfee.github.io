const setInnerHTML = async (elm, html) => {
  elm.innerHTML = html;

  Array.from(elm.querySelectorAll("script"))
    .forEach( oldScriptEl => {
      const newScriptEl = document.createElement("script");
      Array.from(oldScriptEl.attributes).forEach( attr => {
        newScriptEl.setAttribute(attr.name, attr.value)
      });
      const scriptText = document.createTextNode(oldScriptEl.innerHTML);
      newScriptEl.appendChild(scriptText);
      oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
  });
}

document.querySelectorAll('[data-includes]').forEach(async (e) => {
  await setInnerHTML(e, await fetch(e.dataset.includes).then((r) => r.text()));
  let file = e.dataset.includes.split('/');
  file = file[file.length-1].split('.');
  file.pop();
  file = file.join('.');
  window.dispatchEvent(new Event("load-" + file));
});