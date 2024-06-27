!function(){"use strict";var e,t,r=function(){if("object"==typeof self&&self)return self;if("object"==typeof window&&window)return window;throw new Error("Unable to resolve global `this`")},i=function(){const e=function(){if("object"==typeof globalThis&&globalThis)return globalThis;try{Object.defineProperty(Object.prototype,"__global__",{get:function(){return this},configurable:!0})}catch(e){return r()}try{return __global__||r()}finally{delete Object.prototype.__global__}}();return void 0!==e.process&&e.process.versions&&e.process.versions.node};e=window,t=function(){var e,t,r;function o(e,r){if(i())return t.createCanvas(e,r);var o=document.createElement("canvas");return o.width=e,o.height=r,o}i()?(t=require("canvas"),e=t.Image,r=t.loadImage):e=Image;var a={},n=a,s=function(t){var s,l,d,g,h,c=1,u={red:255,green:0,blue:255,alpha:255},f={r:0,g:0,b:0,a:0},m={flat:function(e,t){e[t]=u.red,e[t+1]=u.green,e[t+2]=u.blue,e[t+3]=u.alpha},movement:function(e,t,r,i){e[t]=(i.r*(u.red/255)+u.red)/2,e[t+1]=(i.g*(u.green/255)+u.green)/2,e[t+2]=(i.b*(u.blue/255)+u.blue)/2,e[t+3]=i.a},flatDifferenceIntensity:function(e,t,r,i){e[t]=u.red,e[t+1]=u.green,e[t+2]=u.blue,e[t+3]=T(r,i)},movementDifferenceIntensity:function(e,t,r,i){var o=T(r,i)/255*.8;e[t]=i.r*(u.red/255)*(1-o)+o*u.red,e[t+1]=i.g*(u.green/255)*(1-o)+o*u.green,e[t+2]=i.b*(u.blue/255)*(1-o)+o*u.blue,e[t+3]=i.a},diffOnly:function(e,t,r,i){e[t]=i.r,e[t+1]=i.g,e[t+2]=i.b,e[t+3]=i.a}},p=m.flat,b=1200,v=!0,y={},w=[],_=[],x={red:16,green:16,blue:16,alpha:16,minBrightness:16,maxBrightness:240},C=!1,I=!1,M=!1,S=!1;function T(e,t){return(Math.abs(e.r-t.r)+Math.abs(e.g-t.g)+Math.abs(e.b-t.b))/3}function k(e,t,r,i,o){return e>(o.left||0)&&e<(o.right||r)&&t>(o.top||0)&&t<(o.bottom||i)}function B(){var e,t=_.length;for(e=0;e<t;e++)"function"==typeof _[e]&&_[e](y)}function D(e,t,r){var i,o;for(i=0;i<e;i++)for(o=0;o<t;o++)r(i,o)}function O(e,t){var r=e.width,i=e.height;M&&1===w.length&&(r=w[0].width,i=w[0].height);var a,n=o(r,i);n.getContext("2d").drawImage(e,0,0,r,i),a=n.getContext("2d").getImageData(0,0,r,i),w.push(a),t(a,r,i)}function P(t,o){var a,n=new e;n.setAttribute||(n.setAttribute=function e(){}),v&&n.setAttribute("crossorigin","anonymous"),n.onerror=function(e){n.onload=null,n.onerror=null,w.push({error:`Failed to load image '${t}'. ${e?e+"":"Unknown error"}`}),o()},n.onload=function(){n.onload=null,n.onerror=null,O(n,o)},"string"==typeof t?(n.src=t,!i()&&n.complete&&n.naturalWidth>0&&n.onload()):void 0!==t.data&&"number"==typeof t.width&&"number"==typeof t.height?(w.push(t),o(t,t.width,t.height)):"undefined"!=typeof Buffer&&t instanceof Buffer?r(t).then((function(e){n.onload=null,n.onerror=null,O(e,o)})).catch((function(e){w.push({error:e?e+"":"Image load error."}),o()})):((a=new FileReader).onload=function(e){n.src=e.target.result},a.readAsDataURL(t))}function R(e,t,r){var i=Math.abs(e-t);return void 0!==e&&void 0!==t&&(e===t||i<x[r])}function A(e,t){var r=R(e.a,t.a,"alpha");return R(e.brightness,t.brightness,"minBrightness")&&r}function j(e,t,r){return.3*e+.59*t+.11*r}function E(e,t,r,i,o,a){var n,s,l,d,g=0,h=0,c=0;for(W(e),n=-1;n<=1;n++)for(s=-1;s<=1;s++)if(0===n&&0===s);else{if(!z(f,t,4*((i+s)*a+(o+n))))continue;if(N(f),W(f),Math.abs(e.brightness-f.brightness)>x.maxBrightness&&g++,(l=e).r===(d=f).r&&l.g===d.g&&l.b===d.b&&c++,Math.abs(f.h-e.h)>.3&&h++,h>1||g>1)return!0}return c<2}function $(e,t,r){"diffOnly"!==s&&(e[t]=r.brightness,e[t+1]=r.brightness,e[t+2]=r.brightness,e[t+3]=r.a*c)}function z(e,t,r){return t.length>r&&(e.r=t[r],e.g=t[r+1],e.b=t[r+2],e.a=t[r+3],!0)}function N(e){e.brightness=j(e.r,e.g,e.b)}function W(e){e.h=function t(e,r,i){var o,a,n=e/255,s=r/255,l=i/255,d=Math.max(n,s,l),g=Math.min(n,s,l);if(d===g)o=0;else switch(a=d-g,d){case n:o=(s-l)/a+(s<l?6:0);break;case s:o=(l-n)/a+2;break;case l:o=(n-s)/a+4;break;default:o/=6}return o}(e.r,e.g,e.b)}function H(e,t,r){var i;return e.height<r||e.width<t?((i=o(t,r).getContext("2d")).putImageData(e,0,0),i.getImageData(0,0,t,r)):e}function U(e){var t;if(e.errorColor)for(t in e.errorColor)e.errorColor.hasOwnProperty(t)&&(u[t]=void 0===e.errorColor[t]?u[t]:e.errorColor[t]);e.errorType&&m[e.errorType]&&(p=m[e.errorType],s=e.errorType),e.errorPixel&&"function"==typeof e.errorPixel&&(p=e.errorPixel),c=isNaN(Number(e.transparency))?c:e.transparency,void 0!==e.largeImageThreshold&&(b=e.largeImageThreshold),void 0!==e.useCrossOrigin&&(v=e.useCrossOrigin),void 0!==e.boundingBox&&(l=[e.boundingBox]),void 0!==e.ignoredBox&&(d=[e.ignoredBox]),void 0!==e.boundingBoxes&&(l=e.boundingBoxes),void 0!==e.ignoredBoxes&&(d=e.ignoredBoxes),void 0!==e.ignoreAreasColoredWith&&(g=e.ignoreAreasColoredWith)}function L(e){var r,i="function"==typeof e;i||(r=e);var u={setReturnEarlyThreshold:function(e){return e&&(S=!0,h=e),u},scaleToSameSize:function(){return M=!0,i&&e(),u},useOriginalSize:function(){return M=!1,i&&e(),u},ignoreNothing:function(){return x.red=0,x.green=0,x.blue=0,x.alpha=0,x.minBrightness=0,x.maxBrightness=255,C=!1,I=!1,i&&e(),u},ignoreLess:function(){return x.red=16,x.green=16,x.blue=16,x.alpha=16,x.minBrightness=16,x.maxBrightness=240,C=!1,I=!1,i&&e(),u},ignoreAntialiasing:function(){return x.red=32,x.green=32,x.blue=32,x.alpha=32,x.minBrightness=64,x.maxBrightness=96,C=!0,I=!1,i&&e(),u},ignoreColors:function(){return x.alpha=16,x.minBrightness=16,x.maxBrightness=240,C=!1,I=!0,i&&e(),u},ignoreAlpha:function(){return x.red=16,x.green=16,x.blue=16,x.alpha=255,x.minBrightness=16,x.maxBrightness=240,C=!1,I=!1,i&&e(),u},repaint:function(){return i&&e(),u},outputSettings:function(e){return U(e),u},onComplete:function(e){_.push(e);var i=function(){!function e(t,r){function i(){var e,t;if(2===w.length){if(w[0].error||w[1].error)return(y={}).error=w[0].error?w[0].error:w[1].error,void B();e=w[0].width>w[1].width?w[0].width:w[1].width,t=w[0].height>w[1].height?w[0].height:w[1].height,y.isSameDimensions=w[0].width===w[1].width&&w[0].height===w[1].height,y.dimensionDifference={width:w[0].width-w[1].width,height:w[0].height-w[1].height},function r(e,t,i,a){var n,u,f,m,v=e.data,w=t.data;S||(n=o(i,a),u=n.getContext("2d"),f=u.createImageData(i,a),m=f.data);var _,x=0,M={top:a,left:i,bottom:0,right:0},B=function(e,t){M.left=Math.min(e,M.left),M.right=Math.max(e,M.right),M.top=Math.min(t,M.top),M.bottom=Math.max(t,M.bottom)},O=Date.now();b&&C&&(i>b||a>b)&&(_=6);var P={r:0,g:0,b:0,a:0},j={r:0,g:0,b:0,a:0},W=!1;D(i,a,(function(e,t){if(!W&&(!_||t%_!=0&&e%_!=0)){var r=4*(t*i+e);if(z(P,v,r)&&z(j,w,r)){var o=function n(e,t,r,i,o){var a,n,s,h=!0;if(l instanceof Array)for(n=!1,a=0;a<l.length;a++)if(k(e,t,r,i,l[a])){n=!0;break}if(d instanceof Array)for(s=!0,a=0;a<d.length;a++)if(k(e,t,r,i,d[a])){s=!1;break}return g?0!==T(o,g):void 0===n&&void 0===s||(!1!==n||!0!==s)&&(!0!==n&&!0!==s||(h=!0),!1!==n&&!1!==s||(h=!1),h)}(e,t,i,a,j);if(I)return N(P),N(j),void(A(P,j)||!o?S||$(m,r,j):(S||p(m,r,P,j),x++,B(e,t)));!function u(e,t){var r=R(e.r,t.r,"red"),i=R(e.g,t.g,"green"),o=R(e.b,t.b,"blue"),a=R(e.a,t.a,"alpha");return r&&i&&o&&a}(P,j)&&o?C&&(N(P),N(j),E(P,v,0,t,e,i)||E(j,w,0,t,e,i))&&(A(P,j)||!o)?S||$(m,r,j):(S||p(m,r,P,j),x++,B(e,t)):S||function f(e,t,r){"diffOnly"!==s&&(e[t]=r.r,e[t+1]=r.g,e[t+2]=r.b,e[t+3]=r.a*c)}(m,r,P),S&&x/(a*i)*100>h&&(W=!0)}}})),y.rawMisMatchPercentage=x/(a*i)*100,y.misMatchPercentage=y.rawMisMatchPercentage.toFixed(2),y.diffBounds=M,y.analysisTime=Date.now()-O,y.getImageDataUrl=function(e){if(S)throw Error("No diff image available - ran in compareOnly mode");var t=0;return e&&(t=function r(e,t,i){t.font="12px sans-serif";var o=t.measureText(e).width+4;return o>i.width&&(i.width=o),i.height+=22,t.fillStyle="#666",t.fillRect(0,0,i.width,18),t.fillStyle="#fff",t.fillRect(0,18,i.width,4),t.fillStyle="#fff",t.textBaseline="top",t.font="12px sans-serif",t.fillText(e,2,1),22}(e,u,n)),u.putImageData(f,0,t),n.toDataURL("image/png")},!S&&n.toBuffer&&(y.getBuffer=function(r){if(r){var i=n.width+2;n.width=3*i,u.putImageData(e,0,0),u.putImageData(t,i,0),u.putImageData(f,2*i,0)}else u.putImageData(f,0,0);return n.toBuffer()})}(H(w[0],e,t),H(w[1],e,t),e,t),B()}}n!==a&&U(n),w=[],P(t,i),P(r,i)}(t,r)};return i(),L(i)},setupCustomTolerance:function(e){for(var t in x)e.hasOwnProperty(t)&&(x[t]=e[t])}};return u}var V={onComplete:function(e){_.push(e),P(t,(function(e,t,r){!function i(e,t,r){var i=0,o=0,a=0,n=0,s=0,l=0,d=0,g=0;D(t,r,(function(r,h){var c=4*(h*t+r),u=e[c],f=e[c+1],m=e[c+2],p=e[c+3],b=j(u,f,m);u===f&&u===m&&p&&(0===u?g++:255===u&&d++),i++,o+=u/255*100,a+=f/255*100,n+=m/255*100,s+=(255-p)/255*100,l+=b/255*100})),y.red=Math.floor(o/i),y.green=Math.floor(a/i),y.blue=Math.floor(n/i),y.alpha=Math.floor(s/i),y.brightness=Math.floor(l/i),y.white=Math.floor(d/i*100),y.black=Math.floor(g/i*100),B()}(e.data,t,r)}))},compareTo:function(e){return L(e)},outputSettings:function(e){return U(e),V}};return V};function l(e,t,r){switch(t){case"nothing":e.ignoreNothing();break;case"less":e.ignoreLess();break;case"antialiasing":e.ignoreAntialiasing();break;case"colors":e.ignoreColors();break;case"alpha":e.ignoreAlpha();break;default:throw new Error("Invalid ignore: "+t)}e.setupCustomTolerance(r)}return s.compare=function(e,t,r,i){var o,a;"function"==typeof r?(o=r,a={}):(o=i,a=r||{});var n,d=s(e);a.output&&d.outputSettings(a.output),n=d.compareTo(t),a.returnEarlyThreshold&&n.setReturnEarlyThreshold(a.returnEarlyThreshold),a.scaleToSameSize&&n.scaleToSameSize();var g=a.tolerance||{};"string"==typeof a.ignore?l(n,a.ignore,g):a.ignore&&a.ignore.forEach&&a.ignore.forEach((function(e){l(n,e,g)})),n.onComplete((function(e){e.error?o(e.error):o(null,e)}))},s.outputSettings=function d(e){return n=e,s},s},"function"==typeof define&&define.amd?define([],t):"object"==typeof module&&module.exports?module.exports=t():e.resemble=t();
/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const o=Polymer.html`
<style include="shared-styles">
  :host {
    background-color: var(--table-header-background-color, #fafafa);
    display: block;
    font-family: var(--font-family);
  }
  #header {
    align-items: center;
    border-bottom: 1px solid var(--border-color, #ddd);
    border-top: 1px solid var(--border-color, #ddd);
    display: inline-flex;
    padding: .5em;
    width: 100%;
  }
  h3 {
    padding: 0 .5em;
  }
  #dropdown {
    background-color: var(--view-background-color);
    border: 1px solid var(--border-color);
    border-radius: 2px;
    color: var(--primary-text-color);
    font-size: var(--font-size-normal);
    height: 2em;
    margin-left: 1em;
    padding: 0 .15em;
  }
  .diffmode {
    align-items: center;
    display: flex;
    justify-content: center;
  }
</style>
<div id="header">
  <h3>Image diff</h3>
  <select value="{{_observeMode::change}}" id="dropdown">
    <option value="resemble" title="Scale the images to the same size and compute a diff with highlights">Highlight differences</option>
    <option value="opacity" title="Overlay the new image over the old and use an opacity control to view the differences">Onion skin</option>
  </select>
</div>
<div class="diffmode">
  <template is="dom-if" if="[[_showResembleMode]]" restamp="true">
    <gr-resemble-diff-mode
        base-image="[[baseImage]]"
        revision-image="[[revisionImage]]"></gr-resemble-diff-mode>
  </template>
</div>
<div class="diffmode">
  <template is="dom-if" if="[[_showOpacityMode]]" restamp="true">
    <gr-opacity-diff-mode
        base-image="[[baseImage]]"
        revision-image="[[revisionImage]]"></gr-opacity-diff-mode>
  </template>
</div>`
/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */,a=Polymer.html`
    <style>
      :host {
        display: block;
      }
      .wrapper {
        box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
        margin: 1em 0;
      }
      img {
        display: block;
        height: var(--img-height);
        margin: auto;
        position: absolute;
        width: var(--img-width);
      }
      #imageRevision {
        opacity: var(--my-opacity-value);
        z-index: 0.5;
      }
      #imageDiffContainer {
        height: var(--div-height);
        margin: auto;
        width: var(--div-width);
      }
      #controlsContainer {
        border-top: 1px solid var(--border-color, #ddd);
        display: flex;
      }
      #controlsBox {
        display: flex;
        justify-content: space-between;
        margin: 0 .5em;
        min-width: 32em;
        width: 100%;
      }
      label {
        align-items: center;
        display: flex;
        padding: 1em .5em;
      }
      input {
        margin: .5em;
      }
      #opacitySlider {
        width: 10em;
      }
    </style>
    <div class="wrapper">
      <div id="imageDiffContainer">
        <img on-load="_onImageLoad" id="imageBase"/>
        <img on-load="_onImageLoad" data-opacity$="{{opacityValue}}" id="imageRevision"/>
      </div>
      <div id="controlsContainer">
        <div id="controlsBox">
          <label>
            <input
                id="scaleSizesToggle"
                on-click="handleScaleSizesToggle"
                type="checkbox">
            Scale to same size
          </label>
          <label>
            Revision image opacity
            <input
                id="opacitySlider"
                max="1.0"
                min="0.0"
                on-input="handleOpacityChange"
                step=".01"
                type="range"
                value="0.5"/>
          </label>
        </div>
      </div>
    </div>`
/**
 * @license
 * Copyright (C) 2018 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */;class n extends Polymer.Element{static get is(){return"gr-opacity-diff-mode"}static get template(){return a}static get properties(){return{baseImage:Object,revisionImage:Object,opacityValue:Number,_maxHeight:{type:Number,value:0},_maxWidth:{type:Number,value:0}}}static get observers(){return["_handleImageChange(baseImage, revisionImage)","_handleHeightChange(_maxHeight)","_handleWidthChange(_maxWidth)"]}_onImageLoad(e){this._maxHeight=Math.max(this._maxHeight,Polymer.dom(e).rootTarget.naturalHeight),this._maxWidth=Math.max(this._maxWidth,Polymer.dom(e).rootTarget.naturalWidth)}_handleImageChange(e,t){[e,t].includes(void 0)||(this.$.imageRevision.setAttribute("src",this.computeSrcString(t)),this.$.imageBase.setAttribute("src",this.computeSrcString(e)),this.handleOpacityChange())}handleOpacityChange(){this.updateStyles({"--my-opacity-value":this.$.opacitySlider.value})}computeSrcString(e){return"data:"+e.type+";base64, "+e.body}handleScaleSizesToggle(){let e,t;this.$.scaleSizesToggle.checked&&(e=this._maxWidth,t=this._maxHeight),this.updateStyles({"--img-width":e?e+"px":null,"--img-height":t?t+"px":null})}_handleHeightChange(e){e&&this.updateStyles({"--div-height":`${e}px`})}_handleWidthChange(e){e&&this.updateStyles({"--div-width":`${e}px`})}}customElements.define(n.is,n);
/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const s=Polymer.html`
    <style>
      :host {
        display: block;
      }
      h2 {
        display: none;
      }
      :host([loading]) #imageDiff {
        display: none;
      }
      :host([loading]) h2 {
        display: inline;
        padding: 1em 0;
      }
      .toggle {
        padding: .5em;
      }
      #controlsContainer {
        align-items: center;
        border-top: 1px solid var(--border-color, #ddd);
        display: flex;
        justify-content: space-between;
        padding: 1em;
        white-space: nowrap;
        width: 100%;
      }
      #diffContainer {
        display: block;
        width: 100%;
      }
      #color {
        border: 1px solid var(--border-color, #ddd);
        border-radius: 2px;
      }
      #fullscreen {
        border: 1px solid var(--border-color, #ddd);
        border-radius: 2px;
        color: var(--primary-text-color, #000);
        padding: .5em;
      }
      #controlsContainer,
      #color,
      #fullscreen {
        background-color: var(--table-header-background-color, #fafafa);
      }
      #color:hover,
      #fullscreen:hover {
        background-color: var(--header-background-color, #eeeeee);
      }
      #imageDiff {
        display: block;
        height: auto;
        margin: auto;
        max-width: 50em;
      }
      #modeContainer {
        box-shadow: 0 1px 3px rgba(0, 0, 0, .3);
        display: block;
        margin: 1em 0em;
        width: 50em;
      }
    </style>
    <div id="modeContainer">
      <div id="diffContainer">
        <h2>Loading...</h2>
        <img id="imageDiff">
      </div>
      <div id="controlsContainer">
        <div>[[_difference]]% changed</div>
        <label class="toggle">
          <input
              id="ignoreColorsToggle"
              type="checkbox"
              checked$="[[_ignoreColors]]"
              on-click="_handleIgnoreColorsToggle">
          Ignore colors
        </label>
        <label class="toggle">
          <input
              id="transparentToggle"
              type="checkbox"
              checked$="[[_transparent]]"
              on-click="_handleTransparentToggle">
          Transparent
        </label>
        <input
            id="color"
            type="color"
            value="{{_colorValue::change}}">
        <button
            id="fullscreen"
            on-click="_handleFullScreen">
          View full sized
        </button>
      </div>
    </div>`
/**
 * @license
 * Copyright (C) 2018 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */,l={errorType:"flat",largeImageThreshold:1200};class d extends Polymer.Element{static get is(){return"gr-resemble-diff-mode"}static get template(){return s}static get properties(){return{baseImage:Object,revisionImage:Object,_colorValue:{type:String,observer:"_handleColorChange",value:"#00ffff"},_difference:{type:Number,value:0},_ignoreColors:{type:Boolean,value:!1},_transparent:{type:Boolean,value:!1},loading:{type:Boolean,value:!1,reflectToAttribute:!0}}}static get observers(){return["_handleImageDiff(baseImage, revisionImage)"]}connectedCallback(){super.connectedCallback(),window.resemble.outputSettings(l)}_handleImageDiff(e,t){[e,t].includes(void 0)||this.reload()}_setImageDiffSrc(e){this.$.imageDiff.removeAttribute("src"),this.$.imageDiff.setAttribute("src",e)}_setDifferenceValue(e){this._difference=e}_getDataUrl(e){return"data:"+e.type+";base64,"+e.body}_maybeIgnoreColors(e,t){return t?e.ignoreColors():e.ignoreNothing(),e}_createDiffProcess(e,t,r){window.resemble.outputSettings(this._setOutputSetting());const i=window.resemble(e).compareTo(t);return this._maybeIgnoreColors(i,r)}_setOutputSetting(){const e=this._hexToRGB(this._colorValue);return{transparency:this._transparent?.1:1,errorColor:{red:e.r,green:e.g,blue:e.b}}}reload(){if(this.loading=!0,this.baseImage&&this.revisionImage){const e=this._getDataUrl(this.baseImage),t=this._getDataUrl(this.revisionImage);return new Promise(((r,i)=>{this._createDiffProcess(e,t,this._ignoreColors).onComplete((e=>{this._setImageDiffSrc(e.getImageDataUrl()),this._setDifferenceValue(e.misMatchPercentage),this.loading=!1,r()}))}))}this.loading=!1}_handleIgnoreColorsToggle(){this._ignoreColors=!this._ignoreColors,this.reload()}_handleTransparentToggle(){this._transparent=!this._transparent,this.reload()}_handleColorChange(){this.reload()}_hexToRGB(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}_handleFullScreen(){window.open("about:blank","_blank").document.body.appendChild(this.$.imageDiff.cloneNode(!0))}}customElements.define(d.is,d);
/**
 * @license
 * Copyright (C) 2018 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const g="opacity",h="resemble";class c extends Polymer.Element{static get is(){return"gr-image-diff-tool"}static get template(){return o}static get properties(){return{baseImage:Object,revisionImage:Object,hidden:{type:Boolean,value:!1,reflectToAttribute:!0},_showResembleMode:Boolean,_showOpacityMode:Boolean,_observeMode:{type:String,observer:"_handleSelect"}}}connectedCallback(){super.connectedCallback(),this.baseImage&&this.revisionImage||(this.hidden=!0),this._getMode()===g?this._displayOpacityMode():this._displayResembleMode()}_getMode(){return window.localStorage.getItem("image-diff-mode")}_setMode(e){window.localStorage.setItem("image-diff-mode",e)}_handleSelect(e){e===g?this._displayOpacityMode():this._displayResembleMode()}_displayResembleMode(){this._observeMode=h,this._showResembleMode=!0,this._showOpacityMode=!1,this._setMode(h)}_displayOpacityMode(){this._observeMode=g,this._showResembleMode=!1,this._showOpacityMode=!0,this._setMode(g)}}customElements.define(c.is,c),
/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Gerrit.install((e=>{e.registerCustomComponent("image-diff","gr-image-diff-tool")}))}();