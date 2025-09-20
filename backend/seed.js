import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = await open({ filename: path.join(__dirname,'data','store.db'), driver: sqlite3.Database });

await db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  address TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  number TEXT NOT NULL,
  holder TEXT NOT NULL,
  expiry TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT,
  category TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  items TEXT NOT NULL,
  subtotal REAL NOT NULL,
  shipping_cost REAL NOT NULL,
  shipping_method TEXT NOT NULL,
  final_total REAL NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(userId) REFERENCES users(id)
);
`);


const products = [
  { title:'PREORDINE GTA VI PS5', price:99.99, image:'images/gta6.jpg', category:'Gioco', description:'uscita 26 maggio 2026 (FORSE...)'},
  { title:'PlayStation 5 PRO', price:799.99, image:'images/ps5_pro.jpg', category:'Console', description:'Al suo cuore, la PS5 Pro integra una GPU di nuova generazione e una CPU ottimizzata per il gaming...'},
  { title:'PlayStation 5 Slim', price:499.99, image:'images/ps5_slim.jpg', category:'Console', description:'La PlayStation 5 Slim rappresenta un\'evoluzione del design...'},
  { title:'Starfield', price:39.99, image:'images/starfield.jpg', category:'Gioco', description:'descrizione...'},
  { title:'Grand theft auto V', price:25.99, image:'images/gta_ps5_v.jpg', category:'Gioco', description:'descrizione...'},
  { title:'Assassin\'s creed shadows', price:79.99, image:'images/ac_shadows.jpg', category:'Gioco', description:'descrizione...'},
  { title:'Forza Horizon 5', price:59.99, image:'images/forza5.jpg', category:'Gioco', description:'descrizione...'},
  { title:'Lettore DVD ps5', price:89.99, image:'images/lettore.jpg', category:'Accessorio', description:'descrizione...'},
  { title:'Asus ROG ally', price:799.99, image:'images/ally.jpg', category:'Console', description:'console con windows'},
  { title:'Xbox Series X', price:599.99, image:'images/xbox_s_x.jpg', category:'Console', description:'La console più veloce e potente di Microsoft...'},
  { title:'Nintendo Switch OLED', price:349.99, image:'images/nintendo_sw_oled.jpg', category:'Console', description:'La console ibrida di Nintendo con uno splendido schermo OLED...'},
  { title:'The Last of Us Part II', price:19.99, image:'images/tlou2.jpg', category:'Gioco', description:'Un\'avventura post-apocalittica...'},
  { title:'MAFIA the old country', price:59.99, image:'images/mafia.jpg', category:'Gioco', description:'descrizione...'},
  { title:'Controller Xbox Wireless', price:59.99, image:'images/controller_xbox.jpg', category:'Accessorio', description:'Controller ergonomico con un design moderno...'},
  { title:'DualSense Controller', price:69.99, image:'images/dualsense.jpg', category:'Accessorio', description:'Il controller PS5 che rivoluziona il gioco...'},
  { title:'The Legend of Zelda: Tears of the Kingdom', price:59.99, image:'images/zelda.jpg', category:'Gioco', description:'Il sequel di Breath of the Wild...'}
];

for (const p of products) {
  try {
    await db.run(
      'INSERT INTO products (title,price,image,category,description) VALUES (?,?,?,?,?)',
      [p.title, p.price, p.image, p.category, p.description]
    );
  } catch (e) {
  }
}

console.log('Database popolato');
db.close();
