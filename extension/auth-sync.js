// Runs on restox.net pages — syncs Supabase session to extension storage.
// @supabase/ssr stores the session in cookies (not localStorage), so we
// fetch the token from a server-side API endpoint instead of reading
// localStorage directly.
// After login, automatically processes any pending product add and returns
// the user to the original retailer tab.

(function () {
  'use strict';

  // Signal extension presence — web app checks for this attribute
  document.documentElement.setAttribute('data-restox-ext', '1');

  var API_URL = '/api/auth/token';
  var TOAST_ID = 'restox-ext-toast';

  // ── Toast (injected on restox.net, no external CSS needed) ────────────
  function showToast(message, type) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var bg = type === 'error' ? '#dc2626' : type === 'info' ? '#2563eb' : '#16a34a';

    var toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.textContent = message;

    Object.assign(toast.style, {
      position:   'fixed',
      bottom:     '24px',
      right:      '24px',
      zIndex:     '2147483647',
      padding:    '12px 18px',
      background: bg,
      color:      '#ffffff',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize:   '14px',
      fontWeight: '600',
      boxShadow:  '0 4px 16px rgba(0,0,0,0.25)',
      maxWidth:   '320px',
      lineHeight: '1.4',
      transition: 'opacity 0.3s ease',
      opacity:    '1',
    });

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  // ── Extension context guard ────────────────────────────────────────────
  function isContextValid() {
    try { return !!(chrome && chrome.runtime && chrome.runtime.id); } catch (e) { return false; }
  }

  // ── Fetch token from server-side API ──────────────────────────────────
  function fetchToken(callback) {
    fetch(API_URL, { credentials: 'include' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.access_token) {
          console.log('[Restox] Auth token fetched from API — prefix:', data.access_token.slice(0, 20));
          callback(data.access_token, data.user || null);
        } else {
          console.log('[Restox] API returned no token:', data && data.error);
          callback(null, null);
        }
      })
      .catch(function (err) {
        console.log('[Restox] Failed to fetch auth token:', err.message);
        callback(null, null);
      });
  }

  // ── Core: fetch token, store in extension, check for pending product ──
  function syncAuth() {
    if (!isContextValid()) return;

    fetchToken(function (accessToken, user) {
      if (!accessToken) return;

      // 1. Store auth token in extension storage
      chrome.runtime.sendMessage({
        type: 'STORE_AUTH',
        token: accessToken,
        user: user ? { email: user.email, id: user.id } : null,
      }, function () {
        if (chrome.runtime.lastError) return;
        // 2. Check for a pending product to process
        processPendingProduct(accessToken);
      });
    });
  }

  function processPendingProduct(token) {
    if (!isContextValid()) return;
    chrome.runtime.sendMessage(
      { type: 'PROCESS_PENDING_PRODUCT', token: token },
      function (result) {
        if (chrome.runtime.lastError) return;
        if (!result || result.noPending) return;

        if (result.success) {
          showToast(
            'Product added to Restox! View it in your Products page.',
            'success'
          );
          // background.js closes this tab and refocuses the retailer tab after 2s
        } else {
          showToast(
            'Could not add product: ' + (result.error || 'Unknown error'),
            'error'
          );
        }
      }
    );
  }

  // ── Run immediately on page load ───────────────────────────────────────
  syncAuth();

  // Re-run after navigation events (SPA route changes, e.g. post-login redirect)
  window.addEventListener('popstate', function () { syncAuth(); });

  // Poll briefly to catch post-login redirects where the page doesn't reload
  var attempts = 0;
  var poll = setInterval(function () {
    attempts++;
    if (attempts >= 10) { clearInterval(poll); return; }
    if (!isContextValid()) { clearInterval(poll); return; }
    // Stop polling once we have a token stored
    chrome.runtime.sendMessage({ type: 'GET_AUTH' }, function (response) {
      if (chrome.runtime.lastError) { clearInterval(poll); return; }
      if (response && response.token) {
        clearInterval(poll); // already have a token, done
      } else {
        syncAuth(); // retry fetching
      }
    });
  }, 1500);
})();
