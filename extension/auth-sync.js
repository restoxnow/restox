// Runs on restox.net pages — syncs Supabase session to extension storage
// so the extension can make authenticated API calls without a separate login flow

(function () {
  'use strict';

  var SUPABASE_KEY = 'sb-vjptwvubebxjjkxkzqqe-auth-token';

  function syncAuth() {
    try {
      var raw = localStorage.getItem(SUPABASE_KEY);
      if (!raw) return;

      var session = JSON.parse(raw);
      var accessToken = session && session.access_token;
      var user = session && session.user;

      if (!accessToken) return;

      chrome.runtime.sendMessage({
        type: 'STORE_AUTH',
        token: accessToken,
        user: user ? { email: user.email, id: user.id } : null,
      });
    } catch (e) {
      // localStorage may be unavailable in some contexts
    }
  }

  // Sync on load
  syncAuth();

  // Re-sync when localStorage changes (e.g. after login/logout)
  window.addEventListener('storage', function (e) {
    if (e.key === SUPABASE_KEY) syncAuth();
  });
})();
