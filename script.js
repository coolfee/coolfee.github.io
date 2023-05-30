/*==================================
====== LocalStorage functions ======
====================================*/
ls = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => JSON.parse(localStorage.getItem(key) || 'false') || false
};

/*==================================
========== Hash functions ==========
====================================*/
const hash = (function (window) {
  return {
    load: function () {
      try {
        const json_str_escaped = window.location.hash.slice(1);
        const json_str = decodeURIComponent(json_str_escaped);
        return JSON.parse(json_str);
      } catch (e) {
        return false;
      }
    },
    save: function (obj) {
      window.location.replace('#' + JSON.stringify(obj));
    }
  };
})(window);