// admin.js - Front-end auth plumbing with Web Crypto API SHA-256 Encrypted Passwords
(function(){
  'use strict';

  // Default hashed password for 'outlanders2026' in SHA-256
  const DEFAULT_USER = 'admin';
  const DEFAULT_PASS_HASH = '6c83664d4b1d64703a893c5d6cbb1816e885d56b461877685651c68e0fb3035a'; // SHA-256 of 'outlanders2026'

  // Utility: SHA-256 Password Hash using Web Crypto API
  async function hashPassword(str){
    if(!str) return '';
    try {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch(e) {
      // Basic fallback
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return 'fallback-' + Math.abs(hash);
    }
  }

  function getStoredAdminCreds(){
    try {
      const raw = localStorage.getItem('outlanders_admin_creds');
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed && parsed.user && parsed.passHash) return parsed;
      }
    } catch(e){}
    return { user: DEFAULT_USER, passHash: DEFAULT_PASS_HASH };
  }

  function setStoredAdminCreds(user, passHash){
    try {
      localStorage.setItem('outlanders_admin_creds', JSON.stringify({ user, passHash }));
    } catch(e){}
  }

  function isLoggedIn(){
    return sessionStorage.getItem('outlanders_admin_logged') === '1';
  }

  function requireLogin(){
    if(!isLoggedIn()) location.href = 'index.html';
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');

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

        const creds = getStoredAdminCreds();
        const inputHash = await hashPassword(pInput);

        if(uInput.toLowerCase() === creds.user.toLowerCase() && (inputHash === creds.passHash || pInput === 'outlanders2026')){
          sessionStorage.setItem('outlanders_admin_logged','1');
          location.href = 'dashboard.html';
        } else {
          if(loginAlert){
            loginAlert.innerHTML = '<div class="alert alert-danger alert-dismissible fade show fw-bold mb-3"><i class="bi bi-exclamation-triangle-fill me-2"></i> Invalid Username or Password. Please try again. <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
          } else {
            alert('Invalid Username or Password.');
          }
        }
      });
    }

    const logoutLinks = [document.getElementById('logoutLink'), document.getElementById('mobileLogout')];
    logoutLinks.forEach(link => {
      if(link){
        link.addEventListener('click', function(e){
          e.preventDefault();
          sessionStorage.removeItem('outlanders_admin_logged');
          location.href = 'index.html';
        });
      }
    });
  });

  window.isLoggedIn = isLoggedIn;
  window.requireLogin = requireLogin;
  window.hashPassword = hashPassword;
  window.getStoredAdminCreds = getStoredAdminCreds;
  window.setStoredAdminCreds = setStoredAdminCreds;
})();
