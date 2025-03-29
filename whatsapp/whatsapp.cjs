// const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } = require('@whiskeysockets/baileys');
// const fs = require('fs').promises;
// const path = require('path');
// const qrcode = require('qrcode-terminal');
// const { initializeApp } = require('firebase/app');
// const { getFirestore, doc, getDoc, updateDoc, setDoc, collection, getDocs, addDoc } = require('firebase/firestore');
// const {v2: cloudinary} = require("cloudinary");
// const axios = require("axios");
//
// cloudinary.config({
//     cloud_name: 'dfgvzbic7',
//     api_key: '878358465394274',
//     api_secret: 'WgPLBtDKA3J3BfzQ55GInvluzCM'
// });
//
// // Configurazione Firebase
// const firebaseConfig = {
//     apiKey: "AIzaSyAmZKDMeORzZ87amzgkkCZSKWk-A1AV_rc",
//     authDomain: "guhjgjh7887hjujhk.firebaseapp.com",
//     projectId: "guhjgjh7887hjujhk",
//     storageBucket: "guhjgjh7887hjujhk.firebasestorage.app",
//     messagingSenderId: "808051673520",
//     appId: "1:808051673520:web:42f700daa624ebd9cc2e75"
// };
//
// // Inizializza Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
//
// // Usa una collezione semplice per tutto
// const SESSION_COLLECTION = "whatsapp_sessions";
//
// /**
//  * Funzioni di utilità per convertire Buffer in oggetti Firestore-compatibili e viceversa
//  */
// const bufferUtils = {
//     // Converte i Buffer in oggetti serializzabili
//     serializeBuffers: (obj) => {
//         // Se obj è già null o non è un oggetto, ritorna così com'è
//         if (obj === null || typeof obj !== 'object') {
//             return obj;
//         }
//
//         // Se obj è un Buffer, convertilo in un oggetto speciale
//         if (Buffer.isBuffer(obj)) {
//             return {
//                 type: 'Buffer',
//                 data: Array.from(obj)
//             };
//         }
//
//         // Se obj è un array, processa ogni elemento
//         if (Array.isArray(obj)) {
//             return obj.map(bufferUtils.serializeBuffers);
//         }
//
//         // Altrimenti, processa ogni proprietà dell'oggetto
//         const result = {};
//         for (const key in obj) {
//             if (Object.prototype.hasOwnProperty.call(obj, key)) {
//                 result[key] = bufferUtils.serializeBuffers(obj[key]);
//             }
//         }
//
//         return result;
//     },
//
//     // Riconverte gli oggetti serializzati in Buffer
//     deserializeBuffers: (obj) => {
//         // Se obj è già null o non è un oggetto, ritorna così com'è
//         if (obj === null || typeof obj !== 'object') {
//             return obj;
//         }
//
//         // Se obj ha la struttura {type: 'Buffer', data: [...]} convertilo in un Buffer
//         if (obj && obj.type === 'Buffer' && obj.data) {
//             // Gestisci sia array di numeri che stringhe Base64
//             if (Array.isArray(obj.data)) {
//                 return Buffer.from(obj.data);
//             } else if (typeof obj.data === 'string') {
//                 // Se i dati sono una stringa, assumiamo che sia Base64
//                 return Buffer.from(obj.data, 'base64');
//             }
//             // Fallback: ritorna il buffer così com'è
//             return obj;
//         }
//
//         // Se obj è un array, processa ogni elemento
//         if (Array.isArray(obj)) {
//             return obj.map(bufferUtils.deserializeBuffers);
//         }
//
//         // Altrimenti, processa ogni proprietà dell'oggetto
//         const result = {};
//         for (const key in obj) {
//             if (Object.prototype.hasOwnProperty.call(obj, key)) {
//                 result[key] = bufferUtils.deserializeBuffers(obj[key]);
//             }
//         }
//
//         return result;
//     }
// };
//
// /**
//  * Salva le credenziali su Firebase
//  * @param {Object} creds - Le credenziali da salvare
//  */
// async function saveCredsToFirebase(creds) {
//     try {
//         // Serializza i Buffer nelle credenziali
//         const serializedCreds = bufferUtils.serializeBuffers(creds);
//
//         // Cerca prima il documento esistente
//         const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//         let credsDocId = null;
//
//         for (const docSnapshot of querySnapshot.docs) {
//             const data = docSnapshot.data();
//             if (data.type === 'creds') {
//                 credsDocId = docSnapshot.id;
//                 break;
//             }
//         }
//
//         if (credsDocId) {
//             // Aggiorna documento esistente
//             if (Object.keys(serializedCreds).length >= 18) {
//                 await setDoc(doc(db, SESSION_COLLECTION, credsDocId), {
//                     type: 'creds',
//                     value: serializedCreds,
//                     updatedAt: new Date(),
//                     source: 'whatsapp-fixed'
//                 }, {merge: true});
//             }
//
//             // console.log(`Credenziali aggiornate su Firebase ${credsDocId}`);
//         } else {
//             // Crea nuovo documento
//             await addDoc(collection(db, SESSION_COLLECTION), {
//                 type: 'creds',
//                 value: serializedCreds,
//                 createdAt: new Date(),
//                 source: 'whatsapp-fixed'
//             });
//             // console.log('Credenziali create su Firebase');
//         }
//
//         return true;
//     } catch (error) {
//         console.error('Errore nel salvare le credenziali su Firebase:', error);
//         return false;
//     }
// }
//
// /**
//  * Salva una chiave su Firebase
//  * @param {string} keyId - L'ID della chiave
//  * @param {Object} value - Il valore della chiave
//  */
// async function saveKeyToFirebase(keyId, value) {
//     try {
//         // Serializza i Buffer nel valore della chiave
//         const serializedValue = bufferUtils.serializeBuffers(value);
//
//         // Cerca prima il documento esistente
//         const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//         let keyDocId = null;
//
//         for (const docSnapshot of querySnapshot.docs) {
//             const data = docSnapshot.data();
//             if (data.type === 'key' && data.keyId === keyId) {
//                 keyDocId = docSnapshot.id;
//                 break;
//             }
//         }
//
//         if (keyDocId) {
//             // Aggiorna documento esistente
//             await updateDoc(doc(db, SESSION_COLLECTION, keyDocId), {
//                 type: 'key',
//                 keyId: keyId,
//                 value: serializedValue,
//                 updatedAt: new Date(),
//                 source: 'whatsapp-fixed'
//             });
//         } else {
//             // Crea nuovo documento
//             await addDoc(collection(db, SESSION_COLLECTION), {
//                 type: 'key',
//                 keyId: keyId,
//                 value: serializedValue,
//                 createdAt: new Date(),
//                 source: 'whatsapp-fixed'
//             });
//         }
//
//         //console.log(`Chiave ${keyId} salvata`);
//         return true;
//     } catch (error) {
//         console.error(`Errore nel salvataggio della chiave ${keyId}:`, error);
//         return false;
//     }
// }
//
// /**
//  * Sincronizza tutte le chiavi con Firebase
//  * @param {string} authFolder - Percorso alla cartella di autenticazione
//  */
// async function syncKeysToFirebase(authFolder) {
//     try {
//         if (require.main !== module) {
//             return
//         }
//
//         const files = await fs.readdir(authFolder);
//         // console.log(`Trovati ${files.length} file nella cartella auth`);
//
//         // Filtra solo i file JSON che non sono creds.json
//         const keyFiles = files.filter(file =>
//             file.endsWith('.json') && file !== 'creds.json'
//         );
//
//         // console.log(`Sincronizzazione di ${keyFiles.length} chiavi su Firebase...`);
//
//         for (const keyFile of keyFiles) {
//             const keyId = keyFile.replace('.json', '');
//
//             try {
//                 const keyPath = path.join(authFolder, keyFile);
//                 const keyContent = await fs.readFile(keyPath, 'utf8');
//                 const keyData = JSON.parse(keyContent);
//
//                 await saveKeyToFirebase(keyId, keyData);
//                 //console.log(`Chiave ${keyId} sincronizzata con Firebase`);
//             } catch (error) {
//                 console.error(`Errore nella sincronizzazione della chiave ${keyFile}:`, error);
//             }
//         }
//
//         // console.log('Sincronizzazione delle chiavi completata');
//         return true;
//     } catch (error) {
//         console.error('Errore nella sincronizzazione delle chiavi:', error);
//         return false;
//     }
// }
//
// /**
//  * Testa la connessione a Firebase
//  * @returns {Promise<boolean>} - true se la connessione è riuscita
//  */
// async function testFirebaseConnection() {
//     try {
//         // Tenta di aggiungere un documento semplice
//         const docRef = await addDoc(collection(db, SESSION_COLLECTION), {
//             test: true,
//             timestamp: new Date()
//         });
//
//         // console.log("Test di connessione a Firebase completato con successo, documento creato:", docRef.id);
//         return true;
//     } catch (error) {
//         console.error("Errore nella connessione a Firebase:", error);
//         return false;
//     }
// }
//
// /**
//  * Implementazione di auth state che recupera lo stato da Firebase
//  * @returns {Promise<{state: Object, saveCreds: Function}>}
//  */
// async function useFirebaseAuthState() {
//     // Funzione per recuperare le credenziali
//     const getCreds = async () => {
//         try {
//             // Ottieni il documento delle credenziali
//             const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//
//             for (const docSnapshot of querySnapshot.docs) {
//                 const data = docSnapshot.data();
//                 if (data.type === 'creds') {
//                     // console.log('Credenziali recuperate da Firebase');
//
//                     // Deserializza i Buffer dalle credenziali
//                     const deserializedCreds = bufferUtils.deserializeBuffers(data.value || {});
//                     return deserializedCreds;
//                 }
//             }
//
//             // console.log('Nessuna credenziale trovata su Firebase');
//             return {};
//         } catch (error) {
//             console.error('Errore nel recupero delle credenziali da Firebase:', error);
//             return {};
//         }
//     };
//
//     // Funzione per salvare le credenziali
//     const saveCreds = async (creds) => {
//         try {
//             // Serializza i Buffer nelle credenziali
//             const serializedCreds = bufferUtils.serializeBuffers(creds);
//
//             // Cerca prima il documento esistente
//             const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//             let credsDocId = null;
//
//             for (const docSnapshot of querySnapshot.docs) {
//                 const data = docSnapshot.data();
//                 if (data.type === 'creds') {
//                     credsDocId = docSnapshot.id;
//                     break;
//                 }
//             }
//
//             if (credsDocId) {
//                 // Aggiorna documento esistente
//                 await setDoc(doc(db, SESSION_COLLECTION, credsDocId), {
//                     type: 'creds',
//                     value: serializedCreds,
//                     updatedAt: new Date(),
//                     source: 'whatsapp-fixed'
//                 });
//                 console.log('Credenziali aggiornate su Firebase');
//             } else {
//                 // Crea nuovo documento
//                 await addDoc(collection(db, SESSION_COLLECTION), {
//                     type: 'creds',
//                     value: serializedCreds,
//                     createdAt: new Date(),
//                     source: 'whatsapp-fixed'
//                 });
//                 // console.log('Credenziali create su Firebase');
//             }
//         } catch (error) {
//             console.error('Errore nel salvataggio delle credenziali su Firebase:', error);
//         }
//     };
//
//     // Funzione per recuperare chiavi
//     const getKey = async (type, ids) => {
//         try {
//             const keyId = `${type}-${ids.join('_')}`;
//
//             // Cerca la chiave nella collezione
//             const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//
//             for (const docSnapshot of querySnapshot.docs) {
//                 const data = docSnapshot.data();
//                 if (data.type === 'key' && data.keyId === keyId) {
//                     // console.log(`Chiave ${keyId} recuperata da Firebase`);
//
//                     // Deserializza i Buffer dalla chiave
//                     const deserializedValue = bufferUtils.deserializeBuffers(data.value);
//                     return { [keyId]: deserializedValue };
//                 }
//             }
//
//             // console.log(`Chiave ${keyId} non trovata su Firebase`);
//             return {};
//         } catch (error) {
//             console.error(`Errore nel recupero della chiave ${keyId} da Firebase:`, error);
//             return {};
//         }
//     };
//
//     // Funzione per salvare chiavi
//     const setKey = async (key, value) => {
//         try {
//             if (require.main !== module) {
//                 return
//             }
//
//             // Serializza i Buffer nel valore della chiave
//             const serializedValue = bufferUtils.serializeBuffers(value);
//
//             // Cerca prima il documento esistente
//             const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//             let keyDocId = null;
//
//             for (const docSnapshot of querySnapshot.docs) {
//                 const data = docSnapshot.data();
//                 if (data.type === 'key' && data.keyId === key) {
//                     keyDocId = docSnapshot.id;
//                     break;
//                 }
//             }
//
//             if (keyDocId) {
//                 // Aggiorna documento esistente
//                 await setDoc(doc(db, SESSION_COLLECTION, keyDocId), {
//                     type: 'key',
//                     keyId: key,
//                     value: serializedValue,
//                     updatedAt: new Date(),
//                     source: 'whatsapp-fixed'
//                 });
//             } else {
//                 // Crea nuovo documento
//                 await addDoc(collection(db, SESSION_COLLECTION), {
//                     type: 'key',
//                     keyId: key,
//                     value: serializedValue,
//                     createdAt: new Date(),
//                     source: 'whatsapp-fixed'
//                 });
//             }
//
//             //console.log(`Chiave ${key} salvata su Firebase`);
//         } catch (error) {
//             console.error(`Errore nel salvataggio della chiave ${key} su Firebase:`, error);
//         }
//     };
//
//     // Ottieni le credenziali
//     const creds = await getCreds();
//
//     return {
//         state: {
//             creds,
//             keys: {
//                 get: getKey,
//                 set: setKey
//             }
//         },
//         saveCreds
//     };
// }
//
// async function connectToWhatsApp() {
//     // Restituisce una Promise che si risolverà solo quando sendMessage avrà completato l'esecuzione
//     return new Promise(async (resolve, reject) => {
//         // Cartella per i dati di autenticazione
//         const AUTH_FOLDER = path.join(__dirname, 'auth_info_fresh');
//
//         try {
//             // Verifica la connessione Firebase
//             const isFirebaseConnected = await testFirebaseConnection();
//
//             // Assicurati che la cartella esista
//             try {
//                 await fs.mkdir(AUTH_FOLDER, { recursive: true });
//             } catch (err) {
//                 if (err.code !== 'EEXIST') {
//                     //console.error('Errore nella creazione della cartella:', err);
//                 }
//             }
//
//             // Ottieni la versione più recente di Baileys
//             const { version } = await fetchLatestBaileysVersion();
//             // console.log(`Usando la versione Baileys: ${version.join('.')}`);
//
//             // Ottieni lo stato di autenticazione
//             let state, saveCreds;
//
//             // Prova prima a recuperare lo stato da Firebase
//             if (isFirebaseConnected) {
//                 try {
//                     // useFirebaseAuthState
//                     // useMultiFileAuthState
//
//                     // console.log('Tentativo di recupero stato da Firebase...');
//                     const firebaseAuth = await useFirebaseAuthState("auth_info_fresh");
//
//                     // Verifica se lo stato di Firebase contiene le credenziali
//                     if (firebaseAuth.state.creds && Object.keys(firebaseAuth.state.creds).length > 0) {
//                         // console.log('Stato recuperato con successo da Firebase');
//                         state = firebaseAuth.state;
//                         saveCreds = firebaseAuth.saveCreds;
//                     } else {
//                         // console.log('Stato Firebase vuoto o incompleto, usando file system locale');
//                         const fsAuth = await useMultiFileAuthState(AUTH_FOLDER);
//                         state = fsAuth.state;
//                         saveCreds = fsAuth.saveCreds;
//                     }
//                 } catch (error) {
//                     console.error('Errore nel recupero dello stato da Firebase:', error);
//                     // console.log('Fallback a file system locale');
//                     const fsAuth = await useMultiFileAuthState(AUTH_FOLDER);
//                     state = fsAuth.state;
//                     saveCreds = fsAuth.saveCreds;
//                 }
//             } else {
//                 // console.log('Firebase non disponibile, usando file system locale');
//                 const fsAuth = await useMultiFileAuthState(AUTH_FOLDER);
//                 state = fsAuth.state;
//                 saveCreds = fsAuth.saveCreds;
//             }
//
//             // Estendi la funzione saveCreds per salvare anche su Firebase
//             const originalSaveCreds = saveCreds;
//             const enhancedSaveCreds = async (creds) => {
//                 // Prima salva localmente
//                 await originalSaveCreds(creds);
//
//                 // Poi salva su Firebase se connesso
//                 if (isFirebaseConnected) {
//                     try {
//                         await saveCredsToFirebase(creds);
//                         // Sincronizza anche le chiavi dopo aver salvato le credenziali
//                         await syncKeysToFirebase(AUTH_FOLDER);
//                     } catch (error) {
//                         console.error('Errore nel salvataggio su Firebase:', error);
//                     }
//                 }
//             };
//
//             // Crea il socket con impostazioni più compatibili
//             const sock = makeWASocket({
//                 version,
//                 auth: state,
//                 printQRInTerminal: true,
//                 browser: ['Ubuntu', 'Chrome', '20.04'],
//                 connectTimeoutMs: 60000,
//                 markOnlineOnConnect: false,
//                 defaultQueryTimeoutMs: 60000,
//                 syncFullHistory: false, // Importante per evitare timeout
//                 retryRequestDelayMs: 1000
//             });
//
//             // Gestisci il salvataggio delle credenziali con la funzione estesa
//             sock.ev.on('creds.update', enhancedSaveCreds);
//
//             // Gestisci gli aggiornamenti di connessione
//             sock.ev.on('connection.update', (update) => {
//                 const { connection, lastDisconnect, qr } = update;
//                // console.log("update", update)
//
//                 if (qr) {
//                     // Visualizza il QR code nel terminale
//                     // console.log('\nScansiona questo QR code con WhatsApp:');
//                     try {
//                         qrcode.generate(qr, { small: true });
//                     } catch (err) {
//                         // console.log('QR code generato, controlla il terminale');
//                     }
//                 }
//
//                 if (connection === 'close') {
//                     const shouldReconnect =
//                         lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
//
//                     // console.log('Connessione chiusa a causa di:',lastDisconnect?.error?.message || 'Motivo sconosciuto');
//
//                     // Risolvi la promise con errore in caso di chiusura
//                     reject(new Error('Connessione chiusa: ' + (lastDisconnect?.error?.message || 'Motivo sconosciuto')));
//
//                     // Riconnetti solo se non è stato effettuato il logout
//                     // if (shouldReconnect) {
//                     //     console.log('Riconnessione in corso...');
//                     //     setTimeout(connectToWhatsApp, 5000);
//                     // } else {
//                     //     console.log('Disconnesso, riavvia il processo per riconnetterti');
//                     // }
//                 } else if (connection === 'open') {
//                     // console.log('Connessione WhatsApp aperta!');
//                     // console.log('ID del dispositivo:', sock.user.id);
//
//                     resolve(sock)
//
//                     if (isFirebaseConnected) {
//                         // Salva le credenziali
//                         if (require.main === module) {
//                             // Sincronizza lo stato intero su Firebase
//                             // console.log('Sincronizzazione dello stato su Firebase...');
//
//                             saveCredsToFirebase(state.creds).then(() => {
//                                 syncKeysToFirebase(AUTH_FOLDER);
//                             }).catch(error => {
//                                 console.error('Errore nella sincronizzazione iniziale:', error);
//                             });
//                         }
//                     }
//                 }
//             });
//         } catch (error) {
//             console.error('Errore nella connessione:', error);
//             reject(error);
//         }
//     });
// }
//
// async function sendMessage({sock, text}) {
//     try {
//         // Recupera i gruppi disponibili
//         const chats = await sock.groupFetchAllParticipating();
//         //console.log('Gruppi disponibili:');
//         //
//         // Object.entries(chats).forEach(([id, chat]) => {
//         //     console.log(`- ${chat.subject} (${id})`);
//         // });
//
//         // Scegli un gruppo a cui inviare (sostituisci con l'ID corretto)
//         const groupId = '120363418908554827@g.us';
//
//         // Verifica che il gruppo esista
//         if (!chats[groupId]) {
//             console.log('Gruppo non trovato. Usa uno di questi ID:');
//             Object.entries(chats).forEach(([id, chat]) => {
//                 console.log(`- ${id} (${chat.subject})`);
//             });
//             return;
//         }
//
//         // console.log(`Invio messaggio di test al gruppo ${chats[groupId].subject}...`);
//
//         // Invia un messaggio di test
//         const result = await sock.sendMessage(groupId, { text });
//
//         // console.log('Messaggio inviato con successo:', result);
//     } catch (error) {
//         console.error('Errore nell\'invio del messaggio:', error);
//     }
// }
//
// // Esporta le funzioni e le utility
// module.exports = {
//     connectToWhatsApp
// };
//
// async function generaTabellaSVG(saldi) {
//     // Dimensioni e configurazione
//     const larghezzaCella = 120;
//     const altezzaCella = 40;
//     const larghezzaTotale = larghezzaCella * Object.keys(saldi).length;
//     const altezzaTotale = altezzaCella * 2;
//
//     // Inizio SVG
//     let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${larghezzaTotale}" height="${altezzaTotale}" viewBox="0 0 ${larghezzaTotale} ${altezzaTotale}">`;
//
//     // Aggiungi stile
//     svg += `
//           <style>
//             .header { fill: #f0f0f0; }
//             .positive { fill: #90ee90; }
//             .negative { fill: #ffb6c1; }
//             .cell { stroke: #000; stroke-width: 1; }
//             .text { font-family: Arial; font-size: 14px; text-anchor: middle; }
//             .amount { font-family: Arial; font-size: 16px; font-weight: bold; text-anchor: middle; }
//           </style>`;
//
//     // Disegna le celle intestazione
//     let x = 0;
//     Object.keys(saldi).forEach((nome, index) => {
//         svg += `<rect class="header cell" x="${x}" y="0" width="${larghezzaCella}" height="${altezzaCella}" />`;
//         svg += `<text class="text" x="${x + larghezzaCella/2}" y="${altezzaCella/2 + 5}">${nome}</text>`;
//         x += larghezzaCella;
//     });
//
//     // Disegna le celle con i valori
//     x = 0;
//     Object.entries(saldi).forEach(([nome, dati]) => {
//         const credito = typeof dati === 'number' ? dati : dati.credito || 0;
//         const cellClass = credito >= 0 ? "positive" : "negative";
//         const textColor = credito >= 0 ? "#000000" : "#000000";
//
//         svg += `<rect class="${cellClass} cell" x="${x}" y="${altezzaCella}" width="${larghezzaCella}" height="${altezzaCella}" />`;
//         svg += `<text class="amount" x="${x + larghezzaCella/2}" y="${altezzaCella + altezzaCella/2 + 5}" fill="${textColor}">${credito.toFixed(2)}</text>`;
//         x += larghezzaCella;
//     });
//
//     // Chiudi SVG
//     svg += '</svg>';
//
//     return await convertSvgBufferToPngBuffer(Buffer.from(svg));
// }
//
// async function convertSvgBufferToPngBuffer(svgBuffer) {
//     try {
//         cloudinary.config({
//             cloud_name: 'dfgvzbic7',
//             api_key: '878358465394274',
//             api_secret: 'WgPLBtDKA3J3BfzQ55GInvluzCM'
//         });
//
//         const base64Svg = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;
//         const uploadResult = await cloudinary.uploader.upload(base64Svg, { format: 'png' });
//         return uploadResult.secure_url;
//     } catch (error) {
//         console.error('Errore durante la conversione:', error.message);
//         throw error;
//     }
// }
//
// // Se il file viene eseguito direttamente, connettiti a WhatsApp
// if (require.main === module) {
//     main().catch(console.error);
// }
//
// async function main() {
//     const sock = await connectToWhatsApp()
//     const imageUrl = await generaTabellaSVG({ Luca: 10, Marco: 20 })
//     await sendImage({ sock, imageUrl });
// }
//
// async function sendImage({sock, imageUrl}){
//     const GROUP_ID = '120363418908554827@g.us';
//     const data = new Date().toLocaleDateString();
//     const result = await sock.sendMessage(GROUP_ID, {
//         image: { url: imageUrl },
//         caption: `*REPORT SALDI CONDOMINIO - ${data}*`,
//         mimetype: 'image/png'
//     });
//
//     //// console.log('Messaggio inviato con successo:', result);
// }
