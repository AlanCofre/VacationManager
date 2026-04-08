const { BrevoClient } = require('@getbrevo/brevo');

const apiInstance = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY
});

const sendEmail = async (to, subject, html) => {
  try {
    await apiInstance.transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: "Vacation Manager"
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html 
    });

    console.log('Email enviado a:', to);
  } catch (error) {
    console.error('Error enviando email:', error.message);
  }
};

module.exports = sendEmail;