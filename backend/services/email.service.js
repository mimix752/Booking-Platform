const { transporter, emailFrom } = require('../config/email');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// Email templates
const emailTemplates = {
  reservationCreated: (reservation, local, user) => ({
    subject: `✅ Réservation créée - ${local.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D97706 0%, #F59E0B 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">UCA Booking</h1>
          <p style="color: white; margin: 10px 0 0 0;">Université Cadi Ayyad</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; margin-top: 0;">Réservation enregistrée</h2>
          <p style="color: #4b5563;">Bonjour ${user.name},</p>
          <p style="color: #4b5563;">Votre demande de réservation a été enregistrée avec succès.</p>
          
          <div style="background: white; border-left: 4px solid #D97706; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Détails de la réservation</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Local:</td>
                <td style="padding: 8px 0; color: #1f2937;">${local.nom}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(reservation.date_debut).toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Créneau:</td>
                <td style="padding: 8px 0; color: #1f2937;">${reservation.creneau}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Participants:</td>
                <td style="padding: 8px 0; color: #1f2937;">${reservation.participants} personnes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Statut:</td>
                <td style="padding: 8px 0;">
                  <span style="background: #FEF3C7; color: #D97706; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                    ${reservation.statut === 'en_attente' ? 'En attente de validation' : 'Confirmée'}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          
          ${reservation.statut === 'en_attente' ? 
            '<p style="color: #6b7280; font-size: 14px;"><strong>Note:</strong> Votre réservation sera validée par un administrateur dans les plus brefs délais.</p>' 
            : ''}
          
          <p style="color: #4b5563; margin-top: 30px;">Cordialement,<br><strong>L\'équipe UCA Booking</strong></p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Université Cadi Ayyad - Tous droits réservés</p>
          <p>Contact: booking@uca.ma</p>
        </div>
      </div>
    `
  }),

  reservationConfirmed: (reservation, local, user, comment) => ({
    subject: `✅ Réservation confirmée - ${local.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Réservation Confirmée</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="color: #4b5563;">Bonjour ${user.name},</p>
          <p style="color: #4b5563;">Bonne nouvelle ! Votre réservation a été confirmée.</p>
          
          <div style="background: white; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Détails de la réservation</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Local:</td>
                <td style="padding: 8px 0; color: #1f2937;">${local.nom}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; color: #1f2937;">${new Date(reservation.date_debut).toLocaleDateString('fr-FR')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Créneau:</td>
                <td style="padding: 8px 0; color: #1f2937;">${reservation.creneau}</td>
              </tr>
            </table>
          </div>
          
          ${comment ? `<div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0;">
            <strong style="color: #1f2937;">Message de l'administrateur:</strong>
            <p style="color: #4b5563; margin: 10px 0 0 0;">${comment}</p>
          </div>` : ''}
          
          <p style="color: #4b5563; margin-top: 30px;">Cordialement,<br><strong>L\'équipe UCA Booking</strong></p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Université Cadi Ayyad - Tous droits réservés</p>
        </div>
      </div>
    `
  }),

  reservationRefused: (reservation, local, user, comment) => ({
    subject: `❌ Réservation refusée - ${local.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Réservation Refusée</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="color: #4b5563;">Bonjour ${user.name},</p>
          <p style="color: #4b5563;">Malheureusement, votre demande de réservation n'a pas pu être acceptée.</p>
          
          <div style="background: white; border-left: 4px solid #EF4444; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Détails de la demande</h3>
            <p style="color: #6b7280;"><strong>Local:</strong> ${local.nom}</p>
            <p style="color: #6b7280;"><strong>Date:</strong> ${new Date(reservation.date_debut).toLocaleDateString('fr-FR')}</p>
          </div>
          
          ${comment ? `<div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
            <strong style="color: #1f2937;">Raison du refus:</strong>
            <p style="color: #4b5563; margin: 10px 0 0 0;">${comment}</p>
          </div>` : ''}
          
          <p style="color: #4b5563;">N'hésitez pas à faire une nouvelle demande pour d'autres créneaux disponibles.</p>
          
          <p style="color: #4b5563; margin-top: 30px;">Cordialement,<br><strong>L\'équipe UCA Booking</strong></p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Université Cadi Ayyad - Tous droits réservés</p>
        </div>
      </div>
    `
  }),

  reservationCancelled: (reservation, local, user) => ({
    subject: `🔄 Réservation annulée - ${local.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Réservation Annulée</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="color: #4b5563;">Bonjour ${user.name},</p>
          <p style="color: #4b5563;">Votre réservation a été annulée.</p>
          
          <div style="background: white; border-left: 4px solid #6B7280; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Détails</h3>
            <p style="color: #6b7280;"><strong>Local:</strong> ${local.nom}</p>
            <p style="color: #6b7280;"><strong>Date:</strong> ${new Date(reservation.date_debut).toLocaleDateString('fr-FR')}</p>
          </div>
          
          <p style="color: #4b5563; margin-top: 30px;">Cordialement,<br><strong>L\'équipe UCA Booking</strong></p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Université Cadi Ayyad - Tous droits réservés</p>
        </div>
      </div>
    `
  }),

  reservationReminder: (reservation, local, user) => ({
    subject: `⏰ Rappel - Réservation demain - ${local.nom}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ Rappel de Réservation</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <p style="color: #4b5563;">Bonjour ${user.name},</p>
          <p style="color: #4b5563;">Ceci est un rappel pour votre réservation de demain.</p>
          
          <div style="background: white; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">Détails</h3>
            <p style="color: #6b7280;"><strong>Local:</strong> ${local.nom}</p>
            <p style="color: #6b7280;"><strong>Date:</strong> ${new Date(reservation.date_debut).toLocaleDateString('fr-FR')}</p>
            <p style="color: #6b7280;"><strong>Créneau:</strong> ${reservation.creneau}</p>
          </div>
          
          <p style="color: #4b5563; margin-top: 30px;">À bientôt,<br><strong>L\'équipe UCA Booking</strong></p>
        </div>
        
        <div style="background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Université Cadi Ayyad - Tous droits réservés</p>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: emailFrom,
      to,
      subject,
      html
    });

    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

// Log notification to database
const logNotification = async (userId, reservationId, type, subject, message, isSent, errorMessage = null) => {
  try {
    await query(`
      INSERT INTO notifications (user_id, reservation_id, type, subject, message, is_sent, sent_at, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ${isSent ? 'NOW()' : 'NULL'}, ?)
    `, [userId, reservationId, type, subject, message, isSent, errorMessage]);
  } catch (error) {
    logger.error('Failed to log notification:', error);
  }
};

// Email service methods
const emailService = {
  // Send reservation created email
  sendReservationCreated: async (reservation, local, user) => {
    const template = emailTemplates.reservationCreated(reservation, local, user);
    const result = await sendEmail(user.email, template.subject, template.html);
    
    await logNotification(
      user.id,
      reservation.id,
      'confirmation',
      template.subject,
      template.html,
      result.success,
      result.error
    );
    
    return result;
  },

  // Send reservation confirmed email
  sendReservationConfirmed: async (reservation, local, user, comment = null) => {
    const template = emailTemplates.reservationConfirmed(reservation, local, user, comment);
    const result = await sendEmail(user.email, template.subject, template.html);
    
    await logNotification(
      user.id,
      reservation.id,
      'validation',
      template.subject,
      template.html,
      result.success,
      result.error
    );
    
    return result;
  },

  // Send reservation refused email
  sendReservationRefused: async (reservation, local, user, comment = null) => {
    const template = emailTemplates.reservationRefused(reservation, local, user, comment);
    const result = await sendEmail(user.email, template.subject, template.html);
    
    await logNotification(
      user.id,
      reservation.id,
      'refus',
      template.subject,
      template.html,
      result.success,
      result.error
    );
    
    return result;
  },

  // Send reservation cancelled email
  sendReservationCancelled: async (reservation, local, user) => {
    const template = emailTemplates.reservationCancelled(reservation, local, user);
    const result = await sendEmail(user.email, template.subject, template.html);
    
    await logNotification(
      user.id,
      reservation.id,
      'annulation',
      template.subject,
      template.html,
      result.success,
      result.error
    );
    
    return result;
  },

  // Send reservation reminder
  sendReservationReminder: async (reservation, local, user) => {
    const template = emailTemplates.reservationReminder(reservation, local, user);
    const result = await sendEmail(user.email, template.subject, template.html);
    
    await logNotification(
      user.id,
      reservation.id,
      'rappel',
      template.subject,
      template.html,
      result.success,
      result.error
    );
    
    return result;
  }
};

module.exports = emailService;