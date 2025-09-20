document.addEventListener('DOMContentLoaded', async () => {
  const subtotalEl = document.getElementById('subtotal');
  const shippingTotalEl = document.getElementById('shippingTotal');
  const finalTotalEl = document.getElementById('finalTotal');
  const confirmBtn = document.getElementById('confirmBtn');
  const paymentErrorMsg = document.getElementById('paymentError');
  const paymentOptionsEl = document.getElementById('paymentOptions');

  let cartSubtotal = 0;
  let hasCards = false;

  async function updateTotals() {
    const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
    let shippingCost = 0;
    
    if (shippingMethod === 'express') {
      shippingCost = 10.00;
    } else if (shippingMethod === 'standard') {
      shippingCost = (cartSubtotal > 50) ? 0.00 : 5.00;
    }

    const finalTotal = cartSubtotal + shippingCost;
    
    subtotalEl.textContent = cartSubtotal.toFixed(2) + '€';
    shippingTotalEl.textContent = shippingCost.toFixed(2) + '€';
    finalTotalEl.textContent = finalTotal.toFixed(2) + '€';
  }

  function renderPaymentOptions(cards) {
    if (cards.length === 0) {
      paymentOptionsEl.innerHTML = `
        <div class="shipping-option">
          Nessuna carta salvata.
        </div>
      `;
      hasCards = false;
      confirmBtn.disabled = true;
      paymentErrorMsg.style.display = 'block';
    } else {
      hasCards = true;
      confirmBtn.disabled = false;
      paymentErrorMsg.style.display = 'none';
      paymentOptionsEl.innerHTML = cards.map((card, index) => {
        const lastFour = card.number.slice(-4);
        return `
          <div class="shipping-option">
            <input type="radio" id="card-${card.id}" name="payment" value="${card.id}" ${index === 0 ? 'checked' : ''}>
            <div class="shipping-details">
              <label for="card-${card.id}">Carta che termina con ${lastFour}</label>
              <p style="margin:0;font-size:0.9em;color:var(--muted)">Titolare: ${card.holder}</p>
            </div>
            <span class="shipping-price">${card.expiry}</span>
          </div>
        `;
      }).join('');
    }
  }

  try {
    const [user, cards] = await Promise.all([
      apiFetch('/me'),
      apiFetch('/cards')
    ]);

    document.getElementById('userData').innerHTML = `
      <div><strong>Nome:</strong> ${user.first_name || ''} ${user.last_name || ''}</div>
      <div><strong>Indirizzo:</strong> ${user.via || ''}, ${user.paese || ''}, ${user.cap || ''}</div>
    `;

    renderPaymentOptions(cards);

    const cart = getCart();
    if (cart.length > 0) {
      document.getElementById('orderSummary').innerHTML = cart.map(item => `
        <div class="order-item">
          <img src="${item.image}" alt="${item.title}" class="order-item-img"/>
          <div class="order-item-details">
            <div class="order-item-title">${item.title}</div>
            <div class="order-item-qty">Qtà: ${item.qty}</div>
          </div>
          <span class="order-item-price">${(item.price * item.qty).toFixed(2)}€</span>
        </div>
      `).join('');
      cartSubtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
    } else {
      document.getElementById('orderSummary').innerHTML = '<div>Carrello vuoto</div>';
      confirmBtn.disabled = true;
      if (!hasCards) {
        paymentErrorMsg.style.display = 'none';
      }
    }
    
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
      radio.addEventListener('change', updateTotals);
    });
    
    updateTotals();

    document.getElementById('editProfileBtn').onclick = () => {
      location.href = '/profile.html';
    };

    document.getElementById('editPaymentBtn').onclick = () => {
      location.href = '/profile.html';
    };

    confirmBtn.onclick = async () => {
      if (confirmBtn.disabled) return;
      
      const updatedCart = getCart();
      if (!updatedCart.length) {
       // alert('Il carrello è vuoto');
        return;
      }

      const shippingMethod = document.querySelector('input[name="shipping"]:checked').value;
      const subtotal = parseFloat(subtotalEl.textContent);
      const shippingCost = parseFloat(shippingTotalEl.textContent);
      const finalTotal = parseFloat(finalTotalEl.textContent);

      try {
        const order = await apiFetch('/orders', {
          method: 'POST',
          body: JSON.stringify({
            items: updatedCart,
            subtotal: subtotal,
            shipping_cost: shippingCost,
            shipping_method: shippingMethod,
            final_total: finalTotal
          })
        });
        
        setCart([]);
        location.href = `/thankyou.html?id=${order.id}`;

      } catch (err) {
       // alert("Errore durante l'invio dell'ordine: " + (err.message || 'Errore sconosciuto.'));
      }
    };

  } catch (e) {
    if (e.message !== 'Token non valido') {
      //alert("Errore nel caricamento dei dati: " + e.message);
    }
  }
});