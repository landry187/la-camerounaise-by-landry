/* =====================================================
   server.js — La Camerounaise by Landry
   Version MongoDB Atlas + Render.com
===================================================== */

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path       = require('path');

const app = express();

/* ── Config ── */
const PORT       = process.env.PORT || 3000;
const MONGO_URI  = process.env.MONGO_URI  || 'mongodb+srv://landry:landry237@cluster0.trqsjjg.mongodb.net/';
const EMAIL_USER = process.env.EMAIL_USER || 'kamdemlandrysorel@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'hdlkjeqbvtpvkcqu';
const RESTAURANT = 'La Camerounaise by Landry';

/* ── Middleware ── */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* ── MongoDB ── */
const client = new MongoClient(MONGO_URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('lacamerounaise');
    console.log('✅ MongoDB connecté !');
  } catch(err) {
    console.error('❌ MongoDB erreur:', err.message);
  }
}

/* ── Collections ── */
const col = (name) => db.collection(name);

/* ── Utilitaires ── */
function genererID(prefix) {
  const d = new Date();
  const stamp = d.getFullYear().toString().slice(2) +
    String(d.getMonth()+1).padStart(2,'0') +
    String(d.getDate()).padStart(2,'0') +
    String(d.getHours()).padStart(2,'0') +
    String(d.getMinutes()).padStart(2,'0');
  return `${prefix}-${stamp}-${Math.floor(Math.random()*1000)}`;
}

function dateNow() {
  return new Date().toLocaleString('fr-FR', {
    day:'2-digit', month:'long', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });
}

/* ── Email ── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

async function envoyerEmail(sujet, corps) {
  try {
    await transporter.sendMail({
      from: `"${RESTAURANT}" <${EMAIL_USER}>`,
      to:   EMAIL_USER,
      subject: sujet,
      html: corps
    });
    console.log(`📧 Email envoyé : ${sujet}`);
  } catch(err) {
    console.error(`❌ Email non envoyé : ${err.message}`);
  }
}

/* =====================================================
   ROUTES — COMMANDES
===================================================== */
app.post('/api/commandes', async (req, res) => {
  try {
    const { plats, total, mode, adresse, paiement } = req.body;
    if (!plats || plats.length === 0)
      return res.status(400).json({ ok:false, message:'Panier vide' });

    const commande = {
      id: genererID('CMD'), date: dateNow(),
      plats, total, mode,
      adresse: mode === 'livraison' ? adresse : 'Sur place',
      paiement, statut: 'Reçue'
    };

    await col('commandes').insertOne(commande);
    console.log(`✅ Commande : ${commande.id}`);

    const platsHtml = plats.map(p => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${p.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${p.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;color:#e8336d;font-weight:700;">${(p.price*p.qty).toLocaleString('fr-FR')} FCFA</td>
      </tr>`).join('');

    await envoyerEmail(`🛵 Nouvelle commande ${commande.id}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#e8336d;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">🍲 Nouvelle Commande !</h2>
          <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">${commande.id}</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;">
          <p><strong>📅 Date :</strong> ${commande.date}</p>
          <p><strong>🚚 Mode :</strong> ${commande.mode}</p>
          ${commande.adresse !== 'Sur place' ? `<p><strong>📍 Adresse :</strong> ${commande.adresse}</p>` : ''}
          <p><strong>💳 Paiement :</strong> ${commande.paiement}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr style="background:#f5f5f5;">
              <th style="padding:8px;text-align:left;">Plat</th>
              <th style="padding:8px;">Qté</th>
              <th style="padding:8px;text-align:right;">Prix</th>
            </tr>
            ${platsHtml}
          </table>
          <div style="margin-top:16px;padding:12px;background:#fff0f5;border-radius:8px;text-align:right;">
            <strong style="font-size:1.2rem;color:#e8336d;">Total : ${total}</strong>
          </div>
        </div>
      </div>`
    );

    res.json({ ok:true, id:commande.id, message:`Commande ${commande.id} confirmée !` });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, message:'Erreur serveur' });
  }
});

app.get('/api/commandes', async (req, res) => {
  const data = await col('commandes').find().sort({_id:-1}).toArray();
  res.json(data);
});

/* =====================================================
   ROUTES — RÉSERVATIONS
===================================================== */
app.post('/api/reservations', async (req, res) => {
  try {
    const { nom, telephone, date, heure, table, plats, total, acompte, paiement } = req.body;
    if (!nom || !table)
      return res.status(400).json({ ok:false, message:'Données incomplètes' });

    const reservation = {
      id: genererID('RES'), dateCreation: dateNow(),
      nom, telephone, date, heure, table,
      plats: plats || [], total: total || '0 FCFA',
      acompte: acompte || '0 FCFA', paiement, statut: 'Confirmée'
    };

    await col('reservations').insertOne(reservation);
    console.log(`✅ Réservation : ${reservation.id}`);

    await envoyerEmail(`📅 Nouvelle réservation ${reservation.id} — ${nom}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#e8336d;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">📅 Nouvelle Réservation !</h2>
          <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;">${reservation.id}</p>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;">
          <p><strong>👤 Nom :</strong> ${nom}</p>
          <p><strong>📞 Téléphone :</strong> ${telephone || 'Non renseigné'}</p>
          <p><strong>📅 Date :</strong> ${date} à ${heure}</p>
          <p><strong>🪑 Table :</strong> ${table}</p>
          <p><strong>💰 Total :</strong> ${total}</p>
          <p><strong>💳 Acompte :</strong> ${acompte}</p>
          <p><strong>💳 Paiement :</strong> ${paiement || 'Non renseigné'}</p>
        </div>
      </div>`
    );

    res.json({ ok:true, id:reservation.id, message:`Réservation ${reservation.id} confirmée !` });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, message:'Erreur serveur' });
  }
});

app.get('/api/reservations', async (req, res) => {
  const data = await col('reservations').find().sort({_id:-1}).toArray();
  res.json(data);
});

/* =====================================================
   ROUTES — MESSAGES
===================================================== */
app.post('/api/messages', async (req, res) => {
  try {
    const { from_name, from_email, subject, message } = req.body;
    if (!from_name || !from_email || !message)
      return res.status(400).json({ ok:false, message:'Champs requis manquants' });

    const msg = {
      id: genererID('MSG'), date: dateNow(),
      nom: from_name, email: from_email,
      sujet: subject || 'Sans sujet', message, lu: false
    };

    await col('messages').insertOne(msg);
    console.log(`✅ Message de : ${from_name}`);

    await envoyerEmail(`✉️ Nouveau message de ${from_name}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#e8336d;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">✉️ Nouveau Message !</h2>
        </div>
        <div style="padding:24px;background:#fff;border:1px solid #eee;">
          <p><strong>👤 Nom :</strong> ${from_name}</p>
          <p><strong>📧 Email :</strong> <a href="mailto:${from_email}">${from_email}</a></p>
          <p><strong>📌 Sujet :</strong> ${subject || 'Sans sujet'}</p>
          <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-left:4px solid #e8336d;border-radius:4px;">
            <p style="margin:0;line-height:1.7;">${message.replace(/\n/g,'<br>')}</p>
          </div>
          <div style="margin-top:20px;">
            <a href="mailto:${from_email}?subject=Re: ${subject}"
              style="background:#e8336d;color:white;padding:12px 24px;border-radius:25px;text-decoration:none;font-weight:700;">
              ↩️ Répondre à ${from_name}
            </a>
          </div>
        </div>
      </div>`
    );

    res.json({ ok:true, message:'Message envoyé avec succès !' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, message:'Erreur serveur' });
  }
});

app.get('/api/messages', async (req, res) => {
  const data = await col('messages').find().sort({_id:-1}).toArray();
  res.json(data);
});

app.patch('/api/messages/:id/lu', async (req, res) => {
  await col('messages').updateOne({ id: req.params.id }, { $set: { lu: true } });
  res.json({ ok:true });
});

/* =====================================================
   STATS
===================================================== */
app.get('/api/stats', async (req, res) => {
  const [commandes, reservations, messages] = await Promise.all([
    col('commandes').find().sort({_id:-1}).toArray(),
    col('reservations').find().sort({_id:-1}).toArray(),
    col('messages').find().sort({_id:-1}).toArray()
  ]);

  const chiffreAffaires = commandes.reduce((t, c) => {
    return t + (parseInt((c.total||'0').replace(/[^0-9]/g,'')) || 0);
  }, 0);

  res.json({
    commandes: commandes.length,
    reservations: reservations.length,
    messages: messages.length,
    messagesNonLus: messages.filter(m => !m.lu).length,
    chiffreAffaires: chiffreAffaires.toLocaleString('fr-FR') + ' FCFA',
    derniereCommande: commandes[0] || null,
    derniereReservation: reservations[0] || null,
    dernierMessage: messages[0] || null
  });
});

/* ── Démarrage ── */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║  🍲 La Camerounaise by Landry        ║');
    console.log('║  Serveur démarré avec succès !       ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Port : ${PORT}                           ║`);
    console.log('╚══════════════════════════════════════╝');
  });
});
