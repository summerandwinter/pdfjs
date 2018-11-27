/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  DEFAULT_SCALE, DEFAULT_SCALE_VALUE, MAX_SCALE,
  MIN_SCALE, NullL10n
} from './ui_utils';

/**
 * @typedef {Object} ToolbarOptions
 * @property {HTMLDivElement} container - Container for the secondary toolbar.
 * @property {HTMLSpanElement} numPages - Label that contains number of pages.
 * @property {HTMLInputElement} pageNumber - Control for display and user input
 *   of the current page number.
 * @property {HTMLSpanElement} scaleSelectContainer - Container where scale
 *   controls are placed. The width is adjusted on UI initialization.
 * @property {HTMLSelectElement} scaleSelect - Scale selection control.
 * @property {HTMLOptionElement} customScaleOption - The item used to display
 *   a non-predefined scale.
 * @property {HTMLButtonElement} previous - Button to go to the previous page.
 * @property {HTMLButtonElement} next - Button to go to the next page.
 * @property {HTMLButtonElement} zoomIn - Button to zoom in the pages.
 * @property {HTMLButtonElement} zoomOut - Button to zoom out the pages.
 * @property {HTMLButtonElement} viewFind - Button to open find bar.
 * @property {HTMLButtonElement} openFile - Button to open a new document.
 * @property {HTMLButtonElement} presentationModeButton - Button to switch to
 *   presentation mode.
 * @property {HTMLButtonElement} download - Button to download the document.
 * @property {HTMLAElement} viewBookmark - Element to link current url of
 *   the page view.
 */

class Toolbar {
  /**
   * @param {ToolbarOptions} options
   * @param {EventBus} eventBus
   * @param {IL10n} l10n - Localization service.
   */
  constructor(options, eventBus, l10n = NullL10n) {
    this.toolbar = options.container;
    this.eventBus = eventBus;
    this.l10n = l10n;
    this.items = options;

    this._wasLocalized = false;
    this.reset();

    // Bind the event listeners for click and hand tool actions.
    this._bindListeners();
  }

  setPageNumber(pageNumber, pageLabel) {
    this.pageNumber = pageNumber;
    this.pageLabel = pageLabel;
    this._updateUIState(false);
  }

  setPagesCount(pagesCount, hasPageLabels) {
    this.pagesCount = pagesCount;
    this.hasPageLabels = hasPageLabels;
    this._updateUIState(true);
  }

  setPageScale(pageScaleValue, pageScale) {
    this.pageScaleValue = (pageScaleValue || pageScale).toString();
    this.pageScale = pageScale;
    this._updateUIState(false);
  }

  reset() {
    this.pageNumber = 0;
    this.pageLabel = null;
    this.hasPageLabels = false;
    this.pagesCount = 0;
    this.pageScaleValue = DEFAULT_SCALE_VALUE;
    this.pageScale = DEFAULT_SCALE;
    this._updateUIState(true);
  }

  _bindListeners() {
    let { eventBus, items, } = this;
    let self = this;

    items.previous.addEventListener('click', function() {
      eventBus.dispatch('previouspage', { source: self, });
    });

    items.next.addEventListener('click', function() {
      eventBus.dispatch('nextpage', { source: self, });
    });

    items.zoomIn.addEventListener('click', function() {
      eventBus.dispatch('zoomin', { source: self, });
    });

    items.zoomOut.addEventListener('click', function() {
      eventBus.dispatch('zoomout', { source: self, });
    });

    // items.presentationModeButton.addEventListener('click', function() {
    //   eventBus.dispatch('presentationmode', { source: self, });
    // });
    //
    // items.openFile.addEventListener('click', function() {
    //   eventBus.dispatch('openfile', { source: self, });
    // });
    //
    // items.print.addEventListener('click', function() {
    //   eventBus.dispatch('print', { source: self, });
    // });
    //
    // items.download.addEventListener('click', function() {
    //   eventBus.dispatch('download', { source: self, });
    // });

    eventBus.on('localized', () => {
      this._localized();
    });
  }

  _localized() {
    this._wasLocalized = true;
    this._updateUIState(true);
  }

  _updateUIState(resetNumPages = false) {
    if (!this._wasLocalized) {
      // Don't update the UI state until we localize the toolbar.
      return;
    }
    const { pageNumber, pagesCount, pageScale, items, } = this;

    if (resetNumPages) {
      if (this.hasPageLabels) {
        items.pageNumber.type = 'text';
      } else {
        items.pageNumber.type = 'number';
        this.l10n.get('of_pages', { pagesCount, }, 'of {{pagesCount}}').
            then((msg) => {
          items.numPages.textContent = msg;
        });
      }
      items.pageNumber.max = pagesCount;
    }

    if (this.hasPageLabels) {
      items.pageNumber.textContent = this.pageLabel;
      this.l10n.get('page_of_pages', { pageNumber, pagesCount, },
                    '({{pageNumber}} of {{pagesCount}})').then((msg) => {
        items.numPages.textContent = msg;
      });
    } else {
      items.pageNumber.textContent = pageNumber;
    }

    items.previous.disabled = (pageNumber <= 1);
    items.next.disabled = (pageNumber >= pagesCount);

    items.zoomOut.disabled = (pageScale <= MIN_SCALE);
    items.zoomIn.disabled = (pageScale >= MAX_SCALE);

  }

  updateLoadingIndicatorState(loading = false) {

  }
}

export {
  Toolbar,
};
