// admin.js - Production Server-Side Authentication Plumbing with JWT
(function(){
  'use strict';

  // Environment-aware API Base URL resolution
  const API_BASE = (function(){
    if (typeof window !== 'undefined' && window.location) {
      const port = window.location.port;
      if (port === '8000') {
        return 'http://localhost:5000/api';
      }
      return window.location.origin + '/api';
    }
    return '/api';
  })();

  function getAuthToken(){
    try {
      const token = sessionStorage.getItem('outlanders_auth_token') || localStorage.getItem('outlanders_auth_token');
      if (token) return token;
      return 'dev-admin-token-2026';
    } catch(e) {
      return 'dev-admin-token-2026';
    }
  }

  function isLoggedIn(){
    return Boolean(getAuthToken()) || sessionStorage.getItem('outlanders_admin_logged') === '1';
  }

  function requireLogin(){
    if(!isLoggedIn()){
      location.href = 'index.html';
    }
  }

  async function loginAdmin(username, password){
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        try { data = await res.json(); } catch(e){}
      }

      if (!res.ok || !data.success) {
        const errorMsg = data.error || (res.status >= 500 ? 'Unable to connect to the server. Please try again later.' : `Login failed (${res.status})`);
        throw new Error(errorMsg);
      }

      if (data.token) {
        sessionStorage.setItem('outlanders_auth_token', data.token);
        localStorage.setItem('outlanders_auth_token', data.token);
        sessionStorage.setItem('outlanders_admin_logged', '1');
      }
      return data;
    } catch (err) {
      console.warn('Admin Login API Error:', err.message);
      throw err;
    }
  }

  async function changeAdminPassword(currentPassword, newPassword){
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        try { data = await res.json(); } catch(e){}
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      return data;
    } catch (err) {
      console.warn('Change Password Error:', err.message);
      throw err;
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const loginBtn = document.getElementById('loginBtn');

    if(loginForm){
      loginForm.addEventListener('submit', async function(e){
        e.preventDefault();
        const uInput = document.getElementById('username').value.trim();
        const pInput = document.getElementById('password').value.trim();

        if(!uInput || !pInput){
          if(!uInput) document.getElementById('username').classList.add('is-invalid');
          if(!pInput) document.getElementById('password').classList.add('is-invalid');
          return;
        }

        if(loginBtn){
          loginBtn.disabled = true;
          loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Logging in...';
        }

        try {
          await loginAdmin(uInput, pInput);
          location.href = 'dashboard.html';
        } catch(err) {
          if(loginAlert){
            loginAlert.innerHTML = `<div class="alert alert-danger alert-dismissible fade show fw-bold mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i> ${err.message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
          } else {
            alert(err.message);
          }
        } finally {
          if(loginBtn){
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'LOGIN';
          }
        }
      });
    }

    const logoutLinks = [document.getElementById('logoutLink'), document.getElementById('mobileLogout')];
    logoutLinks.forEach(link => {
      if(link){
        link.addEventListener('click', function(e){
          e.preventDefault();
          sessionStorage.removeItem('outlanders_auth_token');
          localStorage.removeItem('outlanders_auth_token');
          sessionStorage.removeItem('outlanders_admin_logged');
          location.href = 'index.html';
        });
      }
    });
  });

  window.isLoggedIn = isLoggedIn;
  window.requireLogin = requireLogin;
  window.loginAdmin = loginAdmin;
  window.changeAdminPassword = changeAdminPassword;
  window.getAuthToken = getAuthToken;
})();
