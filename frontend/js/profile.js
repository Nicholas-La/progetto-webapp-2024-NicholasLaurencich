// Funzioni di validazione
function validateText(text) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(text);
}

function validateCap(cap) {
  return /^\d{2,10}$/.test(cap);
}

function validatePassword(p) {
  // almeno 8, 1 maiuscola, 1 minuscola, 1 numero, 1 simbolo
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(p);
}

// Funzione per il calcolo dell'hash SHA-256 
async function sha256hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// validazione per la carta
function validateExpiry(s) {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(s);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  const last = new Date(year, month, 0, 23, 59, 59, 999);
  return last >= new Date();
}

function validateCvv(c) {
  return /^\d{3,4}$/.test(c);
}


async function loadProfile() {
  try {
    const me = await apiFetch('/me');
    document.getElementById('first_name').value = me.first_name || '';
    document.getElementById('last_name').value = me.last_name || '';
    document.getElementById('via').value = me.via || '';
    document.getElementById('paese').value = me.paese || '';
    document.getElementById('cap').value = me.cap || '';

  
    document.getElementById('first_name').readOnly = true;
    document.getElementById('last_name').readOnly = true;
    document.getElementById('via').readOnly = true;
    document.getElementById('paese').readOnly = true;
    document.getElementById('cap').readOnly = true;
    document.getElementById('saveBtn').disabled = true;

    loadCards();
  } catch (err) {
    //alert('Devi essere loggato');
    location.href = '/login.html';
  }
}

// Gestionemodifica del profilo
document.getElementById('editBtn').onclick = () => {
  document.getElementById('first_name').readOnly = false;
  document.getElementById('last_name').readOnly = false;
  document.getElementById('via').readOnly = false;
  document.getElementById('paese').readOnly = false;
  document.getElementById('cap').readOnly = false;
  document.getElementById('saveBtn').disabled = false;
};

// Gestione salvataggio del profilo
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('err-first_name').textContent = '';
  document.getElementById('err-last_name').textContent = '';
  document.getElementById('err-address').textContent = '';
  
  const firstName = document.getElementById('first_name').value.trim();
  const lastName = document.getElementById('last_name').value.trim();
  const via = document.getElementById('via').value.trim();
  const paese = document.getElementById('paese').value.trim();
  const cap = document.getElementById('cap').value.trim();
  
  let hasError = false;

  if (!validateText(firstName)) {
    document.getElementById('err-first_name').textContent = 'Nome non valido';
    hasError = true;
  }
  
  if (!validateText(lastName)) {
    document.getElementById('err-last_name').textContent = 'Cognome non valido';
    hasError = true;
  }

  if (!validateText(paese)) {
    document.getElementById('err-address').textContent = 'Paese non valido';
    hasError = true;
  }
  
  if (!validateCap(cap)) {
    document.getElementById('err-address').textContent = 'CAP non valido';
    hasError = true;
  }

  if (hasError) {
    return;
  }
  
  try {
    await apiFetch('/me', {
      method: 'PUT',
      body: JSON.stringify({ nome: firstName, cognome: lastName, via, paese, cap })
    });

    document.getElementById('first_name').readOnly = true;
    document.getElementById('last_name').readOnly = true;
    document.getElementById('via').readOnly = true;
    document.getElementById('paese').readOnly = true;
    document.getElementById('cap').readOnly = true;
    document.getElementById('saveBtn').disabled = true;
    //alert('Profilo aggiornato');
  } catch (err) {
    const errorData = await err.response.json();
    document.getElementById('err-address').textContent = errorData.error || 'Errore durante l\'aggiornamento.';
  }
});

