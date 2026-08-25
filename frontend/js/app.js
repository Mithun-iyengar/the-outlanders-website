// General UI interactions, scroll reveals, and full CMS dynamic hydration
(function(){
  'use strict';

  document.documentElement.classList.add('js-reveal');

  document.addEventListener('DOMContentLoaded', async function(){
    const nav = document.getElementById('mainNav') || document.querySelector('.navbar');
    const links = document.querySelectorAll('.navbar-nav .nav-link');

    // 1. Hydrate Site-wide CMS Content (Social links, WhatsApp numbers, Footer)
    if(window.DataAPI && typeof window.DataAPI.getSiteSettings === 'function'){
      try {
        const settings = await window.DataAPI.getSiteSettings();
        
        // Update WhatsApp links
        if(settings.whatsapp){
          document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
            const currentText = a.search ? new URLSearchParams(a.search).get('text') : '';
            a.href = `https://wa.me/${settings.whatsapp}${currentText ? '?text=' + encodeURIComponent(currentText) : ''}`;
          });
        }
        
        // Update Instagram links
        if(settings.instagram){
          document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
            a.href = settings.instagram;
          });
        }

        // Update Call links
        if(settings.phone){
          document.querySelectorAll('a[href^="tel:"]').forEach(a => {
            const rawPhone = settings.phone.replace(/[^\d+]/g, '');
            a.href = `tel:${rawPhone}`;
          });
        }

        // Update Footer copyright
        if(settings.copyright){
          document.querySelectorAll('footer .small').forEach(el => {
            if(el.textContent.includes('©')){
              el.textContent = settings.copyright;
            }
          });
        }

      } catch(e) {
        console.error('SiteSettings hydration error', e);
      }
    }

    // 2. Hydrate Homepage Specific Content
    if(window.DataAPI && typeof window.DataAPI.getHomepageContent === 'function' && document.getElementById('heroSection')){
      try {
        const hp = await window.DataAPI.getHomepageContent();

        // Hero Section
        if(hp.hero){
          const heroEl = document.getElementById('heroSection');
          const titleEl = heroEl.querySelector('.hero-title');
          const subEl = heroEl.querySelector('.hero-sub');
          const btn1 = heroEl.querySelector('.btn-cta');
          const btn2 = heroEl.querySelector('.btn-outline-light');

          if(heroEl && hp.hero.bgImage) heroEl.style.backgroundImage = `url('${hp.hero.bgImage}')`;
          if(titleEl && hp.hero.title) titleEl.textContent = hp.hero.title;
          if(subEl && hp.hero.sub) subEl.textContent = hp.hero.sub;
          if(btn1 && hp.hero.btn1Text) btn1.innerHTML = `${hp.hero.btn1Text} <i class="bi bi-arrow-right" aria-hidden="true"></i>`;
          if(btn1 && hp.hero.btn1Link) btn1.setAttribute('href', hp.hero.btn1Link);
          if(btn2 && hp.hero.btn2Text) btn2.textContent = hp.hero.btn2Text;
          if(btn2 && hp.hero.btn2Link) btn2.setAttribute('href', hp.hero.btn2Link);
        }

        // Discover By Experience Section
        if(hp.discover && Array.isArray(hp.discover.cards)){
          const categorySection = document.querySelector('.category-section');
          if(categorySection){
            const kicker = categorySection.querySelector('.category-kicker');
            const title = categorySection.querySelector('.section-title');
            const sub = categorySection.querySelector('p');
            const row = categorySection.querySelector('.row');

            if(kicker && hp.discover.eyebrow) kicker.textContent = hp.discover.eyebrow;
            if(title && hp.discover.title) title.textContent = hp.discover.title;
            if(sub && hp.discover.sub) sub.textContent = hp.discover.sub;

            const activeCards = hp.discover.cards.filter(c => c.published !== false).sort((a,b) => (a.order||0) - (b.order||0));
            if(row && activeCards.length > 0){
              row.innerHTML = activeCards.map(card => `
                <div class="col-12 col-md-6 col-lg-4">
                  <a class="category-card" href="${card.link || 'treks.html'}">
                    <img class="category-card-img" src="${card.image || '../images/treks/kudremukha/cover.jpg'}" alt="${card.title}" loading="lazy">
                    <div class="category-overlay"></div>
                    <div class="category-content">
                      <h3>${card.title}</h3>
                      <span class="category-link">${card.action || 'EXPLORE ↗'} <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
                    </div>
                  </a>
                </div>
              `).join('');
            }
          }
        }

        // Why Trek With Us Section
        if(hp.whyTrek && Array.isArray(hp.whyTrek.features)){
          const featureSection = document.querySelector('.feature')?.closest('section');
          if(featureSection){
            const kicker = featureSection.querySelector('.category-kicker');
            const title = featureSection.querySelector('.section-title');
            const row = featureSection.querySelector('.row');

            if(kicker && hp.whyTrek.eyebrow) kicker.textContent = hp.whyTrek.eyebrow;
            if(title && hp.whyTrek.title) title.textContent = hp.whyTrek.title;

            const activeFeatures = hp.whyTrek.features.filter(f => f.published !== false).sort((a,b) => (a.order||0) - (b.order||0));
            if(row && activeFeatures.length > 0){
              row.innerHTML = activeFeatures.map(f => `
                <div class="col-12 col-sm-6 col-lg-3">
                  <div class="feature text-center p-4 h-100">
                    <i class="bi ${f.icon || 'bi-map'} fs-1 mb-3 d-block" style="color: var(--accent);"></i>
                    <h3 class="h5 text-white mb-2">${f.title}</h3>
                    <p class="small mb-0" style="color: var(--text-main);">${f.desc}</p>
                  </div>
                </div>
              `).join('');
            }
          }
        }

        // Community Section
        if(hp.community){
          const commSection = document.querySelector('.community-section');
          if(commSection){
            const kicker = commSection.querySelector('.category-kicker');
            const title = commSection.querySelector('.h2');
            const desc = commSection.querySelector('p');
            const btn = commSection.querySelector('.community-btn');

            if(kicker && hp.community.eyebrow) kicker.textContent = hp.community.eyebrow;
            if(title && hp.community.title) title.textContent = hp.community.title;
            if(desc && hp.community.desc) desc.textContent = hp.community.desc;
            if(btn && hp.community.btnText) btn.innerHTML = `<i class="bi bi-whatsapp fs-5"></i> ${hp.community.btnText}`;
          }
        }

        // Final CTA Section
        if(hp.finalCta){
          const ctaSection = document.querySelector('.cta-section');
          if(ctaSection){
            const title = ctaSection.querySelector('h2');
            const desc = ctaSection.querySelector('p');
            const btn = ctaSection.querySelector('.btn-cta');

            if(ctaSection && hp.finalCta.bgImage) ctaSection.style.backgroundImage = `url('${hp.finalCta.bgImage}')`;
            if(title && hp.finalCta.title) title.textContent = hp.finalCta.title;
            if(desc && hp.finalCta.desc) desc.textContent = hp.finalCta.desc;
            if(btn && hp.finalCta.btnText) btn.innerHTML = `${hp.finalCta.btnText} <i class="bi bi-arrow-right" aria-hidden="true"></i>`;
            if(btn && hp.finalCta.btnLink) btn.setAttribute('href', hp.finalCta.btnLink);
          }
        }

      } catch(e) {
        console.error('Homepage CMS hydration error', e);
      }
    }

    // 3. Scroll Reveal Observer (Single-pass IntersectionObserver)
    const revealItems = document.querySelectorAll('.reveal');
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      revealItems.forEach(item => item.classList.add('is-visible'));
    } else if('IntersectionObserver' in window){
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -30px'
      });

      revealItems.forEach(item => revealObserver.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
    }

    // 4. Navbar scroll state
    function onScroll(){
      if(window.scrollY > 40){
        nav && nav.classList.add('scrolled');
      } else {
        nav && nav.classList.remove('scrolled');
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // 5. Highlight active navbar link matching current page URL
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(link => {
      const href = link.getAttribute('href');
      if(href && (href === currentPath || (currentPath === '' && href === 'index.html'))){
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // 6. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e){
        const selector = this.getAttribute('href');
        if(selector === '#' || !selector) return;
        const target = document.querySelector(selector);
        if(target){
          e.preventDefault();
          const navHeight = nav ? nav.offsetHeight : 80;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // 7. Initialize Bootstrap tooltips
    if(typeof bootstrap !== 'undefined' && bootstrap.Tooltip){
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  });
})();
