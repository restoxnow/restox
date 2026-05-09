// Restox content script — injected on supported retailer product pages
// retailers.js runs first and defines RETAILERS + getRetailerConfig()

(function () {
  'use strict';

  var BUTTON_ID = 'restox-add-button';

  // Exit immediately if already injected or not a supported retailer
  if (document.getElementById(BUTTON_ID)) return;

  var match = getRetailerConfig();
  if (!match) return;

  var retailer = match.config;

  // ── Extension context guard ────────────────────────────────────────────
  // The MV3 service worker can be terminated while this content script is
  // still live. Any chrome.runtime call after that throws "Extension context
  // invalidated". Check validity before every call and swallow the error.
  function isContextValid() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  function safeSendMessage(msg, callback) {
    if (!isContextValid()) {
      // Extension was reloaded — surface a friendly nudge instead of crashing
      showToast('Restox was updated. Please refresh this page.', 'info');
      return;
    }
    try {
      chrome.runtime.sendMessage(msg, function (response) {
        if (chrome.runtime.lastError) {
          // Swallow "receiving end does not exist" / "context invalidated"
          return;
        }
        if (callback) callback(response);
      });
    } catch (e) {
      showToast('Restox was updated. Please refresh this page.', 'info');
    }
  }

  // ── Product data extraction ────────────────────────────────────────────
  function querySelector(selectors) {
    var parts = selectors.split(',');
    for (var i = 0; i < parts.length; i++) {
      var el = document.querySelector(parts[i].trim());
      if (el) return el;
    }
    return null;
  }

  function extractProduct() {
    var titleEl = querySelector(retailer.selectors.title);
    var priceEl = querySelector(retailer.selectors.price);
    var imageEl = querySelector(retailer.selectors.image);

    return {
      name:          titleEl ? titleEl.textContent.trim() : null,
      price:         priceEl ? (priceEl.textContent || priceEl.getAttribute('content') || '').trim() : null,
      image_url:     imageEl ? (imageEl.src || imageEl.getAttribute('data-src') || '') : null,
      product_url:   window.location.href,
      retailer_name: retailer.name,
    };
  }

  // ── Inject floating button ─────────────────────────────────────────────
  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return; // guard re-injection

    var btn = document.createElement('div');
    btn.id = BUTTON_ID;
    btn.innerHTML = [
      '<img src="' + chrome.runtime.getURL('icon.png') + '" class="restox-btn-icon" alt="" />',
      '<span class="restox-btn-text">Add to Restox</span>',
    ].join('');

    document.body.appendChild(btn);
    btn.addEventListener('click', handleClick);
    return btn;
  }

  // ── Button click ───────────────────────────────────────────────────────
  function handleClick() {
    var btn = document.getElementById(BUTTON_ID);
    if (!btn || btn.classList.contains('restox-loading')) return;

    if (!isContextValid()) {
      showToast('Restox was updated. Please refresh this page.', 'info');
      return;
    }

    var product = extractProduct();

    if (!product.name) {
      showToast('Could not detect product on this page.', 'error');
      return;
    }

    safeSendMessage({ type: 'GET_AUTH' }, function (response) {
      if (!response || !response.token) {
        // Not authenticated — save pending product and open login
        safeSendMessage({
          type: 'SAVE_PENDING_AND_LOGIN',
          product: product,
        });
        showToast('Sign in to Restox — your product will be saved automatically.', 'info');
        return;
      }

      // Authenticated — add immediately
      btn.classList.add('restox-loading');
      btn.querySelector('.restox-btn-text').textContent = 'Adding…';

      safeSendMessage(
        { type: 'ADD_PRODUCT', token: response.token, payload: product },
        function (result) {
          btn.classList.remove('restox-loading');
          if (result && result.success) {
            btn.classList.add('restox-success');
            btn.querySelector('.restox-btn-text').textContent = 'Added!';
            setTimeout(function () {
              btn.classList.remove('restox-success');
              btn.querySelector('.restox-btn-text').textContent = 'Add to Restox';
            }, 2500);
          } else {
            btn.querySelector('.restox-btn-text').textContent = 'Add to Restox';
            showToast(result && result.error ? result.error : 'Failed to add product.', 'error');
          }
        }
      );
    });
  }

  // ── Toast notification ─────────────────────────────────────────────────
  function showToast(message, type) {
    var existing = document.getElementById('restox-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'restox-toast';
    toast.className = 'restox-toast restox-toast-' + (type || 'info');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () { toast.remove(); }, 3500);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  setTimeout(injectButton, 1200);
})();