// Gestione cambio password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('err-password').textContent = '';

  const newPassword = document.getElementById('new_password').value;
  const confirmPassword = document.getElementById('confirm_password').value;

  if (newPassword !== confirmPassword) {
    document.getElementById('err-password').textContent = 'Le password non corrispondono';
    return;
  }

  if (!validatePassword(newPassword)) {
    document.getElementById('err-password').textContent = 'La password deve avere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un simbolo.';
    return;
  }

  try {
    const newPassword_digest = await sha256hex(newPassword);
    const confirmPassword_digest = await sha256hex(confirmPassword);

    await apiFetch('/me/password', {
      method: 'PUT',
      body: JSON.stringify({ newPassword_digest, confirmPassword_digest })
    });

    document.getElementById('new_password').value = '';
    document.getElementById('confirm_password').value = '';
    //alert('Password aggiornata con successo!');
  } catch (err) {
    const errorData = await err.response.json();
    document.getElementById('err-password').textContent = errorData.error || 'Errore durante l\'aggiornamento della password.';
  }
});

async function loadCards() {
  const list = document.getElementById('cardsList');
  const cards = await apiFetch('/cards');
  
  if (!cards.length) {
    list.innerHTML = '<div class="small">Nessuna carta salvata</div>';
  } else {
    list.innerHTML = cards.map(c => 
      `<div class="card-small" data-id="${c.id}">
        <div>**** **** **** ${c.number} — ${c.holder} — Scad. ${c.expiry}
          <button data-del="${c.id}" class="ghost" style="float:right">Elimina</button>
        </div>
      </div>`
    ).join('');
  }
  
  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation(); 
      const cardElement = btn.closest('.card-small');
      const cardId = btn.dataset.del;
      
     
      cardElement.remove();
      
      try {
      
        await apiFetch('/cards/' + cardId, { method: 'DELETE' });
      } catch (err) {
       // se fallisce ricarica catre
        loadCards();
      }
    };
  });
}

// Gestione del form per aggiungere una nuova carta
document.getElementById('addCardForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('err-card').textContent = '';
  document.getElementById('err-expiry').textContent = '';
  document.getElementById('err-cvv').textContent = '';
  
  const num = document.getElementById('card_number').value.replace(/\s+/g, '');
  const holder = document.getElementById('card_holder').value.trim();
  const expiry = document.getElementById('expiry').value.trim();
  const cvv = document.getElementById('cvv').value.trim(); // CVV è solo per validazione lato client
  
  let hasError = false;

  if (!/^\d{13,19}$/.test(num)) {
    document.getElementById('err-card').textContent = 'Numero carta non valido';
    hasError = true;
  }
  
  if (!validateExpiry(expiry)) {
    document.getElementById('err-expiry').textContent = 'Data di scadenza non valida (MM/AA)';
    hasError = true;
  }
  
  if (!validateCvv(cvv)) {
    document.getElementById('err-cvv').textContent = 'CVV non valido (3 o 4 cifre)';
    hasError = true;
  }
  
  if (hasError) {
    return;
  }

  try {
    // Inviamo solo numero, holder ed expiry al server, NON il CVV
    await apiFetch('/cards', {
      method: 'POST',
      body: JSON.stringify({ number: num, holder, expiry })
    });
    
    document.getElementById('card_number').value = '';
    document.getElementById('card_holder').value = '';
    document.getElementById('expiry').value = '';
    document.getElementById('cvv').value = '';
    loadCards();
  } catch (err) {
    const errorData = await err.response.json();
    // Utilizza un singolo messaggio di errore generico o specifico se l'API lo fornisce
    document.getElementById('err-expiry').textContent = errorData.error || 'Errore durante l\'aggiunta della carta.';
  }
});

// Aggiunge la formattazione al campo del numero di carta
document.getElementById('card_number').addEventListener('input', (e) => {
  const input = e.target;
  const value = input.value.replace(/\s/g, '');
  const selectionStart = input.selectionStart;

  let newPosition = selectionStart;
  const oldLength = input.value.length;
  const newLength = value.length;

  const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');

  // Calcola la nuova posizione del cursore
  const spacesAdded = formattedValue.slice(0, selectionStart).split(' ').length - 1;
  newPosition = selectionStart + (formattedValue.split(' ').length - 1) - spacesAdded;
  
  // Aggiorna il valore e riposiziona il cursore
  input.value = formattedValue;
  if (newPosition <= input.value.length) {
    input.setSelectionRange(newPosition, newPosition);
  }
});

document.addEventListener('DOMContentLoaded', loadProfile);