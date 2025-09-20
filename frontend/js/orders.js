async function loadOrders() {
  const ordersList = document.getElementById('ordersList');
  try {
    const orders = await apiFetch('/orders');

    if (orders.length === 0) {
      ordersList.innerHTML = '<div class="card" style="max-width:700px;margin:20px auto"><p style="text-align:center">Nessun ordine trovato.</p></div>';
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const formattedDate = new Date(order.createdAt).toLocaleDateString('it-IT', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      
      return `
        <div class="order-card card">
          <div class="order-summary">
            <strong>Ordine #${order.id}</strong><br>
            Data: ${formattedDate}<br>
            Totale: ${order.final_total.toFixed(2)}€
          </div>
          <div class="order-actions">
            <a href="/order-details.html?id=${order.id}" class="btn-primary">Visualizza dettagli</a>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Errore nel caricamento degli ordini:', err);
    ordersList.innerHTML = '<div class="card" style="max-width:700px;margin:20px auto"><p style="text-align:center">Errore nel caricamento degli ordini.</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', loadOrders);