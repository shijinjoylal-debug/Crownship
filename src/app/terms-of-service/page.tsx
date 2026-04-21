import React from 'react';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Terms of Service | Crownship',
  description: 'The terms and conditions governing your use of the Crownship platform and services.',
};

export default function TermsOfService() {
  return (
    <div className={`${styles.container} glass-panel`}>
      <h1 className={`${styles.title} gradient-text`}>Terms of Service</h1>
      <span className={styles.lastUpdated}>Last Updated: April 21, 2026</span>

      <section className={styles.section}>
        <h2>1. Acceptance of Terms</h2>
        <p className={styles.content}>
          By accessing or using Crownship (“we”, “our”, “us”), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use our platform or services.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Nature of Service</h2>
        <p className={styles.content}>
          Crownship provides AI-powered market insights, analytics, and informational tools related to financial markets, including cryptocurrency.
        </p>
        <h4>We do not:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>Provide financial, investment, or trading advice.</li>
          <li className={styles.listItem}>Act as a broker, dealer, or financial advisor.</li>
          <li className={styles.listItem}>Execute trades on behalf of users.</li>
          <li className={styles.listItem}>Manage or hold user funds.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. No Financial Advice</h2>
        <p className={styles.content}>
          All content, signals, predictions, or insights provided on Crownship are for informational purposes only.
        </p>
        <h4>You acknowledge that:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>Trading involves significant financial risk.</li>
          <li className={styles.listItem}>Past performance does not guarantee future results.</li>
          <li className={styles.listItem}>You are solely responsible for your trading decisions and their consequences.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4. User Responsibilities</h2>
        <p className={styles.content}>By using Crownship, you represent and warrant that:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>You are at least 18 years old.</li>
          <li className={styles.listItem}>You will not rely solely on our platform for making financial decisions.</li>
          <li className={styles.listItem}>You fully understand the risks associated with volatile financial markets.</li>
          <li className={styles.listItem}>You comply with all applicable laws and regulations in your jurisdiction.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. Account & Security</h2>
        <p className={styles.content}>
          If you create an account on Crownship, you are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Third-Party Services</h2>
        <p className={styles.content}>
          Crownship may integrate with or provide links to third-party platforms (e.g., exchanges like Binance).
        </p>
        <h4>We are not responsible for:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>The performance or reliability of third-party services.</li>
          <li className={styles.listItem}>API failures, connectivity issues, or data inaccuracies from external sources.</li>
          <li className={styles.listItem}>Any losses caused by or related to external platforms.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>7. Limitation of Liability</h2>
        <p className={styles.content}>
          To the fullest extent permitted by law, Crownship and its affiliates shall not be liable for:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Any direct, indirect, or consequential financial losses.</li>
          <li className={styles.listItem}>Trading losses or missed opportunities.</li>
          <li className={styles.listItem}>Service interruptions or technical failures.</li>
        </ul>
        <div className={styles.warning}>
          <p className={styles.content} style={{ color: '#fff', margin: 0 }}>
            <strong>Use of the platform is entirely at your own risk.</strong>
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2>8. No Guarantees</h2>
        <p className={styles.content}>
          We strive for accuracy but cannot guarantee:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Continuous profitability or success in trading.</li>
          <li className={styles.listItem}>The absolute accuracy of AI-generated predictions or signals.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>9. Termination</h2>
        <p className={styles.content}>
          We reserve the right to suspend or terminate your access to the platform at any time, without notice, for any reason, including breach of these Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Changes to Terms</h2>
        <p className={styles.content}>
          We may update these Terms at any time. Your continued use of the platform following the posting of changes constitutes your acceptance of the updated Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Contact</h2>
        <p className={styles.content}>
          For any questions regarding these Terms, please contact us at:
          <br />
          Email: <a href="mailto:crownship797@gmail.com" className={styles.emailLink}>crownship797@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
