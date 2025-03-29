// const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
// const { initializeApp } = require('firebase/app');
// const { getFirestore, doc, deleteDoc, setDoc, collection, getDocs, addDoc } = require('firebase/firestore');
//
// const firebaseConfig = {
//     apiKey: "AIzaSyAmZKDMeORzZ87amzgkkCZSKWk-A1AV_rc",
//     authDomain: "guhjgjh7887hjujhk.firebaseapp.com",
//     projectId: "guhjgjh7887hjujhk",
//     storageBucket: "guhjgjh7887hjujhk.firebasestorage.app",
//     messagingSenderId: "808051673520",
//     appId: "1:808051673520:web:42f700daa624ebd9cc2e75"
// };
//
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
//
// // Usa una collezione semplice per tutto
// const SESSION_COLLECTION = "whatsapp_sessions";
//
// async function cleanupSessions() {
//     const fs = require('fs').promises;
//     const path = require('path');
//
//     console.log('Pulizia delle sessioni in corso...');
//
//     try {
//         // Elimina cartella auth_info_baileys se esiste
//         try {
//             await fs.rm(path.join(__dirname, 'auth_info_baileys'), { recursive: true, force: true });
//             console.log('Cartella auth_info_baileys eliminata con successo');
//         } catch (err) {
//             if (err.code !== 'ENOENT') console.error('Errore durante eliminazione auth_info_baileys:', err);
//         }
//
//         // Elimina cartella auth_info_baileys_ se esiste
//         try {
//             await fs.rm(path.join(__dirname, 'auth_info_baileys_'), { recursive: true, force: true });
//             console.log('Cartella auth_info_baileys_ eliminata con successo');
//         } catch (err) {
//             if (err.code !== 'ENOENT') console.error('Errore durante eliminazione auth_info_baileys_:', err);
//         }
//
//         // Pulisci i dati da Firebase se configurato
//         try {
//             const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//             let count = 0;
//
//             for (const doc of querySnapshot.docs) {
//                 await deleteDoc(doc.ref);
//                 count++;
//             }
//
//             console.log(`${count} documenti eliminati da Firebase`);
//         } catch (err) {
//             console.error('Errore durante la pulizia di Firebase:', err);
//         }
//
//         return { success: true, message: 'Pulizia delle sessioni completata' };
//     } catch (error) {
//         console.error('Errore durante la pulizia delle sessioni:', error);
//         return { success: false, error: error.message };
//     }
// }
//
// cleanupSessions()