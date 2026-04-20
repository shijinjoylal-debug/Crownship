import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from './src/lib/db';
import nodemailer from 'nodemailer';

async function testEmail() {
    console.log('Testing email... GMAIL_USER:', process.env.GMAIL_USER);
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error('Missing GMAIL_USER or GMAIL_PASS environment variables.');
        return;
    }

    try {
        const approvedEmails = ['shijinc0der@gmail.com']; // Assuming user wants to send to their email, or we'll fetch from db
        const dbEmails = await db.approvedUsers.getAllEmails();
        console.log('Approved emails found in DB:', dbEmails);

        if (dbEmails.length > 0) {
            approvedEmails.push(...dbEmails);
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS, // App Password
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: Array.from(new Set(approvedEmails)).join(','),
            subject: 'Test Email from Crownship',
            text: 'This is a test email to verify if the notification system is working.',
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result);
    } catch (err) {
        console.error('Error sending email:', err);
    } finally {
        process.exit();
    }
}

testEmail();
