// Restox background service worker (Manifest V3)

var RESTOX_API_BASE = 'https://restox.net/api';
var RESTOX_LOGIN_URL = 'https://restox.net/login?source=extension';

// ── Message handler ─────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.type) {
    case 'GET_AUTH':
      handleGetAuth(sendResponse);
      return true; // keep channel open for async response

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
      // Called by auth-sync.js when it detects a Supabase session on restox.net
      chrome.storage.local.set({
        restox_token: message.token,
        restox_user: message.user,
      }, function () {
        sendResponse({ success: true });
      });
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
      user: result.restox_user || null,
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
