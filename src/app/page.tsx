"use client";
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.badge}>Next-Gen Trading</div>
            <h1 className={styles.title}>
              Dominance starts with <br />
              <span className="gradient-text">superior intelligence.</span>
            </h1>
            <p className={styles.subtitle}>
              Institutional-grade order flow tools, AI-powered signals, and automated strategies.
              Stop gambling. Start operating.
            </p>
            <div className={styles.actions}>
              <Link href="/shop" className="btn-primary pulse-primary">
                Explore Tools
              </Link>
              <Link href="/shop" className={styles.secondaryBtn}>
                View Demo
              </Link>
            </div>

            <div className={styles.trustBadges}>
               <span>✔️ Verified Real-Time Data</span>
               <span>🔒 Bank-Grade Security</span>
               <span>⭐ 4.9/5 from 12k+ Traders</span>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>$4.2B+</span>
                <span className={styles.statLabel}>Volume Analyzed</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>12k+</span>
                <span className={styles.statLabel}>Active Traders</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>94%</span>
                <span className={styles.statLabel}>Success Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className={styles.glow1} />
        <div className={styles.glow2} />
      </section>

      {/* Features Grid */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.grid}>
            <div className={`glass-panel ${styles.featureCard}`}>
              <h3>Real-time Data</h3>
              <p>Direct feed from major exchanges with &lt; 10ms latency.</p>
            </div>
            <div className={`glass-panel ${styles.featureCard}`}>
              <h3>AI Predictions</h3>
              <p>Neural networks trained on 10 years of market data.</p>
            </div>
            <div className={`glass-panel ${styles.featureCard}`}>
              <h3>Whale Tracking</h3>
              <p>See hidden buy/sell walls before they execute.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Don't Just Take Our Word For It</h2>
          <div className={styles.grid}>
            <div className={`glass-panel ${styles.testimonialCard}`}>
              <div className={styles.stars}>★★★★★</div>
              <p>"The latency is incredible. I'm executing trades milliseconds before the rest of the market."</p>
              <h4>- Sarah J., Pro Trader</h4>
            </div>
            <div className={`glass-panel ${styles.testimonialCard}`}>
              <div className={styles.stars}>★★★★★</div>
              <p>"The whale tracking feature alone paid for my lifetime access in the first 2 hours."</p>
              <h4>- Mike T., Crypto Analyst</h4>
            </div>
            <div className={`glass-panel ${styles.testimonialCard}`}>
              <div className={styles.stars}>★★★★★</div>
              <p>"Finally an institutional-grade tool available for retail. The UI is sharp and exactly what I needed."</p>
              <h4>- David R., Quant Fund Manager</h4>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
