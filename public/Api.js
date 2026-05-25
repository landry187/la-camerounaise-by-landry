/* =====================================================
   api.js — La Camerounaise by Landry
   Connexion entre le site et le serveur Node.js local
===================================================== */

const API_URL = 'http://localhost:3000/api';

/* ── Envoyer une commande au serveur ── */
async function envoyerCommande(data) {
  try {
    const res = await fetch(`${API_URL}/commandes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    return await res.json();
  } catch(e) {
    console.error('Serveur non accessible:', e);
    return { ok: false, message: 'Serveur non accessible. Vérifiez que le serveur est démarré.' };
  }
}

/* ── Envoyer une réservation au serveur ── */
async function envoyerReservation(data) {
  try {
    const res = await fetch(`${API_URL}/reservations`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    return await res.json();
  } catch(e) {
    console.error('Serveur non accessible:', e);
    return { ok: false, message: 'Serveur non accessible. Vérifiez que le serveur est démarré.' };
  }
}

/* ── Envoyer un message contact au serveur ── */
async function envoyerMessage(data) {
  try {
    const res = await fetch(`${API_URL}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    return await res.json();
  } catch(e) {
    console.error('Serveur non accessible:', e);
    return { ok: false, message: 'Serveur non accessible. Vérifiez que le serveur est démarré.' };
  }
}