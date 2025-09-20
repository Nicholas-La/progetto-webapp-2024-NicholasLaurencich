(function(){
  function setToken(t){ localStorage.setItem('authToken', t); }
  function getToken(){ return localStorage.getItem('authToken'); }
  async function sha256hex(str){
    const enc=new TextEncoder();
    const data=enc.encode(str);
    const hash=await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('loginForm');
    if(!form) return;
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailErrEl = document.getElementById('err-email');
    const passwordErrEl = document.getElementById('err-password');

    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();

      // tolgo messaggi di errore precedenti
      if(emailErrEl) emailErrEl.textContent = '';
      if(passwordErrEl) passwordErrEl.textContent = '';

      const email = emailInput.value?.trim()||'';
      const password = passwordInput.value||'';

      let hasError = false;

      // Validazione campo email
      if (!email) {
        if(emailErrEl) emailErrEl.textContent = 'Devi compilare questo campo.';
        hasError = true;
      } else if (!email.includes('@')) { 
        if (emailErrEl) emailErrEl.textContent = 'Indirizzo email non valido.';
        hasError = true;
      }
      
      // Validazione campo password
      if (!password) {
        if(passwordErrEl) passwordErrEl.textContent = 'Devi compilare questo campo.';
        hasError = true;
      }

      if (hasError) {
        return;
      }
      
      try {
        const password_digest = await sha256hex(password);
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password_digest })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.token) {
            setToken(data.token);
            location.href = '/'; 
            return;
          }
        }
        
        const errorData = await res.json();
       
        if (passwordErrEl) {
          passwordErrEl.textContent = 'credenziali non valide.';
        }

      } catch (e) {
        if(passwordErrEl) passwordErrEl.textContent = 'Errore durante la connessione al server.';
        console.error('Errore di rete:', e);
      }
    });
  });
  window.getToken=getToken;
  window.setToken=setToken;
})();