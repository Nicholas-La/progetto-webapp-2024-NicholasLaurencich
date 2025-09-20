function validateLettersOnly(v){
  return /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(v);
}
function validateEmail(e){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function validatePwd(p){
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(p);
}
function validateCap(c){
  return /^\d{2,10}$/.test(c);
}
function validateCardNumber(n){
  return /^\d{13,19}$/.test(n);
}
function validateExpiry(s){
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(s);
  if (!m) return false;
  const month = Number(m[1]), year = 2000 + Number(m[2]);
  const last = new Date(year, month, 0, 23, 59, 59, 999);
  return last >= new Date();
}
function validateCvv(c){
  return /^\d{3,4}$/.test(c);
}

async function sha256hex(str){
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

function clearAllErrors(){
  document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
}
function setError(id, msg){
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

function attachLiveValidation(){
  const mapping = [
    {id:'nome', fn: v => validateLettersOnly(v)},
    {id:'cognome', fn: v => validateLettersOnly(v)},
    {id:'email', fn: v => validateEmail(v)},
    {id:'password', fn: v => validatePwd(v)},
    {id:'via', fn: v => v.trim().length > 0},
    {id:'paese', fn: v => validateLettersOnly(v)},
    {id:'cap', fn: v => validateCap(v)},
    {id:'card_number', fn: v => validateCardNumber(v.replace(/\s+/g,''))},
    {id:'card_holder', fn: v => validateLettersOnly(v)},
    {id:'expiry', fn: v => validateExpiry(v)},
    {id:'cvv', fn: v => validateCvv(v)}
  ];

  mapping.forEach(m => {
    const el = document.getElementById(m.id);
    if (!el) return;
    el.addEventListener('input', () => {
      const v = el.value.trim();
      if (m.fn(v)) {
        const err = document.getElementById('err-' + m.id);
        if (err) err.textContent = '';
      }
     
      if (m.id === 'card_number') {
        const cursor = el.selectionStart;
        const raw = el.value.replace(/\D/g,'');
        const sp = raw.match(/.{1,4}/g);
        if (sp) {
          el.value = sp.join(' ');
        } else {
          el.value = raw;
        }
        try { el.setSelectionRange(cursor, cursor); } catch {}
      }
    });
  });

  const privacy = document.getElementById('privacy');
  if (privacy) privacy.addEventListener('change', () => {
    if (privacy.checked) document.getElementById('err-privacy').textContent = '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachLiveValidation();

  document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    document.getElementById('err-general').textContent = '';

    const nome = document.getElementById('nome').value.trim();
    const cognome = document.getElementById('cognome').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const password_confirm = document.getElementById('password_confirm').value;
    const via = document.getElementById('via').value.trim();
    const paese = document.getElementById('paese').value.trim();
    const cap = document.getElementById('cap').value.trim();
    const card_number = document.getElementById('card_number').value.replace(/\s+/g,'');
    const card_holder = document.getElementById('card_holder').value.trim();
    const expiry = document.getElementById('expiry').value.trim();
    const cvv = document.getElementById('cvv').value.trim();
    const privacy = document.getElementById('privacy').checked;

    let ok = true;
    if (!validateLettersOnly(nome)){ setError('err-nome','Nome non valido (solo lettere)'); ok = false; }
    if (!validateLettersOnly(cognome)){ setError('err-cognome','Cognome non valido (solo lettere)'); ok = false; }
    if (!validateEmail(email)){ setError('err-email','Email non valida'); ok = false; }
    if (!validatePwd(password)){ setError('err-password','Password debole: min 8, maiuscole, minuscole, numeri e simboli'); ok = false; }

    if (!password_confirm) {
      setError('err-password_confirm','Conferma password obbligatoria');
      ok = false;
    } else if (password !== password_confirm) {
      setError('err-password_confirm','Le password non corrispondono');
      ok = false;
    }

    if (!via){ setError('err-via','Inserisci la via'); ok = false; }
    if (!validateLettersOnly(paese)){ setError('err-paese','Paese non valido (solo lettere)'); ok = false; }
    if (!validateCap(cap)){ setError('err-cap','CAP non valido (solo numeri)'); ok = false; }
    if (!validateCardNumber(card_number)){ setError('err-card','Numero carta non valido (13–19 cifre)'); ok = false; }
    if (!validateLettersOnly(card_holder)){ setError('err-holder','Intestatario non valido (solo lettere)'); ok = false; }
    if (!validateExpiry(expiry)){ setError('err-expiry','Scadenza non valida o già scaduta (MM/AA)'); ok = false; }
    if (!validateCvv(cvv)){ setError('err-cvv','CVV non valido (3 o 4 cifre)'); ok = false; }
    if (!privacy){ setError('err-privacy','Devi accettare la privacy'); ok = false; }

    if (!ok) return; 

    try {
      const digest = await sha256hex(password);

      const body = {
        nome, cognome, email,
        password_digest: digest,
        via, paese, cap,
        card_number, card_holder, expiry, cvv,
        privacy: true
      };

      const res = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      setToken(res.token);
      location.href = '/';
    } catch (err) {
      const txt = (err && err.message) ? err.message : 'Errore durante registrazione';
      document.getElementById('err-general').textContent = txt;
    }
  });
});
