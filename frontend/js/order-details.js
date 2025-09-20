async function loadOrderDetails() {
  const orderDetailsContainer = document.getElementById('orderDetailsContainer');
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    orderDetailsContainer.innerHTML = '<p style="text-align:center;color:var(--danger)">ID ordine non specificato.</p>';
    return;
  }

  try {
    const order = await apiFetch(`/orders/${orderId}`);

    const formattedDate = new Date(order.createdAt).toLocaleDateString('it-IT', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const itemsHtml = order.items.map(item => `
      <div class="order-item">
        <img src="${item.image}" alt="${item.title}" class="order-item-img"/>
        <div class="order-item-details">
          <span class="order-item-title">${item.title}</span>
          <span class="order-item-qty">Qtà: ${item.qty}</span>
          <span class="order-item-price">${(item.price * item.qty).toFixed(2)}€</span>
        </div>
      </div>
    `).join('');

    // Recupera i dati dell'utente per l'indirizzo di spedizione
    const user = await apiFetch('/me');
    const shippingAddress = `${user.via}, ${user.paese}, ${user.cap}`;
    
    orderDetailsContainer.innerHTML = `
      <h3>Riepilogo Ordine #${order.id}</h3>
      <p><strong>Data Ordine:</strong> ${formattedDate}</p>
      <p><strong>Indirizzo Spedizione:</strong> ${shippingAddress}</p>
      
      <div class="order-items-list">
        <h4>Articoli ordinati:</h4>
        ${itemsHtml}
      </div>

      <div class="order-summary-details">
        <p><strong>Subtotale:</strong> ${order.subtotal.toFixed(2)}€</p>
        <p><strong>Costo Spedizione (${order.shipping_method}):</strong> ${order.shipping_cost.toFixed(2)}€</p>
        <p><strong>Totale Finale:</strong> <span class="order-total">${order.final_total.toFixed(2)}€</span></p>
      </div>
    `;
  } catch (err) {
    console.error('Errore nel caricamento dei dettagli dell\'ordine:', err);
    orderDetailsContainer.innerHTML = `<p style="text-align:center;color:var(--danger)">Errore: ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadOrderDetails);