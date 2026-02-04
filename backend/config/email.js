const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier la configuration email
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuration email validée et prête');
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error.message);
    return false;
  }
};

// Templates d'emails
const emailTemplates = {
  // Email de confirmation de soumission
  reservationSubmitted: (reservation, user, local) => ({
    subject: 'Confirmation de votre demande de réservation - UCA Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #92400e 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #92400e; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #fef3c7; color: #92400e; border-radius: 20px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 UCA Booking</h1>
            <p>Université Cadi Ayyad</p>
          </div>
          <div class="content">
            <h2>Bonjour ${user.name},</h2>
            <p>Votre demande de réservation a été enregistrée avec succès.</p>
            
            <div class="info-box">
              <h3>📋 Détails de la réservation</h3>
              <div class="info-row">
                <span class="info-label">Local :</span>
                <span>${local.nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Site :</span>
                <span>${local.site_nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date début :</span>
                <span>${reservation.date_debut}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date fin :</span>
                <span>${reservation.date_fin}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Créneau :</span>
                <span>${reservation.creneau}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nature :</span>
                <span>${reservation.nature_evenement}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Participants :</span>
                <span>${reservation.participants_estimes}</span>
              </div>
            </div>

            <p><span class="status-badge">⏳ En attente de validation</span></p>
            
            <p>Votre réservation sera traitée dans les plus brefs délais. Vous recevrez un email de confirmation dès qu'elle sera validée par l'administration.</p>
            
            <center>
              <a href="${process.env.FRONTEND_RESERVATION_URL}" class="button">Voir mes réservations</a>
            </center>
          </div>
          <div class="footer">
            <p>Université Cadi Ayyad - UCA Booking</p>
            <p>Avenue Abdelkrim Khattabi, Marrakech</p>
            <p>Email: booking@uca.ma | Tél: +212 5XX-XXXXXX</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email de validation
  reservationConfirmed: (reservation, user, local) => ({
    subject: '✅ Réservation confirmée - UCA Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #059669; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #d1fae5; color: #059669; border-radius: 20px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .alert-box { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Réservation Confirmée</h1>
            <p>UCA Booking - Université Cadi Ayyad</p>
          </div>
          <div class="content">
            <h2>Félicitations ${user.name} !</h2>
            <p>Votre réservation a été validée et confirmée par l'administration.</p>
            
            <div class="info-box">
              <h3>📋 Détails de la réservation</h3>
              <div class="info-row">
                <span class="info-label">Local :</span>
                <span>${local.nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Site :</span>
                <span>${local.site_nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date début :</span>
                <span>${reservation.date_debut}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date fin :</span>
                <span>${reservation.date_fin}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Créneau :</span>
                <span>${reservation.creneau}</span>
              </div>
            </div>

            <p><span class="status-badge">✅ Confirmée</span></p>

            ${reservation.commentaire_admin ? `
            <div class="alert-box">
              <strong>💬 Message de l'administration :</strong>
              <p>${reservation.commentaire_admin}</p>
            </div>
            ` : ''}
            
            <p><strong>⚠️ Rappel important :</strong></p>
            <ul>
              <li>Merci d'arriver 10 minutes avant le créneau</li>
              <li>Pensez à laisser le local propre après utilisation</li>
              <li>En cas d'annulation, prévenez au moins 12h à l'avance</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_RESERVATION_URL}" class="button">Voir mes réservations</a>
            </center>
          </div>
          <div class="footer">
            <p>Université Cadi Ayyad - UCA Booking</p>
            <p>Avenue Abdelkrim Khattabi, Marrakech</p>
            <p>Email: booking@uca.ma | Tél: +212 5XX-XXXXXX</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email d'annulation
  reservationCancelled: (reservation, user, local, reason) => ({
    subject: '❌ Réservation annulée - UCA Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #dc2626; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #fee2e2; color: #dc2626; border-radius: 20px; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #d97706; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .reason-box { background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Réservation Annulée</h1>
            <p>UCA Booking - Université Cadi Ayyad</p>
          </div>
          <div class="content">
            <h2>Bonjour ${user.name},</h2>
            <p>Nous vous informons que votre réservation a été annulée.</p>
            
            <div class="info-box">
              <h3>📋 Détails de la réservation annulée</h3>
              <div class="info-row">
                <span class="info-label">Local :</span>
                <span>${local.nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Site :</span>
                <span>${local.site_nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date début :</span>
                <span>${reservation.date_debut}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date fin :</span>
                <span>${reservation.date_fin}</span>
              </div>
            </div>

            <p><span class="status-badge">❌ Annulée</span></p>

            ${reason ? `
            <div class="reason-box">
              <strong>📝 Raison de l'annulation :</strong>
              <p>${reason}</p>
            </div>
            ` : ''}
            
            <p>Pour toute question, n'hésitez pas à nous contacter à booking@uca.ma</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}" class="button">Nouvelle réservation</a>
            </center>
          </div>
          <div class="footer">
            <p>Université Cadi Ayyad - UCA Booking</p>
            <p>Avenue Abdelkrim Khattabi, Marrakech</p>
            <p>Email: booking@uca.ma | Tél: +212 5XX-XXXXXX</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email de rappel
  reservationReminder: (reservation, user, local) => ({
    subject: '⏰ Rappel de réservation - Demain - UCA Booking',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-label { font-weight: bold; color: #2563eb; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Rappel de Réservation</h1>
            <p>UCA Booking - Université Cadi Ayyad</p>
          </div>
          <div class="content">
            <h2>Bonjour ${user.name},</h2>
            <p>Ce message est un rappel pour votre réservation de demain.</p>
            
            <div class="info-box">
              <h3>📋 Détails de votre réservation</h3>
              <div class="info-row">
                <span class="info-label">Local :</span>
                <span>${local.nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Site :</span>
                <span>${local.site_nom}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date :</span>
                <span>${reservation.date_debut}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Créneau :</span>
                <span>${reservation.creneau}</span>
              </div>
            </div>
            
            <p><strong>📍 N'oubliez pas :</strong></p>
            <ul>
              <li>Arriver 10 minutes avant le début</li>
              <li>Vérifier les équipements nécessaires</li>
              <li>Laisser le local propre après utilisation</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_RESERVATION_URL}" class="button">Voir ma réservation</a>
            </center>
          </div>
          <div class="footer">
            <p>Université Cadi Ayyad - UCA Booking</p>
            <p>Avenue Abdelkrim Khattabi, Marrakech</p>
            <p>Email: booking@uca.ma | Tél: +212 5XX-XXXXXX</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Fonction pour envoyer un email
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'UCA Booking <booking@uca.ma>',
      to,
      subject,
      html
    });
    console.log(`✅ Email envoyé: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  verifyEmailConfig,
  emailTemplates,
  sendEmail
};