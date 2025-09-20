import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend')));

let db;
(async () => {
  db = await open({ filename: path.join(__dirname, 'data', 'store.db'), driver: sqlite3.Database });
})();

const requireAuth = async (req,res,next) => {
  const token = req.header('X-Auth-Token');
  if (!token) return res.status(401).json({error:'Devi essere loggato'});
  const user = await db.get('SELECT id, email, first_name, last_name FROM users WHERE id = ?', [token]);
  if (!user) return res.status(401).json({error:'Token non valido'});
  req.user = user;
  next();
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const cardRegex = /^\d{13,19}$/;
const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2})$/;

const validateExpiry = (s) => {
    const m = expiryRegex.exec(s);
    if (!m) return false;
    const month = Number(m[1]), year = 2000 + Number(m[2]);
    const last = new Date(year, month, 0, 23, 59, 59, 999);
    return last >= new Date();
};


// Registrazione il client invia sha256(password)
app.post('/api/register', async (req, res) => {
  const {
    nome, cognome, email, password_digest,
    via, paese, cap, card_number, card_holder,
    expiry, cvv, privacy
  } = req.body || {};

  // campi obbligatori
  if (!nome || !cognome || !email || !password_digest || !via || !paese || !cap || !card_number || !card_holder || !expiry || !cvv || !privacy) {
    return res.status(400).json({ error: 'Compila tutti i campi obbligatori' });
  }

  // regex
  const capRegex = /^\d{2,10}$/;
  const cvvRegex = /^\d{3,4}$/;

  if (!nameRegex.test(nome)) return res.status(400).json({ error: 'Nome non valido' });
  if (!nameRegex.test(cognome)) return res.status(400).json({ error: 'Cognome non valido' });
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email non valida' });
  if (!nameRegex.test(paese)) return res.status(400).json({ error: 'Paese non valido' });
  if (!capRegex.test(cap)) return res.status(400).json({ error: 'CAP non valido' });
  if (typeof password_digest !== 'string' || password_digest.length !== 64) return res.status(400).json({ error: 'Formato password non valido' });
  if (!cardRegex.test(String(card_number).replace(/\s+/g, ''))) return res.status(400).json({ error: 'Numero carta non valido' });
  if (!nameRegex.test(card_holder)) return res.status(400).json({ error: 'Intestatario carta non valido' });
  if (!cvvRegex.test(String(cvv))) return res.status(400).json({ error: 'CVV non valido' });
  if (!validateExpiry(expiry)) return res.status(400).json({ error: 'Formato scadenza non valido o carta scaduta (MM/AA)' });
  
  // controllo privacy 
  if (!(privacy === true || privacy === 'true' || privacy === 'on')) {
    return res.status(400).json({ error: 'Devi accettare la privacy' });
  }

  // hash e salvataggio
  try {
    const hashed = await bcrypt.hash(password_digest, 10);

    // salva utente
    const address = `${via}, ${cap}, ${paese}`;
    const r = await db.run('INSERT INTO users (email, password, first_name, last_name, address) VALUES (?,?,?,?,?)',
      [email, hashed, nome, cognome, address]);

    // memorizza solo le ultime 4 cifre della carta (no CVV)
    const last4 = String(card_number).replace(/\D/g,'').slice(-4);
    await db.run('INSERT INTO cards (userId, number, holder, expiry) VALUES (?,?,?,?)', [r.lastID, last4, card_holder, expiry]);

    const user = await db.get('SELECT id, email, first_name, last_name FROM users WHERE id = ?', [r.lastID]);
    res.json({ token: String(user.id), userId: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email già registrata' });
    console.error(err);
    res.status(500).json({ error: 'Errore server' });
  }
});

// Login (client invia sha256 digest)
app.post('/api/login', async (req,res)=>{
  const { email, password_digest } = req.body || {};
  if (!email || !password_digest) return res.status(400).json({error:'Email e password richieste'});
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({error:'Credenziali non valide'});
  const ok = await bcrypt.compare(password_digest, user.password);
  if (!ok) return res.status(401).json({error:'Credenziali non valide'});
  res.json({ token: String(user.id), userId: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email });
});

// ottengo i dati dell'utente
app.get('/api/me', requireAuth, async (req,res)=>{
  const user = await db.get('SELECT id,email,first_name,last_name,address FROM users WHERE id = ?', [req.user.id]);
  const [via, cap, paese] = user.address.split(',').map(s => s.trim());
  res.json({ ...user, via, cap, paese, name: user.first_name, cognome: user.last_name });
});

// aggiorno i dati dell'utente
app.put('/api/me', requireAuth, async (req,res)=>{
  const { nome, cognome, via, paese, cap } = req.body || {};

  // Validazione dei campi
  if (nome && !nome.match(nameRegex)) return res.status(400).json({error:'Nome non valido'});
  if (cognome && !cognome.match(nameRegex)) return res.status(400).json({error:'Cognome non valido'});
  if (paese && !paese.match(nameRegex)) return res.status(400).json({error:'Paese non valido'});
  if (cap && !cap.match(/^\d{2,10}$/)) return res.status(400).json({error:'CAP non valido'});

  const address = `${via||''}, ${cap||''}, ${paese||''}`;
  
  await db.run('UPDATE users SET first_name = ?, last_name = ?, address = ? WHERE id = ?',
    [nome||'', cognome||'', address, req.user.id]);
  
  const updated = await db.get('SELECT id,email,first_name,last_name,address FROM users WHERE id = ?', [req.user.id]);
  const [updatedVia, updatedCap, updatedPaese] = updated.address.split(',').map(s => s.trim());
  res.json({ ...updated, via: updatedVia, cap: updatedCap, paese: updatedPaese, name: updated.first_name, cognome: updated.last_name });
});

// modifica password
app.put('/api/me/password', requireAuth, async (req, res) => {
  const { newPassword_digest, confirmPassword_digest } = req.body || {};
  if (!newPassword_digest || !confirmPassword_digest) {
    return res.status(400).json({ error: 'Devi inserire la nuova password e la conferma' });
  }
  if (newPassword_digest !== confirmPassword_digest) {
    return res.status(400).json({ error: 'Le password non corrispondono' });
  }
  //validazione del digest
  if (newPassword_digest.length !== 64) {
    return res.status(400).json({ error: 'Formato password non valido' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword_digest, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.status(200).json({ message: 'Password aggiornata con successo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento della password' });
  }
});


// Carte
app.get('/api/cards', requireAuth, async (req,res)=>{
  const cards = await db.all('SELECT id, number, holder, expiry FROM cards WHERE userId = ?', [req.user.id]);
  res.json(cards.map(c => ({ id: c.id, number: '**** **** **** ' + String(c.number).slice(-4), holder: c.holder, expiry: c.expiry })));
});
app.post('/api/cards', requireAuth, async (req,res)=>{
  const { number, holder, expiry } = req.body || {};
  if (!number || !holder || !expiry) return res.status(400).json({error:'Numero, intestatario e scadenza sono richiesti'});
  
  // Validazione lato server della carta
  if (!cardRegex.test(String(number).replace(/\s+/g, ''))) return res.status(400).json({error:'Numero carta non valido'});
  if (!nameRegex.test(holder)) return res.status(400).json({error:'Intestatario carta non valido'});
  if (!validateExpiry(expiry)) return res.status(400).json({error:'Scadenza non valida o carta scaduta'});
  
  const last4 = String(number).replace(/\s+/g,'').slice(-4);
  await db.run('INSERT INTO cards (userId, number, holder, expiry) VALUES (?,?,?,?)', [req.user.id, last4, holder, expiry]);
  const cards = await db.all('SELECT id, number, holder, expiry FROM cards WHERE userId = ?', [req.user.id]);
  res.status(201).json(cards.map(c => ({ id:c.id, number: '**** **** **** ' + c.number, holder: c.holder, expiry: c.expiry })));
});
app.delete('/api/cards/:id', requireAuth, async (req,res)=>{
  const id = req.params.id;
  await db.run('DELETE FROM cards WHERE id = ? AND userId = ?', [id, req.user.id]);
  res.status(204).end();
});

// Prodotti
app.get('/api/products', async (req, res) => {
    const q = (req.query.q||'').toString().trim().toLowerCase();
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit)||12));
    const offset = Math.max(0, parseInt(req.query.offset)||0);
    
    const category = (req.query.category || '').toString().trim();
    
    const params = [];
    let where = 'WHERE 1=1';
    
    if (q) {
        where += ' AND title LIKE ?';
        params.push(`%${q}%`);
    }

    
    if (category) {
        where += ' AND category = ?';
        params.push(category);
    }
    
    const count = await db.get(`SELECT count(*) as total FROM products ${where}`, params);
    const products = await db.all(`SELECT * FROM products ${where} LIMIT ? OFFSET ?`, [...params, Number(limit), Number(offset)]);
    res.json({ results: products, total: count.total });
});
app.get('/api/products/:id', async (req,res)=>{
  const p = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({error:'Prodotto non trovato'});
  res.json(p);
});

// recupero gli ordini di un utente
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    const orders = await db.all('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [req.user.id]);
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero degli ordini' });
  }
});


