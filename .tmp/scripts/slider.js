/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  'use strict';

  /**
   * Class constructor for Slider MDL component.
   * Implements MDL component design pattern defined at:
   * https://github.com/jasonmayes/mdl-component-design-pattern
   *
   * @constructor
   * @param {HTMLElement} element The element that will be upgraded.
   */
  var MaterialSlider = function MaterialSlider(element) {
    this.element_ = element;
    // Browser feature detection.
    this.isIE_ = window.navigator.msPointerEnabled;
    // Initialize instance.
    this.init();
  };
  window['MaterialSlider'] = MaterialSlider;

  /**
   * Store constants in one place so they can be updated easily.
   *
   * @enum {string | number}
   * @private
   */
  MaterialSlider.prototype.Constant_ = {
    // None for now.
  };

  /**
   * Store strings for class names defined by this component that are used in
   * JavaScript. This allows us to simply change it in one place should we
   * decide to modify at a later date.
   *
   * @enum {string}
   * @private
   */
  MaterialSlider.prototype.CssClasses_ = {
    IE_CONTAINER: 'mdl-slider__ie-container',
    SLIDER_CONTAINER: 'mdl-slider__container',
    BACKGROUND_FLEX: 'mdl-slider__background-flex',
    BACKGROUND_LOWER: 'mdl-slider__background-lower',
    BACKGROUND_UPPER: 'mdl-slider__background-upper',
    IS_LOWEST_VALUE: 'is-lowest-value',
    IS_UPGRADED: 'is-upgraded'
  };

  /**
   * Handle input on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSlider.prototype.onInput_ = function(event) {
    this.updateValueStyles_();
  };

  /**
   * Handle change on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSlider.prototype.onChange_ = function(event) {
    this.updateValueStyles_();
  };

  /**
   * Handle mouseup on element.
   *
   * @param {Event} event The event that fired.
   * @private
   */
  MaterialSlider.prototype.onMouseUp_ = function(event) {
    event.target.blur();
  };

  /**
   * Handle mousedown on container element.
   * This handler is purpose is to not require the use to click
   * exactly on the 2px slider element, as FireFox seems to be very
   * strict about this.
   *
   * @param {Event} event The event that fired.
   * @private
   * @suppress {missingProperties}
   */
  MaterialSlider.prototype.onContainerMouseDown_ = function(event) {
    // If this click is not on the parent element (but rather some child)
    // ignore. It may still bubble up.
    if (event.target !== this.element_.parentElement) {
      return;
    }

    // Discard the original event and create a new event that
    // is on the slider element.
    event.preventDefault();
    var newEvent = new MouseEvent('mousedown', {
      target: event.target,
      buttons: event.buttons,
      clientX: event.clientX,
      clientY: this.element_.getBoundingClientRect().y
    });
    this.element_.dispatchEvent(newEvent);
  };

  /**
   * Handle updating of values.
   *
   * @private
   */
  MaterialSlider.prototype.updateValueStyles_ = function() {
    // Calculate and apply percentages to div structure behind slider.
    var fraction = (this.element_.value - this.element_.min) /
        (this.element_.max - this.element_.min);

    if (fraction === 0) {
      this.element_.classList.add(this.CssClasses_.IS_LOWEST_VALUE);
    } else {
      this.element_.classList.remove(this.CssClasses_.IS_LOWEST_VALUE);
    }

    if (!this.isIE_) {
      this.backgroundLower_.style.flex = fraction;
      this.backgroundLower_.style.webkitFlex = fraction;
      this.backgroundUpper_.style.flex = 1 - fraction;
      this.backgroundUpper_.style.webkitFlex = 1 - fraction;
    }
  };

  // Public methods.

  /**
   * Disable slider.
   *
   * @public
   */
  MaterialSlider.prototype.disable = function() {
    this.element_.disabled = true;
  };
  MaterialSlider.prototype['disable'] = MaterialSlider.prototype.disable;

  /**
   * Enable slider.
   *
   * @public
   */
  MaterialSlider.prototype.enable = function() {

    this.element_.disabled = false;
  };
  MaterialSlider.prototype['enable'] = MaterialSlider.prototype.enable;

  /**
   * Update slider value.
   *
   * @param {number} value The value to which to set the control (optional).
   * @public
   */
  MaterialSlider.prototype.change = function(value) {

    if (typeof value !== 'undefined') {
      this.element_.value = value;
    }
    this.updateValueStyles_();
  };
  MaterialSlider.prototype['change'] = MaterialSlider.prototype.change;

  /**
   * Initialize element.
   */
  MaterialSlider.prototype.init = function() {

    if (this.element_) {
      if (this.isIE_) {
        // Since we need to specify a very large height in IE due to
        // implementation limitations, we add a parent here that trims it down to
        // a reasonable size.
        var containerIE = document.createElement('div');
        containerIE.classList.add(this.CssClasses_.IE_CONTAINER);
        this.element_.parentElement.insertBefore(containerIE, this.element_);
        this.element_.parentElement.removeChild(this.element_);
        containerIE.appendChild(this.element_);
      } else {
        // For non-IE browsers, we need a div structure that sits behind the
        // slider and allows us to style the left and right sides of it with
        // different colors.
        var container = document.createElement('div');
        container.classList.add(this.CssClasses_.SLIDER_CONTAINER);
        this.element_.parentElement.insertBefore(container, this.element_);
        this.element_.parentElement.removeChild(this.element_);
        container.appendChild(this.element_);
        var backgroundFlex = document.createElement('div');
        backgroundFlex.classList.add(this.CssClasses_.BACKGROUND_FLEX);
        container.appendChild(backgroundFlex);
        this.backgroundLower_ = document.createElement('div');
        this.backgroundLower_.classList.add(this.CssClasses_.BACKGROUND_LOWER);
        backgroundFlex.appendChild(this.backgroundLower_);
        this.backgroundUpper_ = document.createElement('div');
        this.backgroundUpper_.classList.add(this.CssClasses_.BACKGROUND_UPPER);
        backgroundFlex.appendChild(this.backgroundUpper_);
      }

      this.boundInputHandler = this.onInput_.bind(this);
      this.boundChangeHandler = this.onChange_.bind(this);
      this.boundMouseUpHandler = this.onMouseUp_.bind(this);
      this.boundContainerMouseDownHandler = this.onContainerMouseDown_.bind(this);
      this.element_.addEventListener('input', this.boundInputHandler);
      this.element_.addEventListener('change', this.boundChangeHandler);
      this.element_.addEventListener('mouseup', this.boundMouseUpHandler);
      this.element_.parentElement.addEventListener('mousedown', this.boundContainerMouseDownHandler);

      this.updateValueStyles_();
      this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
    }
  };

  // The component registers itself. It can assume componentHandler is available
  // in the global scope.
  componentHandler.register({
    constructor: MaterialSlider,
    classAsString: 'MaterialSlider',
    cssClass: 'mdl-js-slider',
    widget: true
  });
})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzbGlkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBDbGFzcyBjb25zdHJ1Y3RvciBmb3IgU2xpZGVyIE1ETCBjb21wb25lbnQuXG4gICAqIEltcGxlbWVudHMgTURMIGNvbXBvbmVudCBkZXNpZ24gcGF0dGVybiBkZWZpbmVkIGF0OlxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vamFzb25tYXllcy9tZGwtY29tcG9uZW50LWRlc2lnbi1wYXR0ZXJuXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50IFRoZSBlbGVtZW50IHRoYXQgd2lsbCBiZSB1cGdyYWRlZC5cbiAgICovXG4gIHZhciBNYXRlcmlhbFNsaWRlciA9IGZ1bmN0aW9uIE1hdGVyaWFsU2xpZGVyKGVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnRfID0gZWxlbWVudDtcbiAgICAvLyBCcm93c2VyIGZlYXR1cmUgZGV0ZWN0aW9uLlxuICAgIHRoaXMuaXNJRV8gPSB3aW5kb3cubmF2aWdhdG9yLm1zUG9pbnRlckVuYWJsZWQ7XG4gICAgLy8gSW5pdGlhbGl6ZSBpbnN0YW5jZS5cbiAgICB0aGlzLmluaXQoKTtcbiAgfTtcbiAgd2luZG93WydNYXRlcmlhbFNsaWRlciddID0gTWF0ZXJpYWxTbGlkZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlIGNvbnN0YW50cyBpbiBvbmUgcGxhY2Ugc28gdGhleSBjYW4gYmUgdXBkYXRlZCBlYXNpbHkuXG4gICAqXG4gICAqIEBlbnVtIHtzdHJpbmcgfCBudW1iZXJ9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuQ29uc3RhbnRfID0ge1xuICAgIC8vIE5vbmUgZm9yIG5vdy5cbiAgfTtcblxuICAvKipcbiAgICogU3RvcmUgc3RyaW5ncyBmb3IgY2xhc3MgbmFtZXMgZGVmaW5lZCBieSB0aGlzIGNvbXBvbmVudCB0aGF0IGFyZSB1c2VkIGluXG4gICAqIEphdmFTY3JpcHQuIFRoaXMgYWxsb3dzIHVzIHRvIHNpbXBseSBjaGFuZ2UgaXQgaW4gb25lIHBsYWNlIHNob3VsZCB3ZVxuICAgKiBkZWNpZGUgdG8gbW9kaWZ5IGF0IGEgbGF0ZXIgZGF0ZS5cbiAgICpcbiAgICogQGVudW0ge3N0cmluZ31cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZS5Dc3NDbGFzc2VzXyA9IHtcbiAgICBJRV9DT05UQUlORVI6ICdtZGwtc2xpZGVyX19pZS1jb250YWluZXInLFxuICAgIFNMSURFUl9DT05UQUlORVI6ICdtZGwtc2xpZGVyX19jb250YWluZXInLFxuICAgIEJBQ0tHUk9VTkRfRkxFWDogJ21kbC1zbGlkZXJfX2JhY2tncm91bmQtZmxleCcsXG4gICAgQkFDS0dST1VORF9MT1dFUjogJ21kbC1zbGlkZXJfX2JhY2tncm91bmQtbG93ZXInLFxuICAgIEJBQ0tHUk9VTkRfVVBQRVI6ICdtZGwtc2xpZGVyX19iYWNrZ3JvdW5kLXVwcGVyJyxcbiAgICBJU19MT1dFU1RfVkFMVUU6ICdpcy1sb3dlc3QtdmFsdWUnLFxuICAgIElTX1VQR1JBREVEOiAnaXMtdXBncmFkZWQnXG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBpbnB1dCBvbiBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBUaGUgZXZlbnQgdGhhdCBmaXJlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZS5vbklucHV0XyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgdGhpcy51cGRhdGVWYWx1ZVN0eWxlc18oKTtcbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlIGNoYW5nZSBvbiBlbGVtZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBUaGUgZXZlbnQgdGhhdCBmaXJlZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZS5vbkNoYW5nZV8gPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRoaXMudXBkYXRlVmFsdWVTdHlsZXNfKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBtb3VzZXVwIG9uIGVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IFRoZSBldmVudCB0aGF0IGZpcmVkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgTWF0ZXJpYWxTbGlkZXIucHJvdG90eXBlLm9uTW91c2VVcF8gPSBmdW5jdGlvbihldmVudCkge1xuICAgIGV2ZW50LnRhcmdldC5ibHVyKCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBtb3VzZWRvd24gb24gY29udGFpbmVyIGVsZW1lbnQuXG4gICAqIFRoaXMgaGFuZGxlciBpcyBwdXJwb3NlIGlzIHRvIG5vdCByZXF1aXJlIHRoZSB1c2UgdG8gY2xpY2tcbiAgICogZXhhY3RseSBvbiB0aGUgMnB4IHNsaWRlciBlbGVtZW50LCBhcyBGaXJlRm94IHNlZW1zIHRvIGJlIHZlcnlcbiAgICogc3RyaWN0IGFib3V0IHRoaXMuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IFRoZSBldmVudCB0aGF0IGZpcmVkLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAc3VwcHJlc3Mge21pc3NpbmdQcm9wZXJ0aWVzfVxuICAgKi9cbiAgTWF0ZXJpYWxTbGlkZXIucHJvdG90eXBlLm9uQ29udGFpbmVyTW91c2VEb3duXyA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gSWYgdGhpcyBjbGljayBpcyBub3Qgb24gdGhlIHBhcmVudCBlbGVtZW50IChidXQgcmF0aGVyIHNvbWUgY2hpbGQpXG4gICAgLy8gaWdub3JlLiBJdCBtYXkgc3RpbGwgYnViYmxlIHVwLlxuICAgIGlmIChldmVudC50YXJnZXQgIT09IHRoaXMuZWxlbWVudF8ucGFyZW50RWxlbWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIERpc2NhcmQgdGhlIG9yaWdpbmFsIGV2ZW50IGFuZCBjcmVhdGUgYSBuZXcgZXZlbnQgdGhhdFxuICAgIC8vIGlzIG9uIHRoZSBzbGlkZXIgZWxlbWVudC5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBuZXdFdmVudCA9IG5ldyBNb3VzZUV2ZW50KCdtb3VzZWRvd24nLCB7XG4gICAgICB0YXJnZXQ6IGV2ZW50LnRhcmdldCxcbiAgICAgIGJ1dHRvbnM6IGV2ZW50LmJ1dHRvbnMsXG4gICAgICBjbGllbnRYOiBldmVudC5jbGllbnRYLFxuICAgICAgY2xpZW50WTogdGhpcy5lbGVtZW50Xy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS55XG4gICAgfSk7XG4gICAgdGhpcy5lbGVtZW50Xy5kaXNwYXRjaEV2ZW50KG5ld0V2ZW50KTtcbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlIHVwZGF0aW5nIG9mIHZhbHVlcy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZS51cGRhdGVWYWx1ZVN0eWxlc18gPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDYWxjdWxhdGUgYW5kIGFwcGx5IHBlcmNlbnRhZ2VzIHRvIGRpdiBzdHJ1Y3R1cmUgYmVoaW5kIHNsaWRlci5cbiAgICB2YXIgZnJhY3Rpb24gPSAodGhpcy5lbGVtZW50Xy52YWx1ZSAtIHRoaXMuZWxlbWVudF8ubWluKSAvXG4gICAgICAgICh0aGlzLmVsZW1lbnRfLm1heCAtIHRoaXMuZWxlbWVudF8ubWluKTtcblxuICAgIGlmIChmcmFjdGlvbiA9PT0gMCkge1xuICAgICAgdGhpcy5lbGVtZW50Xy5jbGFzc0xpc3QuYWRkKHRoaXMuQ3NzQ2xhc3Nlc18uSVNfTE9XRVNUX1ZBTFVFKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbGVtZW50Xy5jbGFzc0xpc3QucmVtb3ZlKHRoaXMuQ3NzQ2xhc3Nlc18uSVNfTE9XRVNUX1ZBTFVFKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaXNJRV8pIHtcbiAgICAgIHRoaXMuYmFja2dyb3VuZExvd2VyXy5zdHlsZS5mbGV4ID0gZnJhY3Rpb247XG4gICAgICB0aGlzLmJhY2tncm91bmRMb3dlcl8uc3R5bGUud2Via2l0RmxleCA9IGZyYWN0aW9uO1xuICAgICAgdGhpcy5iYWNrZ3JvdW5kVXBwZXJfLnN0eWxlLmZsZXggPSAxIC0gZnJhY3Rpb247XG4gICAgICB0aGlzLmJhY2tncm91bmRVcHBlcl8uc3R5bGUud2Via2l0RmxleCA9IDEgLSBmcmFjdGlvbjtcbiAgICB9XG4gIH07XG5cbiAgLy8gUHVibGljIG1ldGhvZHMuXG5cbiAgLyoqXG4gICAqIERpc2FibGUgc2xpZGVyLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuZGlzYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZWxlbWVudF8uZGlzYWJsZWQgPSB0cnVlO1xuICB9O1xuICBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGVbJ2Rpc2FibGUnXSA9IE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZS5kaXNhYmxlO1xuXG4gIC8qKlxuICAgKiBFbmFibGUgc2xpZGVyLlxuICAgKlxuICAgKiBAcHVibGljXG4gICAqL1xuICBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuZW5hYmxlID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLmVsZW1lbnRfLmRpc2FibGVkID0gZmFsc2U7XG4gIH07XG4gIE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZVsnZW5hYmxlJ10gPSBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuZW5hYmxlO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgc2xpZGVyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVGhlIHZhbHVlIHRvIHdoaWNoIHRvIHNldCB0aGUgY29udHJvbCAob3B0aW9uYWwpLlxuICAgKiBAcHVibGljXG4gICAqL1xuICBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuY2hhbmdlID0gZnVuY3Rpb24odmFsdWUpIHtcblxuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzLmVsZW1lbnRfLnZhbHVlID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlVmFsdWVTdHlsZXNfKCk7XG4gIH07XG4gIE1hdGVyaWFsU2xpZGVyLnByb3RvdHlwZVsnY2hhbmdlJ10gPSBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuY2hhbmdlO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGVsZW1lbnQuXG4gICAqL1xuICBNYXRlcmlhbFNsaWRlci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgaWYgKHRoaXMuZWxlbWVudF8pIHtcbiAgICAgIGlmICh0aGlzLmlzSUVfKSB7XG4gICAgICAgIC8vIFNpbmNlIHdlIG5lZWQgdG8gc3BlY2lmeSBhIHZlcnkgbGFyZ2UgaGVpZ2h0IGluIElFIGR1ZSB0b1xuICAgICAgICAvLyBpbXBsZW1lbnRhdGlvbiBsaW1pdGF0aW9ucywgd2UgYWRkIGEgcGFyZW50IGhlcmUgdGhhdCB0cmltcyBpdCBkb3duIHRvXG4gICAgICAgIC8vIGEgcmVhc29uYWJsZSBzaXplLlxuICAgICAgICB2YXIgY29udGFpbmVySUUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29udGFpbmVySUUuY2xhc3NMaXN0LmFkZCh0aGlzLkNzc0NsYXNzZXNfLklFX0NPTlRBSU5FUik7XG4gICAgICAgIHRoaXMuZWxlbWVudF8ucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUoY29udGFpbmVySUUsIHRoaXMuZWxlbWVudF8pO1xuICAgICAgICB0aGlzLmVsZW1lbnRfLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50Xyk7XG4gICAgICAgIGNvbnRhaW5lcklFLmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudF8pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIG5vbi1JRSBicm93c2Vycywgd2UgbmVlZCBhIGRpdiBzdHJ1Y3R1cmUgdGhhdCBzaXRzIGJlaGluZCB0aGVcbiAgICAgICAgLy8gc2xpZGVyIGFuZCBhbGxvd3MgdXMgdG8gc3R5bGUgdGhlIGxlZnQgYW5kIHJpZ2h0IHNpZGVzIG9mIGl0IHdpdGhcbiAgICAgICAgLy8gZGlmZmVyZW50IGNvbG9ycy5cbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCh0aGlzLkNzc0NsYXNzZXNfLlNMSURFUl9DT05UQUlORVIpO1xuICAgICAgICB0aGlzLmVsZW1lbnRfLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRhaW5lciwgdGhpcy5lbGVtZW50Xyk7XG4gICAgICAgIHRoaXMuZWxlbWVudF8ucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnRfKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudF8pO1xuICAgICAgICB2YXIgYmFja2dyb3VuZEZsZXggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgYmFja2dyb3VuZEZsZXguY2xhc3NMaXN0LmFkZCh0aGlzLkNzc0NsYXNzZXNfLkJBQ0tHUk9VTkRfRkxFWCk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChiYWNrZ3JvdW5kRmxleCk7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZExvd2VyXyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRMb3dlcl8uY2xhc3NMaXN0LmFkZCh0aGlzLkNzc0NsYXNzZXNfLkJBQ0tHUk9VTkRfTE9XRVIpO1xuICAgICAgICBiYWNrZ3JvdW5kRmxleC5hcHBlbmRDaGlsZCh0aGlzLmJhY2tncm91bmRMb3dlcl8pO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRVcHBlcl8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVXBwZXJfLmNsYXNzTGlzdC5hZGQodGhpcy5Dc3NDbGFzc2VzXy5CQUNLR1JPVU5EX1VQUEVSKTtcbiAgICAgICAgYmFja2dyb3VuZEZsZXguYXBwZW5kQ2hpbGQodGhpcy5iYWNrZ3JvdW5kVXBwZXJfKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5ib3VuZElucHV0SGFuZGxlciA9IHRoaXMub25JbnB1dF8uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuYm91bmRDaGFuZ2VIYW5kbGVyID0gdGhpcy5vbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgICAgIHRoaXMuYm91bmRNb3VzZVVwSGFuZGxlciA9IHRoaXMub25Nb3VzZVVwXy5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5ib3VuZENvbnRhaW5lck1vdXNlRG93bkhhbmRsZXIgPSB0aGlzLm9uQ29udGFpbmVyTW91c2VEb3duXy5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy5lbGVtZW50Xy5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIHRoaXMuYm91bmRJbnB1dEhhbmRsZXIpO1xuICAgICAgdGhpcy5lbGVtZW50Xy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmJvdW5kQ2hhbmdlSGFuZGxlcik7XG4gICAgICB0aGlzLmVsZW1lbnRfLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLmJvdW5kTW91c2VVcEhhbmRsZXIpO1xuICAgICAgdGhpcy5lbGVtZW50Xy5wYXJlbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuYm91bmRDb250YWluZXJNb3VzZURvd25IYW5kbGVyKTtcblxuICAgICAgdGhpcy51cGRhdGVWYWx1ZVN0eWxlc18oKTtcbiAgICAgIHRoaXMuZWxlbWVudF8uY2xhc3NMaXN0LmFkZCh0aGlzLkNzc0NsYXNzZXNfLklTX1VQR1JBREVEKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVGhlIGNvbXBvbmVudCByZWdpc3RlcnMgaXRzZWxmLiBJdCBjYW4gYXNzdW1lIGNvbXBvbmVudEhhbmRsZXIgaXMgYXZhaWxhYmxlXG4gIC8vIGluIHRoZSBnbG9iYWwgc2NvcGUuXG4gIGNvbXBvbmVudEhhbmRsZXIucmVnaXN0ZXIoe1xuICAgIGNvbnN0cnVjdG9yOiBNYXRlcmlhbFNsaWRlcixcbiAgICBjbGFzc0FzU3RyaW5nOiAnTWF0ZXJpYWxTbGlkZXInLFxuICAgIGNzc0NsYXNzOiAnbWRsLWpzLXNsaWRlcicsXG4gICAgd2lkZ2V0OiB0cnVlXG4gIH0pO1xufSkoKTtcbiJdLCJmaWxlIjoic2xpZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
