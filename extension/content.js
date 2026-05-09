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
      name:        titleEl ? titleEl.textContent.trim() : null,
      price:       priceEl ? (priceEl.textContent || priceEl.getAttribute('content') || '').trim() : null,
      image_url:   imageEl ? (imageEl.src || imageEl.getAttribute('data-src') || '') : null,
      product_url: window.location.href,
      retailer_name: retailer.name,
    };
  }

  // ── Inject floating button ─────────────────────────────────────────────
  function injectButton() {
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

    var product = extractProduct();

    if (!product.name) {
      showToast('Could not detect product on this page.', 'error');
      return;
    }

    chrome.runtime.sendMessage({ type: 'GET_AUTH' }, function (response) {
      if (!response || !response.token) {
        // Not authenticated — save pending product (background records origin tab ID
        // from sender.tab.id) then open login page
        chrome.runtime.sendMessage({
          type: 'SAVE_PENDING_AND_LOGIN',
          product: product,
        });

        showToast('Sign in to Restox — your product will be saved automatically.', 'info');
        return;
      }

      // Authenticated — add immediately
      btn.classList.add('restox-loading');
      btn.querySelector('.restox-btn-text').textContent = 'Adding…';

      chrome.runtime.sendMessage(
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
