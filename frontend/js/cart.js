
function renderCartBadge(){
  const badge = document.getElementById('cart-badge') || document.getElementById('cartCount');
  if(badge){
    const c = getCart();
    badge.textContent = c.reduce((s,i) => s + i.qty, 0) || '';
  }
}

function formatPrice(p) {
  return Number(p).toFixed(2) + '€';
}

function renderCart(){
  const cart = getCart();
  const cartListContainer = document.getElementById('cartList');
  const cartTotalEl = document.getElementById('cartTotal');
  
  if(!cartListContainer) return;
  
  if(cart.length === 0){
    cartListContainer.innerHTML = '<div class="card" style="text-align:center">Il carrello è vuoto.</div>';
    cartTotalEl.textContent = '0.00€';
    renderCartBadge();
    return;
  }
  
  let subtotal = 0;
  
  const cartHtml = cart.map((item) => {
    const totalItemPrice = item.price * item.qty;
    subtotal += totalItemPrice;
    
    return `
      <div class="cart-item-card">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img"/>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
        </div>
        <div class="cart-item-controls">
          <input 
            type="number" 
            min="1" 
            max="5" 
            value="${item.qty}" 
            data-id="${item.id}" 
            class="qty-input"
          />
          <button class="ghost del-btn" data-id="${item.id}">Elimina</button>
        </div>
      </div>
    `;
  }).join('');
  
  cartListContainer.innerHTML = cartHtml;
  cartTotalEl.textContent = formatPrice(subtotal);
  
  cartListContainer.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = Number(btn.dataset.id);
      const c = getCart().filter(item => item.id !== productId);
      setCart(c);
      renderCart();
      renderCartBadge();
    });
  });
  
  cartListContainer.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const productId = Number(input.dataset.id);
      let newQty = parseInt(input.value) || 1;

      
      newQty = Math.min(Math.max(1, newQty), 5);

   
      input.value = newQty;

      const c = getCart();
      const itemToUpdate = c.find(item => item.id === productId);
      
      if(itemToUpdate){
        itemToUpdate.qty = newQty;
        setCart(c);
        renderCart();
        renderCartBadge();
      }
    });
  });
  
  renderCartBadge();
}

document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if(checkoutBtn){
    checkoutBtn.addEventListener('click', async () => {
      const cart = getCart();
      if(cart.length === 0){
        return;
      }
      location.href = '/checkout.html';
    });
  }
  
  renderCart();
});

