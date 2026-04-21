import React from 'react';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Privacy Policy | Crownship',
  description: 'Learn how Crownship collects, uses, and protects your personal information.',
};

export default function PrivacyPolicy() {
  return (
    <div className={`${styles.container} glass-panel`}>
      <h1 className={`${styles.title} gradient-text`}>Privacy Policy</h1>
      <span className={styles.lastUpdated}>Last Updated: April 21, 2026</span>

      <section className={styles.section}>
        <h2>1. Information We Collect</h2>
        <p className={styles.content}>To provide our services effectively, we may collect the following types of information:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}><strong>Email address:</strong> Used for account management and communications.</li>
          <li className={styles.listItem}><strong>Usage data:</strong> Information on how you interact with our tools (pages visited, time spent, feature usage).</li>
          <li className={styles.listItem}><strong>Device and browser information:</strong> IP address, browser type, and operating system.</li>
        </ul>
        <div className={styles.warning} style={{ borderLeftColor: 'var(--accent-primary)', background: 'rgba(57, 255, 20, 0.05)' }}>
          <p className={styles.content} style={{ color: '#fff', margin: 0 }}>
            <strong>Important:</strong> We do <strong>not</strong> collect sensitive financial information like bank passwords or private keys.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2>2. How We Use Information</h2>
        <p className={styles.content}>We utilize collected data to:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Provide, maintain, and improve our analytical tools.</li>
          <li className={styles.listItem}>Communicate important service updates and announcements.</li>
          <li className={styles.listItem}>Enhance user experience through personalized insights.</li>
          <li className={styles.listItem}>Ensure the security and integrity of our platform.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Cookies</h2>
        <p className={styles.content}>
          We use cookies and similar tracking technologies to track activity on our service and hold certain information.
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Remembering your preferences and settings.</li>
          <li className={styles.listItem}>Analyzing traffic and usage patterns to optimize performance.</li>
        </ul>
        <p className={styles.content}>
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Data Sharing</h2>
        <p className={styles.content}>
          We value your privacy. <strong>We do not sell your personal data.</strong>
        </p>
        <p className={styles.content}>We may share data with:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Trusted service providers (hosting, analytics, and email services) that assist in our operations.</li>
          <li className={styles.listItem}>Legal authorities if required to do so by law or in response to valid requests by public authorities.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. Data Security</h2>
        <p className={styles.content}>
          We implement reasonable security measures designed to protect your information from unauthorized access or disclosure. However, please be aware that no system is 100% secure.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Third-Party Links</h2>
        <p className={styles.content}>
          Our platform may contain links to third-party services. We are not responsible for the privacy practices or the content of these external sites.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Your Rights</h2>
        <p className={styles.content}>Depending on your location, you may have the following rights regarding your data:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>The right to request access to the data we hold about you.</li>
          <li className={styles.listItem}>The right to request deletion of your personal data.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>8. Changes to Policy</h2>
        <p className={styles.content}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Contact</h2>
        <p className={styles.content}>
          If you have any questions about this Privacy Policy, please contact us at:
          <br />
          Email: <a href="mailto:crownship797@gmail.com" className={styles.emailLink}>crownship797@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
