const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'nimaivineej@gmail.com',
        pass: 'dvye eafry aosp boz'.replace(/\s/g, ''), // Removed spaces just in case
    },
});

async function main() {
    try {
        console.log("Testing SMTP connection...");
        const info = await transporter.sendMail({
            from: '"SafetyShield Test" <nimaivineej@gmail.com>',
            to: 'nimaivineej@gmail.com',
            subject: 'Test Email from Node script',
            text: 'It works!',
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

main();
