// Restox content script — injected on supported retailer pages
// retailers.js runs first and defines RETAILERS, getRetailerConfig(), hasDOMSignals()

(function () {
  'use strict';

  var BUTTON_ID = 'restox-add-button';

  // Guard against double-injection (e.g. if the script somehow runs twice)
  if (window.__restoxLoaded) return;

  // ── Amazon Associates affiliate tag ────────────────────────────────────
  var ASSOCIATE_ID = 'restox-20';
  var AMAZON_HOSTS = [
    'amazon.com', 'www.amazon.com', 'amazon.co.uk', 'www.amazon.co.uk',
    'amazon.ca', 'www.amazon.ca', 'amazon.com.au', 'www.amazon.com.au',
    'amazon.de', 'www.amazon.de', 'amazon.fr', 'www.amazon.fr',
    'amazon.co.jp', 'www.amazon.co.jp',
  ];
  function addAffiliateTag(url) {
    if (!url) return url;
    try {
      var u = new URL(url);
      if (AMAZON_HOSTS.indexOf(u.hostname) === -1) return url;
      if (u.searchParams.get('tag') === ASSOCIATE_ID) return url;
      u.searchParams.set('tag', ASSOCIATE_ID);
      return u.toString();
    } catch (e) { return url; }
  }
  window.__restoxLoaded = true;

  // Current retailer config — set by checkAndShow() before injecting the button
  var retailer = null;

  // ── Extension context guard ────────────────────────────────────────────
  function isContextValid() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); }
    catch (e) { return false; }
  }

  function safeSendMessage(msg, callback) {
    if (!isContextValid()) {
      showToast('Restox was updated. Please refresh this page.', 'info');
      return;
    }
    try {
      chrome.runtime.sendMessage(msg, function (response) {
        if (chrome.runtime.lastError) return; // swallow context-invalidated errors
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

  // Extracts UPC from a Kroger product page URL.
  // Kroger product URLs follow the pattern: /p/[product-slug]/[13-digit-upc]
  // e.g. https://www.kroger.com/p/coca-cola-original/0049000000343
  function extractKrogerUPC() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    var last  = parts[parts.length - 1] || '';
    return /^\d{8,14}$/.test(last) ? last : null;
  }

  function extractProduct() {
    if (!retailer) return {};
    var titleEl = querySelector(retailer.selectors.title);
    var priceEl = querySelector(retailer.selectors.price);
    var imageEl = querySelector(retailer.selectors.image);

    // UPC — only extractable from Kroger product page URLs
    var upc = retailer.name === 'Kroger' ? extractKrogerUPC() : null;

    return {
      name:          titleEl ? titleEl.textContent.trim() : null,
      price:         priceEl ? (priceEl.textContent || priceEl.getAttribute('content') || '').trim() : null,
      image_url:     imageEl ? (imageEl.src || imageEl.getAttribute('data-src') || '') : null,
      product_url:   addAffiliateTag(window.location.href),
      retailer_name: retailer.name,
      upc:           upc,
    };
  }

  // ── Smart product-page detection ───────────────────────────────────────
  // Returns true only when BOTH the URL pattern and at least one DOM signal match.
  function isProductPage() {
    var match = getRetailerConfig();
    if (!match) return false;

    var cfg = match.config;

    // URL pattern check
    if (cfg.urlPattern && !cfg.urlPattern.test(window.location.pathname)) return false;

    // DOM signal check (hasDOMSignals defined in retailers.js)
    return hasDOMSignals();
  }

  // ── Session dismiss helpers ────────────────────────────────────────────
  // Uses sessionStorage so the suppression clears automatically on tab close.
  // Key is per-hostname so navigating to a different domain resets detection.
  function isDismissed() {
    try {
      return !!sessionStorage.getItem('restox_dismissed_' + window.location.hostname);
    } catch (e) { return false; }
  }

  function setDismissed() {
    try {
      sessionStorage.setItem('restox_dismissed_' + window.location.hostname, '1');
    } catch (e) {}
  }

  // ── Inject floating button ─────────────────────────────────────────────
  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!document.body) return;

    var btn = document.createElement('div');
    btn.id = BUTTON_ID;
    btn.innerHTML = [
      '<img src="' + chrome.runtime.getURL('logo.png') + '" class="restox-btn-icon" alt="" />',
      '<span class="restox-btn-text">Add to Restox</span>',
      '<button class="restox-dismiss" aria-label="Dismiss" title="Hide button">&#x2715;</button>',
    ].join('');

    document.body.appendChild(btn);

    // Main click — add product
    btn.addEventListener('click', handleClick);

    // Dismiss click — hide for this session on this domain
    btn.querySelector('.restox-dismiss').addEventListener('click', function (e) {
      e.stopPropagation(); // prevent bubbling to handleClick
      setDismissed();
      btn.remove();
    });
  }

  // ── Check conditions and show button ──────────────────────────────────
  function checkAndShow() {
    // Already visible — nothing to do
    if (document.getElementById(BUTTON_ID)) return;

    // Session-dismissed for this hostname
    if (isDismissed()) return;

    // Retailer + URL pattern check (fast, no DOM query)
    var match = getRetailerConfig();
    if (!match) return;
    var cfg = match.config;
    if (cfg.urlPattern && !cfg.urlPattern.test(window.location.pathname)) return;

    // DOM signals need a short delay so the page can render
    setTimeout(function () {
      if (isDismissed()) return; // re-check in case user dismissed during delay
      if (!hasDOMSignals()) return;
      retailer = cfg;
      injectButton();
    }, 400);
  }

  // ── Handle SPA navigation ──────────────────────────────────────────────
  function onNavigation() {
    var existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
    retailer = null;
    // Small delay so the new page URL/DOM is established before re-checking
    setTimeout(checkAndShow, 150);
  }

  // Patch history.pushState and history.replaceState so SPA navigation is detected.
  // Content scripts share the same history object as the page, so this works.
  (function patchHistory() {
    try {
      ['pushState', 'replaceState'].forEach(function (method) {
        var original = history[method].bind(history);
        history[method] = function () {
          var result = original.apply(this, arguments);
          window.dispatchEvent(new Event('restox:urlchange'));
          return result;
        };
      });
    } catch (e) { /* history not patchable — popstate + title observer cover it */ }
  })();

  window.addEventListener('popstate',         function () { window.dispatchEvent(new Event('restox:urlchange')); });
  window.addEventListener('restox:urlchange', onNavigation);

  // Title-change MutationObserver as a fallback for SPAs that don't use history API
  var _lastUrl = window.location.href;
  var _titleEl = document.querySelector('title');
  if (_titleEl) {
    new MutationObserver(function () {
      var cur = window.location.href;
      if (cur !== _lastUrl) { _lastUrl = cur; onNavigation(); }
    }).observe(_titleEl, { childList: true });
  }

  // ── Button click ───────────────────────────────────────────────────────
  function handleClick(e) {
    // Ignore clicks that originated on the dismiss button
    if (e.target.classList.contains('restox-dismiss')) return;

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
        safeSendMessage({ type: 'SAVE_PENDING_AND_LOGIN', product: product });
        showToast('Sign in to Restox — your product will be saved automatically.', 'info');
        return;
      }

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
    toast.id        = 'restox-toast';
    toast.className = 'restox-toast restox-toast-' + (type || 'info');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3500);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  checkAndShow();

})();
