import React from 'react';
import styles from '../legal.module.css';

export const metadata = {
  title: 'Risk Disclaimer | Crownship',
  description: 'Understand the risks associated with trading cryptocurrencies and using Crownship tools.',
};

export default function RiskDisclaimer() {
  return (
    <div className={`${styles.container} glass-panel`}>
      <h1 className={`${styles.title} gradient-text`}>Risk Disclaimer</h1>
      <span className={styles.lastUpdated}>Last Updated: April 21, 2026</span>

      <div className={styles.warning}>
        <h2>High Risk Warning</h2>
        <p className={styles.content}>
          Trading cryptocurrencies and other financial instruments involves a high level of risk and may not be suitable
          for all investors. The high degree of leverage can work against you as well as for you.
        </p>
      </div>

      <section className={styles.section}>
        <h4>You may lose:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>All of your invested capital</li>
          <li className={styles.listItem}>More than your initial investment in leveraged trading</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>No Financial Advice</h2>
        <p className={styles.content}>
          Crownship does not provide financial, investment, legal, or tax advice. We are a technology provider offering informational tools and analytics.
        </p>
        <h4>All information provided:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>Should not be considered as a recommendation to buy or sell any asset</li>
          <li className={styles.listItem}>Is intended for educational and informational purposes only</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>No Guarantees</h2>
        <p className={styles.content}>
          While we strive for excellence, the nature of financial markets means results can never be certain.
        </p>
        <h4>We do not guarantee:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>Accuracy of signals or predictions</li>
          <li className={styles.listItem}>Profitability or specific financial outcomes</li>
          <li className={styles.listItem}>Risk reduction or elimination of losses</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>User Responsibility</h2>
        <p className={styles.content}>
          By using our platform, you acknowledge that you are acting on your own volition.
        </p>
        <h4>You are solely responsible for:</h4>
        <ul className={styles.list}>
          <li className={styles.listItem}>Your trading decisions and strategy execution</li>
          <li className={styles.listItem}>Ensuring proper risk management protocols</li>
          <li className={styles.listItem}>Any and all financial losses incurred during trading activity</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Use at Your Own Risk</h2>
        <p className={styles.content}>
          By using Crownship, you acknowledge and accept all risks associated with trading. You should never invest money that you cannot afford to lose.
        </p>
      </section>
    </div>
  );
}
