// Restox background service worker (Manifest V3)

var RESTOX_API_BASE = 'https://restox.net/api';
var RESTOX_LOGIN_URL = 'https://restox.net/login?source=extension';

// ── Message handler ─────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'GET_AUTH':
      handleGetAuth(sendResponse);
      return true;

    case 'ADD_PRODUCT':
      handleAddProduct(message.token, message.payload, sendResponse);
      return true;

    case 'SIGN_OUT':
      chrome.storage.local.remove(['restox_token', 'restox_user'], function () {
        sendResponse({ success: true });
      });
      return true;

    case 'OPEN_LOGIN':
      chrome.tabs.create({ url: RESTOX_LOGIN_URL });
      sendResponse({ success: true });
      return false;

    case 'STORE_AUTH':
      // Called by auth-sync.js when a Supabase session is detected on restox.net
      chrome.storage.local.set({
        restox_token: message.token,
        restox_user: message.user,
      }, function () {
        sendResponse({ success: true });
      });
      return true;

    case 'SAVE_PENDING_AND_LOGIN':
      // Save product + the tab the user is coming from, then open login
      handleSavePendingAndLogin(message.product, sender, sendResponse);
      return true;

    case 'PROCESS_PENDING_PRODUCT':
      // Called by auth-sync.js after login — add the pending product and return focus
      handleProcessPending(message.token, sender, sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

// ── Handlers ────────────────────────────────────────────────────────────
function handleGetAuth(sendResponse) {
  chrome.storage.local.get(['restox_token', 'restox_user'], function (result) {
    sendResponse({
      token: result.restox_token || null,
      user:  result.restox_user  || null,
    });
  });
}

function handleSavePendingAndLogin(product, sender, sendResponse) {
  var originTabId = sender.tab ? sender.tab.id : null;

  chrome.storage.local.set({
    pendingProduct: {
      product:     product,
      originTabId: originTabId,
    },
  }, function () {
    chrome.tabs.create({ url: RESTOX_LOGIN_URL }, function (tab) {
      sendResponse({ success: true, loginTabId: tab.id });
    });
  });
}

function handleProcessPending(token, sender, sendResponse) {
  var loginTabId = sender.tab ? sender.tab.id : null;

  chrome.storage.local.get(['pendingProduct'], function (result) {
    var pending = result.pendingProduct;
    if (!pending || !pending.product) {
      sendResponse({ success: false, noPending: true });
      return;
    }

    var product     = pending.product;
    var originTabId = pending.originTabId;

    fetch(RESTOX_API_BASE + '/extension/add-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify(product),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // Always clear the pending product regardless of outcome
        chrome.storage.local.remove(['pendingProduct']);

        if (data.error) {
          sendResponse({ success: false, error: data.error });
          return;
        }

        sendResponse({ success: true, product_id: data.product_id });

        // Switch back to the retailer tab after a short delay for the toast to show
        setTimeout(function () {
          if (loginTabId) chrome.tabs.remove(loginTabId);
          if (originTabId) chrome.tabs.update(originTabId, { active: true });
        }, 2000);
      })
      .catch(function (err) {
        chrome.storage.local.remove(['pendingProduct']);
        sendResponse({ success: false, error: err.message || 'Network error' });
      });
  });
}

function handleAddProduct(token, payload, sendResponse) {
  fetch(RESTOX_API_BASE + '/extension/add-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify(payload),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.error) {
        sendResponse({ success: false, error: data.error });
      } else {
        sendResponse({ success: true, product_id: data.product_id });
      }
    })
    .catch(function (err) {
      sendResponse({ success: false, error: err.message || 'Network error' });
    });
}
