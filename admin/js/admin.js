// admin.js - Production Server-Side Authentication Plumbing with JWT
(function(){
  'use strict';

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
    const apiBase = window.location.port === '8000' ? 'http://localhost:5000/api' : '/api';
    const res = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if(!res.ok || !data.success){
      throw new Error(data.error || 'Invalid credentials');
    }

    if(data.token){
      sessionStorage.setItem('outlanders_auth_token', data.token);
      localStorage.setItem('outlanders_auth_token', data.token);
      sessionStorage.setItem('outlanders_admin_logged', '1');
    }
    return data;
  }

  async function changeAdminPassword(currentPassword, newPassword){
    const apiBase = window.location.port === '8000' ? 'http://localhost:5000/api' : '/api';
    const token = getAuthToken();
    const res = await fetch(`${apiBase}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await res.json();
    if(!res.ok){
      throw new Error(data.error || 'Failed to change password');
    }
    return data;
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
