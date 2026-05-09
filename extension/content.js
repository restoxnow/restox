// Restox content script — injected on supported retailer product pages
// retailers.js runs first and defines RETAILERS + getRetailerConfig()

(function () {
  'use strict';

  var BUTTON_ID = 'restox-add-button';
  var RESTOX_API = 'https://restox.net/api/extension/add-product';

  // Exit immediately if already injected or not a product page
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

    var title = titleEl ? titleEl.textContent.trim() : null;
    var price = priceEl ? (priceEl.textContent || priceEl.getAttribute('content') || '').trim() : null;
    var imageUrl = imageEl ? (imageEl.src || imageEl.getAttribute('data-src') || '') : null;

    return { title: title, price: price, imageUrl: imageUrl };
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

    if (!product.title) {
      showToast('Could not detect product on this page.', 'error');
      return;
    }

    // Check auth state via background
    chrome.runtime.sendMessage({ type: 'GET_AUTH' }, function (response) {
      if (!response || !response.token) {
        // Not authenticated — open login page
        chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' });
        return;
      }

      // Authenticated — send product to API
      btn.classList.add('restox-loading');
      btn.querySelector('.restox-btn-text').textContent = 'Adding…';

      var payload = {
        name: product.title,
        price: product.price,
        image_url: product.imageUrl,
        product_url: window.location.href,
        retailer_name: retailer.name,
      };

      chrome.runtime.sendMessage(
        { type: 'ADD_PRODUCT', token: response.token, payload: payload },
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
  // Wait a moment for dynamic pages to settle
  setTimeout(injectButton, 1200);
})();
