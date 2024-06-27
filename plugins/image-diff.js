!function(){"use strict";
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
 */const e=Polymer.html`
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
 */,t=Polymer.html`
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
 */;class i extends Polymer.Element{static get is(){return"gr-opacity-diff-mode"}static get template(){return t}static get properties(){return{baseImage:Object,revisionImage:Object,opacityValue:Number,_maxHeight:{type:Number,value:0},_maxWidth:{type:Number,value:0}}}static get observers(){return["_handleImageChange(baseImage, revisionImage)","_handleHeightChange(_maxHeight)","_handleWidthChange(_maxWidth)"]}_onImageLoad(e){this._maxHeight=Math.max(this._maxHeight,Polymer.dom(e).rootTarget.naturalHeight),this._maxWidth=Math.max(this._maxWidth,Polymer.dom(e).rootTarget.naturalWidth)}_handleImageChange(e,t){[e,t].includes(void 0)||(this.$.imageRevision.setAttribute("src",this.computeSrcString(t)),this.$.imageBase.setAttribute("src",this.computeSrcString(e)),this.handleOpacityChange())}handleOpacityChange(){this.updateStyles({"--my-opacity-value":this.$.opacitySlider.value})}computeSrcString(e){return"data:"+e.type+";base64, "+e.body}handleScaleSizesToggle(){let e,t;this.$.scaleSizesToggle.checked&&(e=this._maxWidth,t=this._maxHeight),this.updateStyles({"--img-width":e?e+"px":null,"--img-height":t?t+"px":null})}_handleHeightChange(e){e&&this.updateStyles({"--div-height":`${e}px`})}_handleWidthChange(e){e&&this.updateStyles({"--div-width":`${e}px`})}}customElements.define(i.is,i);
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
const a=Polymer.html`
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
 */,o={errorType:"flat",largeImageThreshold:1200};class r extends Polymer.Element{static get is(){return"gr-resemble-diff-mode"}static get template(){return a}static get properties(){return{baseImage:Object,revisionImage:Object,_colorValue:{type:String,observer:"_handleColorChange",value:"#00ffff"},_difference:{type:Number,value:0},_ignoreColors:{type:Boolean,value:!1},_transparent:{type:Boolean,value:!1},loading:{type:Boolean,value:!1,reflectToAttribute:!0}}}static get observers(){return["_handleImageDiff(baseImage, revisionImage)"]}connectedCallback(){super.connectedCallback(),window.resemble.outputSettings(o)}_handleImageDiff(e,t){[e,t].includes(void 0)||this.reload()}_setImageDiffSrc(e){this.$.imageDiff.removeAttribute("src"),this.$.imageDiff.setAttribute("src",e)}_setDifferenceValue(e){this._difference=e}_getDataUrl(e){return"data:"+e.type+";base64,"+e.body}_maybeIgnoreColors(e,t){return t?e.ignoreColors():e.ignoreNothing(),e}_createDiffProcess(e,t,i){window.resemble.outputSettings(this._setOutputSetting());const a=window.resemble(e).compareTo(t);return this._maybeIgnoreColors(a,i)}_setOutputSetting(){const e=this._hexToRGB(this._colorValue);return{transparency:this._transparent?.1:1,errorColor:{red:e.r,green:e.g,blue:e.b}}}reload(){if(this.loading=!0,this.baseImage&&this.revisionImage){const e=this._getDataUrl(this.baseImage),t=this._getDataUrl(this.revisionImage);return new Promise(((i,a)=>{this._createDiffProcess(e,t,this._ignoreColors).onComplete((e=>{this._setImageDiffSrc(e.getImageDataUrl()),this._setDifferenceValue(e.misMatchPercentage),this.loading=!1,i()}))}))}this.loading=!1}_handleIgnoreColorsToggle(){this._ignoreColors=!this._ignoreColors,this.reload()}_handleTransparentToggle(){this._transparent=!this._transparent,this.reload()}_handleColorChange(){this.reload()}_hexToRGB(e){const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}_handleFullScreen(){window.open("about:blank","_blank").document.body.appendChild(this.$.imageDiff.cloneNode(!0))}}customElements.define(r.is,r);
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
const s="opacity",l="resemble";class d extends Polymer.Element{static get is(){return"gr-image-diff-tool"}static get template(){return e}static get properties(){return{baseImage:Object,revisionImage:Object,hidden:{type:Boolean,value:!1,reflectToAttribute:!0},_showResembleMode:Boolean,_showOpacityMode:Boolean,_observeMode:{type:String,observer:"_handleSelect"}}}connectedCallback(){super.connectedCallback(),this.baseImage&&this.revisionImage||(this.hidden=!0),this._getMode()===s?this._displayOpacityMode():this._displayResembleMode()}_getMode(){return window.localStorage.getItem("image-diff-mode")}_setMode(e){window.localStorage.setItem("image-diff-mode",e)}_handleSelect(e){e===s?this._displayOpacityMode():this._displayResembleMode()}_displayResembleMode(){this._observeMode=l,this._showResembleMode=!0,this._showOpacityMode=!1,this._setMode(l)}_displayOpacityMode(){this._observeMode=s,this._showResembleMode=!1,this._showOpacityMode=!0,this._setMode(s)}}customElements.define(d.is,d),
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