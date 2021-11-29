// Native Javascript for Pages 4.0 
(function (root, factory) { 
if (typeof define === 'function' && define.amd) {
    // AMD support:
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like:
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    var pg = factory();

  }
}(this, function () {

/* ============================================================
 * Pages Core : v4.0.0
 * ============================================================
 * Author - Ace
 * Copright 2018
 */
  "use strict";
  var globalObject = typeof global !== 'undefined' ? global : this||window,
  doc = document.documentElement, body = document.body,
 // function toggle attributes
  dataToggle    = 'data-toggle',
  dataInit = 'data-pages',
  
  // components
  stringSideBar = 'SideBar',
  stringParallax = 'Parallax',
  stringMobileView = 'MobileView',
  stringQuickView = 'Quickview',
  stringProgress = 'Progress',
  stringListView = 'ListView',
  stringCard = 'Card',
  stringNotification = 'Notification',
  
  // event names
  clickEvent    = 'click',
  hoverEvent    = 'hover',
  keydownEvent  = 'keydown',
  resizeEvent   = 'resize',
  scrollEvent   = 'scroll',
  // originalEvents
  showEvent     = 'show',
  shownEvent    = 'shown',
  hideEvent     = 'hide',
  hiddenEvent   = 'hidden',
  closeEvent    = 'close',
  closedEvent   = 'closed',
  slidEvent     = 'slid',
  slideEvent    = 'slide',
  changeEvent   = 'change',

  // other
  getAttribute            = 'getAttribute',
  setAttribute            = 'setAttribute',
  hasAttribute            = 'hasAttribute',
  getElementsByTagName    = 'getElementsByTagName',
  getBoundingClientRect   = 'getBoundingClientRect',
  querySelectorAll        = 'querySelectorAll',
  getElementsByCLASSNAME  = 'getElementsByClassName',

  indexOf      = 'indexOf',
  parentNode   = 'parentNode',
  length       = 'length',
  toLowerCase  = 'toLowerCase',
  Transition   = 'Transition',
  Webkit       = 'Webkit',
  style        = 'style',

  active     = 'active',
  showClass  = 'show',

  // modal
  modalOverlay = 0;
  var Pages = function(){
      this.pageScrollElement = 'html, body';
      this.$body = document.getElementsByTagName('body');
      /** @function setUserOS
      * @description SET User Operating System eg: mac,windows,etc
      * @returns {string} - Appends OSName to Pages.$body
      */
      this.setUserOS = function() {
          var OSName = "";
          if (navigator.appVersion.indexOf("Win") != -1) OSName = "windows";
          if (navigator.appVersion.indexOf("Mac") != -1) OSName = "mac";
          if (navigator.appVersion.indexOf("X11") != -1) OSName = "unix";
          if (navigator.appVersion.indexOf("Linux") != -1) OSName = "linux";

          addClass(this.$body,OSName);
      };

      /** @function setUserAgent
      * @description SET User Device Name to mobile | desktop
      * @returns {string} - Appends Device to Pages.$body
      */
      this.setUserAgent = function() {
          if (navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)) {
              addClass(this.$body,'mobile');
          } else {
              this.addClass(this.$body,'desktop');
              if (navigator.userAgent.match(/MSIE 9.0/)) {
              addClass(this.$body,'ie9');
              }
          }
      };

      /** @function isVisibleXs
      * @description Checks if the screen size is XS - Extra Small i.e below W480px
      * @returns {$Element} - Appends $('#pg-visible-xs') to Body
      */
      this.isVisibleXs = function() {
          var $pg_el = document.getElementById('pg-visible-xs');

          if(!$pg_el){
            var $util_el = document.createElement('div');
            $util_el.className = "visible-xs";
            $util_el.setAttribute("id","pg-visible-xs");
            this.$body[0].appendChild($util_el)
            $pg_el = document.getElementById('pg-visible-xs');
          }
          return ($pg_el.offsetWidth === 0 && $pg_el.offsetHeight === 0) ? false : true;
      };

      /** @function isVisibleSm
      * @description Checks if the screen size is SM - Small Screen i.e Above W480px
      * @returns {$Element} - Appends $('#pg-visible-sm') to Body
      */
      this.isVisibleSm = function() {
          var $pg_el = document.getElementById('pg-visible-sm');

          if(!$pg_el){
            var $util_el = document.createElement('div');
            $util_el.className = "visible-sm";
            $util_el.setAttribute("id","pg-visible-sm");
            this.$body[0].appendChild($util_el)
            $pg_el = document.getElementById('pg-visible-sm');
          }
          return ($pg_el.offsetWidth === 0 && $pg_el.offsetHeight === 0) ? false : true;
      };

      /** @function isVisibleMd
      * @description Checks if the screen size is MD - Medium Screen i.e Above W1024px
      * @returns {$Element} - Appends $('#pg-visible-md') to Body
      */
      this.isVisibleMd = function() {
          var $pg_el = document.getElementById('pg-visible-md')

          if(!$pg_el){
            var $util_el = document.createElement('div');
            $util_el.className = "visible-md";
            $util_el.setAttribute("id","pg-visible-sm");
            this.$body[0].appendChild($util_el)
            $pg_el = document.getElementById('pg-visible-md');
          }
          return ($pg_el.offsetWidth === 0 && $pg_el.offsetHeight === 0) ? false : true;
      };

      /** @function isVisibleLg
      * @description Checks if the screen size is LG - Large Screen i.e Above W1200px
      * @returns {$Element} - Appends $('#pg-visible-lg') to Body
      */
      this.isVisibleLg = function() {
          var $pg_el = document.getElementById('pg-visible-lg');
          var $util_el = document.createElement('div');
          $util_el.className = "visible-lg";
          $util_el.setAttribute("id","pg-visible-lg");

          if(!$pg_el){
              this.$body[0].appendChild($util_el)
              $pg_el = document.getElementById('pg-visible-lg');
          }
          return ($pg_el.offsetWidth === 0 && $pg_el.offsetHeight === 0) ? false : true;
      };

      /** @function getUserAgent
      * @description Get Current User Agent.
      * @returns {string} - mobile | desktop
      */
      this.getUserAgent = function() {
          return this.hasClass(document.getElementsByTagName("body"),"mobile") ? "mobile" : "desktop";
      };

      /** @function setFullScreen
      * @description Make Browser fullscreen.
      */
      this.setFullScreen = function(element) {
          // Supports most browsers and their versions.
          var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

          if (requestMethod) { // Native full screen.
              requestMethod.call(element);
          } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
              var wscript = new ActiveXObject("WScript.Shell");
              if (wscript !== null) {
                  wscript.SendKeys("{F11}");
              }
          }
      };

      /** @function getColor
      * @description Get Color from CSS
      * @param {string} color - pages color class eg: primary,master,master-light etc.
      * @param {int} opacity
      * @returns {rgba}
      */
      this.getColor = function(color, opacity) {
          opacity = parseFloat(opacity) || 1;
          var elem = "";
          var colorElem = "";
          if(document.querySelectorAll(".pg-colors").length ){
             elem = document.querySelector(".pg-colors");
          }
          else{
                elem = document.createElement('div');
                elem.className = "pg-colors";
                document.getElementsByTagName('body')[0].appendChild(elem);

          }
          if(elem.querySelectorAll('[data-color="' + color + '"]').length ){
             colorElem = document.querySelector('[data-color="' + color + '"]');
          }
          else{
                colorElem = document.createElement('div');
                colorElem.className = 'bg-' + color;
                colorElem.dataset.color = color;
                elem.appendChild(colorElem);
          }
          var style = window.getComputedStyle ? window.getComputedStyle(colorElem) : colorElem.currentStyle;
          var color = style.backgroundColor;
          var rgb = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
                    if(rgb == null){
            return;
          }
          var rgba = "rgba(" + rgb[1] + ", " + rgb[2] + ", " + rgb[3] + ', ' + opacity + ')';
          return rgba;
      };


      // Init DATA API
      this.initializeDataAPI = function( component, constructor, collection ){
        for (var i=0; i < collection[length]; i++) {
          new constructor(collection[i]);
        }
      };
      // class manipulation, since 2.0.0 requires polyfill.js
      this.hasClass = function(el, className) {
          return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
      };
      this.addClass = function(el, className) {
          if (el.classList) el.classList.add(className);
          else if (!this.hasClass(el, className)) el.className += ' ' + className;
      };
      this.removeClass = function(el, className) {
          if (el.classList) el.classList.remove(className);
          else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
      };
      this.toggleClass = function(el,className){
          if(this.hasClass(el,className)){
              this.removeClass(el,className)
          }else{
              this.addClass(el,className)
          }
      };
      this.wrap = function(el, wrapper) {
          el.parentNode.insertBefore(wrapper, el);
          wrapper.appendChild(el);
      };
      this.wrapAll = function(elms,wrapper) {
          var parent = elms[0].parentNode;
          var previousSibling = elms[0].previousSibling;

          for (var i = 0; elms.length - i; wrapper.firstChild === elms[0] && i++) {
              wrapper.appendChild(elms[i]);
          }
          var nextSibling = previousSibling ? previousSibling.nextSibling : parent.firstChild;
          parent.insertBefore(wrapper, nextSibling);

          return wrapper;
      };
      this.addEvent = function(el, type, handler) {
          if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
      };
      this.removeEvent = function(el, type, handler) {
          if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
      };
      // selection methods
      this.getElementsByClassName = function(element,classNAME) { // returns Array
        return [].slice.call(element[getElementsByCLASSNAME]( classNAME ));
      };
      this.queryElement = function (selector, parent) {
        var lookUp = parent ? parent : document;
        return typeof selector === 'object' ? selector : lookUp.querySelector(selector);
      };
      this.getClosest = function (element, selector) { //element is the element and selector is for the closest parent element to find

        var firstChar = selector.charAt(0);
        for ( ; element && element !== document; element = element[parentNode] ) {// Get closest match
          if ( firstChar === '.' ) {// If selector is a class
            if ( queryElement(selector,element[parentNode]) !== null && hasClass(element,selector.replace('.','')) ) { return element; }
          } else if ( firstChar === '#' ) { // If selector is an ID
            if ( element.id === selector.substr(1) ) { return element; }
          }
        }
        return false;
      };
      this.extend = function(a, b) {
          for (var key in b) {
              if (b.hasOwnProperty(key)) {
                  a[key] = b[key];
              }
          }
          return a;
      };
      this.isTouchDevice = function(){
          return 'ontouchstart' in document.documentElement;
      }
      // event attach jQuery style / trigger  since 1.2.0
      this.on = function (element, event, handler) {
        element.addEventListener(event, handler, false);
      };
      this.off = function(element, event, handler) {
        element.removeEventListener(event, handler, false);
      };
      this.one = function (element, event, handler) { // one since 2.0.4
        on(element, event, function handlerWrapper(e){
          handler(e);
          off(element, event, handlerWrapper);
        });
      };
      this.live = function(selector, event, callback, context) {
        this.addEvent(context || document, event, function(e) {
            var found, el = e.target || e.srcElement;
            while (el && el.matches && el !== context && !(found = el.matches(selector))) el = el.parentElement;
            if (found) callback.call(el, e);
        });
      };
      this.isVisible = function(element){
        return (element.offsetWidth > 0 || element.offsetHeight > 0)
      }
  }
 var pg = new Pages();
 window.pg = pg;

}));