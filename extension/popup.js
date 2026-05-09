// Restox popup script

(function () {
  'use strict';

  var RETAILERS_DOMAINS = [
    'amazon.com', 'walmart.com', 'target.com', 'costco.com', 'chewy.com',
    'homedepot.com', 'lowes.com', 'sephora.com', 'staples.com', 'kroger.com',
  ];

  var RETAILER_NAMES = {
    'amazon.com':    'Amazon',
    'walmart.com':   'Walmart',
    'target.com':    'Target',
    'costco.com':    'Costco',
    'chewy.com':     'Chewy',
    'homedepot.com': 'Home Depot',
    'lowes.com':     "Lowe's",
    'sephora.com':   'Sephora',
    'staples.com':   'Staples',
    'kroger.com':    'Kroger',
  };

  // ── DOM refs ─────────────────────────────────────────────────────────
  var viewSignedOut  = document.getElementById('view-signedout');
  var viewSignedIn   = document.getElementById('view-signedin');
  var btnSignIn      = document.getElementById('btn-signin');
  var btnAdd         = document.getElementById('btn-add');
  var btnSignOut     = document.getElementById('btn-signout');
  var userEmailEl    = document.getElementById('user-email');
  var userInitialEl  = document.getElementById('user-initial');
  var pageRetailerEl = document.getElementById('page-retailer');
  var notRetailerMsg = document.getElementById('not-retailer-msg');
  var statusMsg      = document.getElementById('status-msg');

  // ── Helpers ──────────────────────────────────────────────────────────
  function setStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = type || '';
  }

  function detectRetailerFromTab(url) {
    if (!url) return null;
    try {
      var hostname = new URL(url).hostname.replace(/^www\./, '');
      for (var i = 0; i < RETAILERS_DOMAINS.length; i++) {
        var domain = RETAILERS_DOMAINS[i];
        if (hostname === domain || hostname.endsWith('.' + domain)) {
          return { domain: domain, name: RETAILER_NAMES[domain] };
        }
      }
    } catch (e) {}
    return null;
  }

  // ── Init ─────────────────────────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_AUTH' }, function (response) {
    if (response && response.token) {
      showSignedIn(response.user, response.token);
    } else {
      showSignedOut();
    }
  });

  function showSignedOut() {
    viewSignedOut.style.display = 'flex';
    viewSignedIn.style.display = 'none';
  }

  function showSignedIn(user, token) {
    viewSignedOut.style.display = 'none';
    viewSignedIn.style.display = 'flex';

    var email = (user && user.email) || 'Unknown';
    userEmailEl.textContent = email;
    userInitialEl.textContent = email[0].toUpperCase();

    // Check if current tab is a supported retailer
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs && tabs[0];
      var retailer = tab ? detectRetailerFromTab(tab.url) : null;

      if (retailer) {
        pageRetailerEl.textContent = retailer.name;
        notRetailerMsg.style.display = 'none';
        btnAdd.disabled = false;

        btnAdd.addEventListener('click', function () {
          btnAdd.disabled = true;
          btnAdd.textContent = 'Adding…';
          setStatus('');

          chrome.scripting.executeScript(
            { target: { tabId: tab.id }, func: extractProductFromPage },
            function (results) {
              var product = results && results[0] && results[0].result;
              if (!product || !product.title) {
                btnAdd.disabled = false;
                btnAdd.textContent = 'Add this product';
                setStatus('Could not detect product info on this page.', 'error');
                return;
              }

              product.retailer_name = retailer.name;
              product.product_url   = tab.url;

              chrome.runtime.sendMessage(
                { type: 'ADD_PRODUCT', token: token, payload: product },
                function (result) {
                  btnAdd.disabled = false;
                  btnAdd.textContent = 'Add this product';
                  if (result && result.success) {
                    setStatus('Product added to Restox!', 'success');
                  } else {
                    setStatus(result && result.error ? result.error : 'Failed to add.', 'error');
                  }
                }
              );
            }
          );
        });
      } else {
        pageRetailerEl.textContent = 'Not a supported retailer';
        notRetailerMsg.style.display = 'block';
        btnAdd.disabled = true;
      }
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────
  btnSignIn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' });
    window.close();
  });

  btnSignOut.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'SIGN_OUT' }, function () {
      showSignedOut();
    });
  });

  // ── Injected function (runs in page context via scripting API) ────────
  function extractProductFromPage() {
    function qs(selectors) {
      var parts = selectors.split(',');
      for (var i = 0; i < parts.length; i++) {
        var el = document.querySelector(parts[i].trim());
        if (el) return el;
      }
      return null;
    }

    // Generic extraction — tries common patterns across all retailers
    var title = (
      qs('#productTitle, h1[itemprop="name"], h1[data-test="product-title"], h1[class*="title"], h1[class*="product"], h1[data-comp="DisplayName "]') ||
      document.querySelector('h1')
    );
    var price = qs(
      '.a-price .a-offscreen, [itemprop="price"], .price-characteristic, [data-test="product-price"], .your-price .value, [class*="kds-Price"], .standard-price, [class*="art-price"]'
    );
    var image = qs(
      '#landingImage, .prod-hero-image img, [data-test*="product-image"] img, #initialProductImage, .product-image img, .mediagallery__mainimage img, .primary-image img'
    );

    return {
      name:      title ? title.textContent.trim() : null,
      price:     price ? (price.textContent || price.getAttribute('content') || '').trim() : null,
      image_url: image ? (image.src || image.getAttribute('data-src') || '') : null,
    };
  }
})();
