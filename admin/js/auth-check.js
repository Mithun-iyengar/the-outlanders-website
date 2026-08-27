// admin/js/auth-check.js
(function(){
  'use strict';
  try {
    const token = sessionStorage.getItem('outlanders_auth_token') || localStorage.getItem('outlanders_auth_token');
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (!token && !isLocal) {
      console.warn('No active admin session found. Redirecting to login...');
      window.location.href = 'index.html';
    }
  } catch(e) {}
})();