// max 5 prodotti
app.post('/api/orders', requireAuth, async (req,res)=>{
  const { items, subtotal, shipping_cost, shipping_method, final_total } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({error:'Carrello vuoto'});
  }
  if (typeof subtotal !== 'number' || typeof shipping_cost !== 'number' || typeof final_total !== 'number' || !shipping_method) {
    return res.status(400).json({ error: 'Dati di costo e spedizione mancanti' });
  }
  
  // limito gli articoli nel carrello
  if (items.length > 20) {
    return res.status(400).json({error:'Numero massimo di articoli per ordine è 20'});
  }

  // verifico che i totali inviati dal client corrispondano ai calcoli del server
  let calculatedSubtotal = 0;
  for (const it of items){
    
    const p = await db.get('SELECT price FROM products WHERE id = ?', [it.id]);
    if (!p) {
        return res.status(400).json({error:`Prodotto ${it.id} inesistente`});
    }
    const qty = Math.max(1, parseInt(it.qty)||1);
    if (qty > 5) return res.status(400).json({error:`Quantità massima per prodotto è 5`});
    calculatedSubtotal += p.price * qty;
  }
  
  const shippingCostFromServer = (shipping_method === 'express') ? 10.00 : ((calculatedSubtotal > 50) ? 0.00 : 5.00);
  const finalTotalFromServer = calculatedSubtotal + shippingCostFromServer;
  
  if (Math.abs(calculatedSubtotal - subtotal) > 0.01 || Math.abs(shippingCostFromServer - shipping_cost) > 0.01 || Math.abs(finalTotalFromServer - final_total) > 0.01) {
    return res.status(400).json({ error: 'Discrepanza nei calcoli dell\'ordine. Riprovare.' });
  }

  const createdAt = new Date().toISOString();
  const r = await db.run(
    'INSERT INTO orders (userId, items, subtotal, shipping_cost, shipping_method, final_total, createdAt) VALUES (?,?,?,?,?,?,?)',
    [req.user.id, JSON.stringify(items), calculatedSubtotal, shippingCostFromServer, shipping_method, finalTotalFromServer, createdAt]
  );
  
  const created = await db.get('SELECT * FROM orders WHERE id = ?', [r.lastID]);
  res.status(201).json({...created, items: JSON.parse(created.items)});
});


// recupero un singolo ordine di un utente per ID
app.get('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND userId = ?', [orderId, req.user.id]);

    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }
    
    // invio la risposta
    res.json({ ...order, items: JSON.parse(order.items) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dell\'ordine' });
  }
});


app.listen(PORT, ()=> console.log(`Server running on http://localhost:${PORT}`));