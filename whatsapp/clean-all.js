// const fs = require('fs').promises;
// const path = require('path');
// const { initializeApp } = require('firebase/app');
// const { getFirestore, doc, deleteDoc, collection, getDocs } = require('firebase/firestore');
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
// // Collezione su Firebase
// const SESSION_COLLECTION = "whatsapp_sessions";
//
// /**
//  * Pulisce tutte le sessioni WhatsApp sia localmente che su Firebase
//  */
// async function cleanupEverything() {
//     try {
//         console.log('Iniziando la pulizia completa delle sessioni WhatsApp...');
//
//         // Cartelle da eliminare
//         const folders = [
//             path.join(__dirname, 'auth_info_baileys'),
//             path.join(__dirname, 'auth_info_baileys_'),
//             path.join(__dirname, 'auth_info_baileys_clean'),
//             path.join(__dirname, 'auth_info_fresh'),
//             path.join(__dirname, 'whatsapp-session')
//         ];
//
//         // Elimina tutte le cartelle locali
//         for (const folder of folders) {
//             try {
//                 await fs.rm(folder, { recursive: true, force: true });
//                 console.log(`Cartella ${folder} eliminata con successo`);
//             } catch (err) {
//                 if (err.code !== 'ENOENT') {
//                     console.error(`Errore durante eliminazione ${folder}:`, err);
//                 } else {
//                     console.log(`Cartella ${folder} non esistente, nulla da eliminare`);
//                 }
//             }
//         }
//
//         // Elimina tutti i documenti dalla collezione Firebase
//         try {
//             const querySnapshot = await getDocs(collection(db, SESSION_COLLECTION));
//             let count = 0;
//
//             for (const docSnapshot of querySnapshot.docs) {
//                 await deleteDoc(doc(db, SESSION_COLLECTION, docSnapshot.id));
//                 count++;
//             }
//
//             console.log(`${count} documenti eliminati da Firebase`);
//         } catch (err) {
//             console.error('Errore durante la pulizia di Firebase:', err);
//         }
//
//         console.log('Pulizia completa terminata con successo!');
//         return { success: true, message: 'Tutte le sessioni WhatsApp sono state pulite' };
//     } catch (error) {
//         console.error('Errore durante la pulizia completa:', error);
//         return { success: false, error: error.message };
//     }
// }
//
// // Esegui la pulizia e mostra i risultati
// cleanupEverything()
//     .then(result => console.log('Risultato:', result))
//     .catch(err => console.error('Errore fatale:', err));
