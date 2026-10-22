import 'dotenv/config';
import nodemailer from 'nodemailer';
import { getTransporter } from './services/emailService.js';

async function testEmailSetup() {
  console.log('=== SKILLMATCH AI — EMAIL CONFIGURATION CHECK ===\n');

  const rawUser = process.env.GMAIL_USER || process.env.EMAIL_USER || process.env.SMTP_USER || process.env.GMAIL_EMAIL || process.env.MAIL_USER;
  const rawPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASS || process.env.GMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.APP_PASSWORD || process.env.SMTP_PASS;

  console.log('Detected environment variables:');
  console.log('- Email / Gmail User:', rawUser ? `"${rawUser}"` : 'MISSING (NOT FOUND IN .env)');
  console.log('- Gmail App Password:', rawPass ? `FOUND (${rawPass.replace(/\s+/g, '').length} characters)` : 'MISSING (NOT FOUND IN .env)');

  if (!rawUser || !rawPass) {
    console.log('\n❌ SETUP NEEDED:');
    console.log('Please ensure your c:\\poject\\.env file has been SAVED (press Ctrl + S in your editor) and contains:');
    console.log('\nGMAIL_USER=your_email@gmail.com');
    console.log('GMAIL_PASS=xxxx xxxx xxxx xxxx');
    console.log('\n(Make sure there is NO "#" symbol in front of GMAIL_USER or GMAIL_PASS!)\n');
    process.exit(1);
  }

  const cleanUser = rawUser.replace(/['"]/g, '').trim();
  const cleanPass = rawPass.replace(/['"]/g, '').replace(/\s+/g, '').trim();

  console.log('\nAttempting live connection to Google Gmail SMTP server...');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass
      }
    });

    await transporter.verify();
    console.log('\n✅ SUCCESS: Gmail authentication verified successfully!');
    console.log(`Connected as: ${cleanUser}`);
    console.log('Your SkillMatch AI platform is now ready to dispatch live 6-digit OTP verification codes to real Gmail accounts.\n');
  } catch (err) {
    console.error('\n❌ AUTHENTICATION ERROR:');
    console.error(err.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Ensure 2-Step Verification is turned ON for your Google Account.');
    console.log('2. Ensure you are using a 16-character Google App Password (from https://myaccount.google.com/apppasswords), NOT your normal Gmail password.');
    console.log('3. Ensure your email address in GMAIL_USER is typed correctly.');
    process.exit(1);
  }
}

testEmailSetup();
