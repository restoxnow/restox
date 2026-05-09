// Runs on restox.net pages — syncs Supabase session to extension storage.
// After login, automatically processes any pending product add and returns
// the user to the original retailer tab.

(function () {
  'use strict';

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

  // ── Find Supabase auth token by scanning all localStorage keys ────────
  function findSupabaseToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('auth-token') === -1) continue;

        var raw = localStorage.getItem(key);
        if (!raw) continue;

        try {
          var parsed = JSON.parse(raw);

          // @supabase/ssr stores session directly: { access_token, user, ... }
          var accessToken = parsed.access_token;
          var user = parsed.user;

          // Older / alternative structure: { currentSession: { access_token, user } }
          if (!accessToken && parsed.currentSession) {
            accessToken = parsed.currentSession.access_token;
            user = parsed.currentSession.user;
          }

          // Another variant: { data: { session: { access_token, user } } }
          if (!accessToken && parsed.data && parsed.data.session) {
            accessToken = parsed.data.session.access_token;
            user = parsed.data.session.user;
          }

          if (accessToken) {
            console.log('[Restox] Found auth token at key:', key, '— token prefix:', accessToken.slice(0, 20));
            return { accessToken: accessToken, user: user, key: key };
          }
        } catch (parseErr) {
          // Not valid JSON, skip
        }
      }
    } catch (e) {
      // localStorage unavailable
    }
    console.log('[Restox] No auth token found in localStorage');
    return null;
  }

  // ── Core: sync auth then check for pending product ────────────────────
  function syncAuth() {
    if (!isContextValid()) return;

    var found = findSupabaseToken();
    if (!found) return;

    var accessToken = found.accessToken;
    var user = found.user;

    // 1. Store the auth token in extension storage
    chrome.runtime.sendMessage({
      type: 'STORE_AUTH',
      token: accessToken,
      user: user ? { email: user.email, id: user.id } : null,
    }, function () {
      if (chrome.runtime.lastError) return;
      // 2. After auth is stored, check for a pending product
      processPendingProduct(accessToken);
    });
  }

  function processPendingProduct(token) {
    if (!isContextValid()) return;
    chrome.runtime.sendMessage(
      { type: 'PROCESS_PENDING_PRODUCT', token: token },
      function (result) {
        if (chrome.runtime.lastError) return;
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

  // Re-run when localStorage changes (fires when another tab sets the session)
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf('auth-token') !== -1 && e.newValue) {
      syncAuth();
    }
  });

  // Poll for same-tab SPA logins (storage event doesn't fire in the originating tab)
  var attempts = 0;
  var poll = setInterval(function () {
    attempts++;
    if (attempts >= 15) { clearInterval(poll); return; }
    try {
      var found = findSupabaseToken();
      if (found) {
        clearInterval(poll);
        syncAuth();
      }
    } catch (e) { clearInterval(poll); }
  }, 600);
})();
