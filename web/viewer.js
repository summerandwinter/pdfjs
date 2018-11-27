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
/* globals chrome */

'use strict';

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
  var defaultUrl; // eslint-disable-line no-var

  (function rewriteUrlClosure() {
    // Run this code outside DOMContentLoaded to make sure that the URL
    // is rewritten as soon as possible.
    let queryString = document.location.search.slice(1);
    let m = /(^|&)file=([^&]*)/.exec(queryString);
    defaultUrl = m ? decodeURIComponent(m[2]) : '';

    // Example: chrome-extension://.../http://example.com/file.pdf
    let humanReadableUrl = '/' + defaultUrl + location.hash;
    history.replaceState(history.state, '', humanReadableUrl);
    if (top === window) {
      chrome.runtime.sendMessage('showPageAction');
    }
  })();
}

let pdfjsWebApp, pdfjsWebAppOptions;
let FILE_LOADED = false;
let VIEW_READY = false;
// let API_URL = 'https://wfyfgxcx.jsfy.gov.cn/wecourt-outer-judge/judge/api/gw/getFileUrl';
let API_URL = '/apis/wecourt-outer-judge/judge/api/gw/getFileUrl';
let FILE_URL = '';
let SESSION_KEY = '';
let sendData = {};

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('PRODUCTION')) {
  pdfjsWebApp = require('./app.js');
  pdfjsWebAppOptions = require('./app_options.js');
}

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
  require('./firefoxcom.js');
  require('./firefox_print_service.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('GENERIC')) {
  require('./genericcom.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
  require('./chromecom.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME || GENERIC')) {
  require('./pdf_print_service.js');
}

function getViewerConfiguration() {
  return {
    appContainer: document.body,
    mainContainer: document.getElementById('viewerContainer'),
    viewerContainer: document.getElementById('viewer'),
    eventBus: null, // Using global event bus with (optional) DOM events.
    toolbar: {
      container: document.getElementById('toolbarViewer'),
      numPages: document.getElementById('numPages'),
      pageNumber: document.getElementById('pageNumber'),
      scaleSelectContainer: null,
      scaleSelect: null,
      customScaleOption: null,
      previous: document.getElementById('previous'),
      next: document.getElementById('next'),
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      viewFind: document.getElementById('viewFind'),
      openFile: document.getElementById('openFile'),
      print: document.getElementById('print'),
      presentationModeButton: document.getElementById('presentationMode'),
      download: document.getElementById('download'),
      viewBookmark: document.getElementById('viewBookmark'),
    },
    secondaryToolbar: {
      toolbar: document.getElementById('secondaryToolbar'),
      toggleButton: document.getElementById('secondaryToolbarToggle'),
      toolbarButtonContainer:
        document.getElementById('secondaryToolbarButtonContainer'),
      presentationModeButton:
        document.getElementById('secondaryPresentationMode'),
      openFileButton: document.getElementById('secondaryOpenFile'),
      printButton: document.getElementById('secondaryPrint'),
      downloadButton: document.getElementById('secondaryDownload'),
      viewBookmarkButton: document.getElementById('secondaryViewBookmark'),
      firstPageButton: document.getElementById('firstPage'),
      lastPageButton: document.getElementById('lastPage'),
      pageRotateCwButton: document.getElementById('pageRotateCw'),
      pageRotateCcwButton: document.getElementById('pageRotateCcw'),
      cursorSelectToolButton: document.getElementById('cursorSelectTool'),
      cursorHandToolButton: document.getElementById('cursorHandTool'),
      scrollVerticalButton: document.getElementById('scrollVertical'),
      scrollHorizontalButton: document.getElementById('scrollHorizontal'),
      scrollWrappedButton: document.getElementById('scrollWrapped'),
      spreadNoneButton: document.getElementById('spreadNone'),
      spreadOddButton: document.getElementById('spreadOdd'),
      spreadEvenButton: document.getElementById('spreadEven'),
      documentPropertiesButton: document.getElementById('documentProperties'),
    },
    fullscreen: {
      contextFirstPage: document.getElementById('contextFirstPage'),
      contextLastPage: document.getElementById('contextLastPage'),
      contextPageRotateCw: document.getElementById('contextPageRotateCw'),
      contextPageRotateCcw: document.getElementById('contextPageRotateCcw'),
    },
    sidebar: {
      // Divs (and sidebar button)
      outerContainer: document.getElementById('outerContainer'),
      viewerContainer: document.getElementById('viewerContainer'),
      toggleButton: document.getElementById('sidebarToggle'),
      // Buttons
      thumbnailButton: document.getElementById('viewThumbnail'),
      outlineButton: document.getElementById('viewOutline'),
      attachmentsButton: document.getElementById('viewAttachments'),
      // Views
      thumbnailView: document.getElementById('thumbnailView'),
      outlineView: document.getElementById('outlineView'),
      attachmentsView: document.getElementById('attachmentsView'),
    },
    sidebarResizer: {
      outerContainer: document.getElementById('outerContainer'),
      resizer: document.getElementById('sidebarResizer'),
    },
    findBar: {
      bar: document.getElementById('findbar'),
      toggleButton: document.getElementById('viewFind'),
      findField: document.getElementById('findInput'),
      highlightAllCheckbox: document.getElementById('findHighlightAll'),
      caseSensitiveCheckbox: document.getElementById('findMatchCase'),
      entireWordCheckbox: document.getElementById('findEntireWord'),
      findMsg: document.getElementById('findMsg'),
      findResultsCount: document.getElementById('findResultsCount'),
      findPreviousButton: document.getElementById('findPrevious'),
      findNextButton: document.getElementById('findNext'),
    },
    passwordOverlay: {
      overlayName: 'passwordOverlay',
      container: document.getElementById('passwordOverlay'),
      label: document.getElementById('passwordText'),
      input: document.getElementById('password'),
      submitButton: document.getElementById('passwordSubmit'),
      cancelButton: document.getElementById('passwordCancel'),
    },
    documentProperties: {
      overlayName: 'documentPropertiesOverlay',
      container: document.getElementById('documentPropertiesOverlay'),
      closeButton: document.getElementById('documentPropertiesClose'),
      fields: {
        'fileName': document.getElementById('fileNameField'),
        'fileSize': document.getElementById('fileSizeField'),
        'title': document.getElementById('titleField'),
        'author': document.getElementById('authorField'),
        'subject': document.getElementById('subjectField'),
        'keywords': document.getElementById('keywordsField'),
        'creationDate': document.getElementById('creationDateField'),
        'modificationDate': document.getElementById('modificationDateField'),
        'creator': document.getElementById('creatorField'),
        'producer': document.getElementById('producerField'),
        'version': document.getElementById('versionField'),
        'pageCount': document.getElementById('pageCountField'),
        'pageSize': document.getElementById('pageSizeField'),
        'linearized': document.getElementById('linearizedField'),
      },
    },
    errorWrapper: {
      container: document.getElementById('errorWrapper'),
      errorMessage: document.getElementById('errorMessage'),
      closeButton: document.getElementById('errorClose'),
      errorMoreInfo: document.getElementById('errorMoreInfo'),
      moreInfoButton: document.getElementById('errorShowMore'),
      lessInfoButton: document.getElementById('errorShowLess'),
    },
    loadingWrapper: {
      container: document.getElementById('load_img'),
      loadHeader: document.getElementById('load_header'),
      loadText: document.getElementById('load_text'),
    },
    printContainer: document.getElementById('printContainer'),
    openFileInputName: 'fileInput',
    debuggerScriptPath: './debugger.js',
  };
}

function parseQueryString(query) {
  let parts = query.split('&');
  let params = Object.create(null);

  for (let i = 0, ii = parts.length; i < ii; ++i) {
    let param = parts[i].split('=');
    let key = param[0].toLowerCase();
    let value = param.length > 1 ? param[1] : null;
    params[decodeURIComponent(key)] = decodeURIComponent(value);
  }

  return params;
}

function openFile() {
  window.PDFViewerApplicationOptions.set('defaultUrl', FILE_URL);
  document.getElementById('load_header').textContent = '正在下载文件..';
  document.getElementById('load_text').textContent = '正在从服务器下载文件,请稍后';
  window.PDFViewerApplication.openFile();
}

function showError(config, message) {
  console.error(message);
  let errorWrapperConfig = config.errorWrapper;
  let errorWrapper = errorWrapperConfig.container;
  errorWrapper.removeAttribute('hidden');

  let errorMessage = errorWrapperConfig.errorMessage;
  errorMessage.textContent = message;

  let loadingWrapper = config.loadingWrapper.container;
  loadingWrapper.setAttribute('hidden', 'true');

}

function validateUrl(config) {
  let query = document.location.search.substring(1);
  let param = (0, parseQueryString)(query);

  if (!('id' in param)) {
    showError(config, '参数 id 不能为空');
    return false;
  }
  if (!('fjid' in param)) {
    showError(config, '参数 fjid 不能为空');
    return false;
  }
  if (!('fjmm' in param)) {
    showError(config, '参数 fjmm 不能为空');
    return false;
  }
  if (!('bt' in param)) {
    showError(config, '参数 bt 不能为空');
    return false;
  }
  if (!('ftpf' in param)) {
    showError(config, '参数 ftpf 不能为空');
    return false;
  }
  if (!('key' in param)) {
    showError(config, '参数 key 不能为空');
    return false;
  }
  SESSION_KEY = param.key;
  document.title = param.bt;
  sendData = query;
  return true;
}
function webViewerLoad() {
  let config = getViewerConfiguration();
  if (!validateUrl(config)) {
    return;
  }

  getFileInfo().then(function(data) {
    if (data.code === 0) {
      FILE_LOADED = true;
      FILE_URL = data.data.replace('https://wfy-oss.oss-cn-hangzhou.aliyuncs.com', 'http://localhost:8888/files');
      if (VIEW_READY) {
        openFile();
      }
    } else if (data.code === 404) {
      showError(config, '连接不存在');
    } else {
      let message = data.message;
      showError(config, message);
    }
}
  ).catch(function(error) {
    showError(config, error.message);
    console.error('error', error.message);
  });

  console.log('加载资源...');
  console.time('加载资源耗时');

  if (typeof PDFJSDev === 'undefined' || !PDFJSDev.test('PRODUCTION')) {
    Promise.all([
      SystemJS.import('pdfjs-web/app'),
      SystemJS.import('pdfjs-web/app_options'),
      SystemJS.import('pdfjs-web/genericcom'),
      SystemJS.import('pdfjs-web/pdf_print_service'),
    ]).then(function([app, appOptions, ...otherModules]) {
      console.log('加载资源完成');
      console.timeEnd('加载资源耗时');
      console.log('启动阅读器...');
      console.time('启动阅读器');
      window.PDFViewerApplication = app.PDFViewerApplication;
      window.PDFViewerApplicationOptions = appOptions.AppOptions;
      app.PDFViewerApplication.initialize(config).then(function() {
        VIEW_READY = true;
        if (FILE_LOADED) {
          openFile();
        }
      });
      // app.PDFViewerApplication.run(config);
      console.log('启动阅读器完成');
      console.timeEnd('启动阅读器');
    });
  } else {
    if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
      pdfjsWebAppOptions.AppOptions.set('defaultUrl', defaultUrl);
    }

    window.PDFViewerApplication = pdfjsWebApp.PDFViewerApplication;
    window.PDFViewerApplicationOptions = pdfjsWebAppOptions.AppOptions;
    pdfjsWebApp.PDFViewerApplication.run(config);
  }
}

 async function request(url, data) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    // 使用HTTP POST请求与服务器交互数据
    xhr.open('POST', url, true);
    // 设置发送数据的请求格式
    xhr.setRequestHeader('content-type',
    'application/x-www-form-urlencoded;charset=UTF-8');
    xhr.setRequestHeader('sessionKey', SESSION_KEY);
    xhr.onerror = function (error) {
      console.log('xhr onerror', error);
      reject(error);
    };
    xhr.ontimeout = function() {
      console.log('xhr timeout');
      let error = { code: 300, message: '连接超时', };
      reject(error);
    };
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          let code = xhr.status;
          if (code === 200) {
            // 根据服务器的响应内容格式处理响应结果
            let contentType = xhr.getResponseHeader('content-type');
            if (contentType &&
              contentType.indexOf('application/json') > -1) {
              let result = JSON.parse(xhr.responseText);
              resolve(result);
            } else {
              resolve(xhr.responseText);
            }
          } else {
            let error = { code, message: '状态错误', };
            reject(error);
          }
        }
    };
    // 将用户输入值序列化成字符串
    xhr.send(JSON.stringify(data));
  });

}

async function getFileInfo() {
  console.log('获取文件信息...');
  console.time('获取文件信息');
  return new Promise((resolve, reject) => {
    request(API_URL, sendData).then(function(data) {
      resolve(data);
      console.timeEnd('获取文件信息');
    }).catch(function(error) {
      reject(error);
      console.timeEnd('获取文件信息');
    });
  });

}

if (document.readyState === 'interactive' ||
    document.readyState === 'complete') {
  webViewerLoad();
} else {
  document.addEventListener('DOMContentLoaded', webViewerLoad, true);
}
