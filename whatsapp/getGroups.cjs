// // Prima installa le dipendenze necessarie:
// // npm install @whiskeysockets/baileys qrcode-terminal
//
// const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
// const qrcode = require('qrcode-terminal');
// const fs = require('fs');
// const path = require('path');
//
// // Cartella per salvare i dati di autenticazione
// const SESSION_DIR = path.join(__dirname, 'whatsapp-session');
//
// // Funzione principale
// async function connectToWhatsApp() {
//     // Assicurati che la cartella di sessione esista
//     if (!fs.existsSync(SESSION_DIR)) {
//         fs.mkdirSync(SESSION_DIR, { recursive: true });
//     }
//
//     // Utilizzare auth multi-file per gestire le credenziali
//     const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
//
//     // Creare un'istanza del client WhatsApp
//     const sock = makeWASocket({
//         auth: state,
//         printQRInTerminal: true, // Mostra il QR code nel terminale
//     });
//
//     // Salva le credenziali quando ci sono cambiamenti
//     sock.ev.on('creds.update', saveCreds);
//
//     // Gestire gli eventi di connessione
//     sock.ev.on('connection.update', (update) => {
//         const { connection, lastDisconnect } = update;
//
//         if (connection === 'close') {
//             const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
//
//             console.log('Connessione chiusa a causa di:', lastDisconnect.error);
//
//             if (shouldReconnect) {
//                 connectToWhatsApp();
//             }
//         } else if (connection === 'open') {
//             console.log('Connessione a WhatsApp aperta!');
//
//             // Quando la connessione è aperta, recuperiamo la lista dei gruppi
//             fetchGroups();
//         }
//     });
//
//     // Funzione per recuperare la lista dei gruppi
//     async function fetchGroups() {
//         try {
//             // Otteniamo la lista di tutte le chat
//             const chats = await sock.groupFetchAllParticipating();
//
//             console.log('Lista di tutti i gruppi WhatsApp:');
//             console.log('-------------------------------');
//
//             // Iteriamo su tutte le chat di gruppo
//             Object.entries(chats).forEach(([id, chat]) => {
//                 console.log(`Nome gruppo: ${chat.subject}`);
//                 console.log(`ID gruppo: ${id}`);
//                 console.log(`Numero di partecipanti: ${chat.participants.length}`);
//                 console.log('-------------------------------');
//             });
//
//             console.log('Usa uno di questi ID per inviare messaggi al gruppo desiderato.');
//
//         } catch (error) {
//             console.error('Errore nel recupero dei gruppi:', error);
//         }
//     }
// }
//
// // Avvia il processo di connessione
// connectToWhatsApp();