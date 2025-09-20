const API = '/api';

function getToken() { return localStorage.getItem('authToken'); }
function setToken(t) { localStorage.setItem('authToken', t); }
function clearToken() { localStorage.removeItem('authToken'); }
function getWishlist() { const m = document.cookie.match(/(?:^|;\s*)wishlist=([^;]+)/); if (!m) return []; try { return JSON.parse(decodeURIComponent(m[1])); } catch { return []; } }
function setWishlist(arr) { document.cookie = 'wishlist=' + encodeURIComponent(JSON.stringify(arr)) + '; path=/; max-age=' + (60 * 60 * 24 * 365); }
function toggleWishlist(id) { let w = getWishlist(); if (w.includes(id)) w = w.filter(x => x !== id); else w.push(id); setWishlist(w); renderWishlistBadge(); }

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(cart)) {
      console.warn("Dati del carrello non validi, ripristino a un array vuoto.");
      return [];
    }
    return cart;
  } catch {
    console.error("Errore durante il recupero del carrello, ripristino a un array vuoto.");
    return [];
  }
}
function setCart(c) { localStorage.setItem('cart', JSON.stringify(c)); renderCartBadge(); }

function addToCart(p, qty = 1) {
  const cart = getCart();
  const existing = cart.findIndex(it => it.id === p.id);
  if (existing !== -1) {
    cart[existing].qty = Math.min(5, (cart[existing].qty || 1) + qty);
  } else {
    cart.push({
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.image,
      qty: Math.min(5, qty)
    });
  }
  setCart(cart);
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = { ...opts.headers };
  if (token) {
    headers['X-Auth-Token'] = token;
  }
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(API + path, { ...opts, headers });

  if (res.status === 401) {
    clearToken();
    location.href = '/login.html';
  }

  if (!res.ok) {
    throw new Error((await res.json()).error || res.statusText);
  }

  return res.json();
}

async function loadNavbar() {
  const nav = document.getElementById('nav-right');
  if (!nav) return;
  const logged = !!getToken();
  nav.innerHTML = `
    <a href="/about.html" class="nav-link">About Us</a>
    <a href="/wishlist.html" class="nav-link">Wishlist <span id="wish-badge" class="badge"></span></a>
    <a href="/cart.html" class="nav-link">Carrello <span id="cart-badge" class="badge"></span></a>
    ${logged ? `
      <a href="/profile.html" class="nav-link">Profilo</a>
      <a href="/orders.html" class="nav-link">Ordini</a>
      <button id="logoutBtn" class="btn-logout">Logout</button>
    ` : `
      <a href="/login.html" class="nav-link">Login</a>
      <a href="/register.html" class="nav-link">Registrati</a>
    `}
  `;
  const lb = document.getElementById('logoutBtn');
  if (lb) lb.onclick = () => {
    clearToken();
    location.href = '/';
  };
  renderWishlistBadge();
  renderCartBadge();
}

function renderWishlistBadge() {
  const el = document.getElementById('wish-badge');
  if (!el) return;
  const w = getWishlist();
  el.textContent = w.length > 0 ? w.length : '';
}

function renderCartBadge() {
  const el = document.getElementById('cart-badge');
  if (!el) return;
  const c = getCart();
  const totalItems = c.reduce((sum, item) => sum + item.qty, 0);
  el.textContent = totalItems > 0 ? totalItems : '';
}

document.addEventListener('DOMContentLoaded', () => {
  loadNavbar();

  // Codice per il pulsante "torna su"
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');

  // verifico se l'elemento esiste
  if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        scrollToTopBtn.classList.add('show');
      } else {
        scrollToTopBtn.classList.remove('show');
      }
    });

    scrollToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});