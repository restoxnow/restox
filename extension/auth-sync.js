// Runs on restox.net pages — syncs Supabase session to extension storage.
// After login, automatically processes any pending product add and returns
// the user to the original retailer tab.

(function () {
  'use strict';

  var SUPABASE_KEY = 'sb-vjptwvubebxjjkxkzqqe-auth-token';
  var TOAST_ID = 'restox-ext-toast';

  // ── Toast (injected on restox.net, no external CSS needed) ────────────
  function showToast(message, type) {
    var existing = document.getElementById(TOAST_ID);
    if (existing) existing.remove();

    var bg = type === 'error' ? '#dc2626' : '#16a34a';

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

  // ── Core: sync auth then check for pending product ────────────────────
  function syncAuth() {
    if (!isContextValid()) return;
    try {
      var raw = localStorage.getItem(SUPABASE_KEY);
      if (!raw) return;

      var session = JSON.parse(raw);
      var accessToken = session && session.access_token;
      var user = session && session.user;

      if (!accessToken) return;

      // 1. Store the auth token in extension storage
      chrome.runtime.sendMessage({
        type: 'STORE_AUTH',
        token: accessToken,
        user: user ? { email: user.email, id: user.id } : null,
      }, function () {
        // 2. After auth is stored, check for a pending product
        processPendingProduct(accessToken);
      });
    } catch (e) {
      // localStorage unavailable or chrome.runtime not accessible
    }
  }

  function processPendingProduct(token) {
    chrome.runtime.sendMessage(
      { type: 'PROCESS_PENDING_PRODUCT', token: token },
      function (result) {
        if (!result || result.noPending) return; // nothing to do

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

  // ── Run on page load ───────────────────────────────────────────────────
  syncAuth();

  // Re-run when localStorage changes (fires after Supabase sets the session
  // key, which happens on the same page if it's a redirect-based login)
  window.addEventListener('storage', function (e) {
    if (e.key === SUPABASE_KEY && e.newValue) syncAuth();
  });

  // Also poll briefly after page load to catch SPA-style logins where the
  // storage event doesn't fire in the same tab (Supabase PKCE flow)
  var attempts = 0;
  var poll = setInterval(function () {
    attempts++;
    if (attempts >= 10) { clearInterval(poll); return; }
    try {
      var raw = localStorage.getItem(SUPABASE_KEY);
      if (raw) { clearInterval(poll); syncAuth(); }
    } catch (e) { clearInterval(poll); }
  }, 800);
})();
