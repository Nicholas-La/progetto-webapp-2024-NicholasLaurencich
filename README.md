-----------------------------------------------------
Progetto WebApp
Sito: ecommerce di videogiochi, console e accessori;
Proprietario: Nicholas Laurencich, 163040;
-----------------------------------------------------
Istruzioni per installazione e esecuzione (versione windows)
-verificare di avere node.js installato sulla macchina, altrimenti installalarlo dal sito web di node.js
-aprire il terminale (cmd)
-aprire nel terminale la cartella del progetto
-eseguire il comando: npm install
-potrebbe dare errore che non trova node (verificare variabili di ambiente, problema riscontrato su windows 11, su win10 nessun problema)
-se tutto è andato bene il comando npm -v restituisce la versione di npm
-aprire nel terminale la cartella backend
-eseguire il comando: npm run seed ->popola il database
-eseguire il comando: npm run dev -> accende il server
-sul browser apripre: http://localhost:3000

-----------------------------------------------------
Descrizione delle route principali
/index pagina principale con tutti i prodotti
/about pagina con tutte le informazioni per i clienti
/privacy informativa privacy 
/registration permette di effettuare la registrazione al sito
/login permette di autenticarsi
/wishlist si visualizzano degli articoli (come cookie nella cache del browser) salvati come preferiti
/cart si visualizzano gli articoli aggiunti al carrello e permette di procedere con l'ordine
/checkout pagina del checkout che permette di scegliere la carta di pagamento e il metodo di spedizione una volta effettuato il login
/profile permette di modificare le infromazioni personali e aggiungere carte una volta effettuato il login
/order permette di visualizzare i propri ordini effettuati una volta effettuato il login 
/thankyou ringraziamneto per l'ordine
-----------------------------------------------------
Esempi di richieste e risposte
GET /images/xbox_s_x.jpg 304 14.689 ms - - preleva immagine per mostrarla
GET /about.html 304 1.138 ms - - richiede la pagina about
GET /api/products/8 200 2.768 ms - 132 inserisce oggetto nel carrello
GET /api/me 401 1.487 ms - 31 utente prova a effettuare l'ordine senza login
POST /api/login 401 208.582 ms - 34 inserisce password errata
POST /api/login 200 205.787 ms - 100 login effettuato con successo
DELETE /api/cards/2 204 11.890 ms - - chiedo di eliminare una carta salvata
GET /api/cards 200 3.986 ms - 77 risposta per corretta eliminazione
PUT /api/me 200 9.532 ms - 201 cambia il nome in uno con formato corretto
-----------------------------------------------------