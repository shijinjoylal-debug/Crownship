"use client";
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroLayout}>
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
                <Link href="/research" className={styles.secondaryBtn}>
                  Read Research
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

            <div className={styles.heroVisual}>
              <div className={styles.orderFlow}>
                <div className={styles.flowHeader}>
                  <span>Time</span>
                  <span>Type</span>
                  <span>Price</span>
                  <span>Amount</span>
                </div>
                <div className={styles.flowContainer}>
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className={styles.tradeRow}>
                      <span className={styles.time}>14:{String(i%60).padStart(2, '0')}:{String(i * 3 % 60).padStart(2, '0')}</span>
                      <span className={i % 3 === 0 ? styles.sell : styles.buy}>
                        {i % 3 === 0 ? 'SELL' : 'BUY'}
                      </span>
                      <span className={styles.price}>{(64200 + (i * 1.5 - 10)).toFixed(2)}</span>
                      <span className={styles.amount}>{(1 + i * 0.1).toFixed(3)} BTC</span>
                    </div>
                  ))}
                  {[...Array(15)].map((_, i) => (
                    <div key={`dup-${i}`} className={styles.tradeRow}>
                      <span className={styles.time}>14:{String(i%60).padStart(2, '0')}:{String(i * 3 % 60).padStart(2, '0')}</span>
                      <span className={i % 3 === 0 ? styles.sell : styles.buy}>
                        {i % 3 === 0 ? 'SELL' : 'BUY'}
                      </span>
                      <span className={styles.price}>{(64200 + (i * 1.5 - 10)).toFixed(2)}</span>
                      <span className={styles.amount}>{(1 + i * 0.1).toFixed(3)} BTC</span>
                    </div>
                  ))}
                </div>
                <div className={styles.scanningLine}></div>
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
              <h3>Execute Faster</h3>
              <p>Front-run the market with direct exchange feeds offering &lt; 10ms latency.</p>
            </div>
            <div className={`glass-panel ${styles.featureCard}`}>
              <h3>Trade with Certainty</h3>
              <p>Leverage neural networks trained on a decade of market data to spot trends early.</p>
            </div>
            <div className={`glass-panel ${styles.featureCard}`}>
              <h3>Follow Smart Money</h3>
              <p>Exploit hidden buy/sell walls and trade alongside the whales before they execute.</p>
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

      <section className={styles.resources}>
        <div className="container">
          <div className={styles.resourceHeader}>
            <h2 className={styles.sectionTitle}>Market Intelligence</h2>
            <p className={styles.resourceSubtitle}>Deep dives, quantitative research, and system updates.</p>
          </div>
          <div className={styles.grid}>
            <div className={`glass-panel ${styles.resourceCard}`}>
               <span className={styles.resourceTag}>Quantitative</span>
               <h3>Predictive Models in High-Volume Markets</h3>
               <p>How our V2 neural network filters noise to identify true institutional bias.</p>
               <Link href="#" className={styles.resourceLink}>Read Report →</Link>
            </div>
            <div className={`glass-panel ${styles.resourceCard}`}>
               <span className={styles.resourceTag}>Research</span>
               <h3>Anatomy of a Buy Wall</h3>
               <p>Deconstructing spoofing tactics and how active order flow analysis exposes true intent.</p>
               <Link href="#" className={styles.resourceLink}>Read Report →</Link>
            </div>
            <div className={`glass-panel ${styles.resourceCard}`}>
               <span className={styles.resourceTag}>Updates</span>
               <h3>Q3 Infrastructure Upgrades</h3>
               <p>New colocation nodes deployed, reducing median latency by an additional 1.4ms.</p>
               <Link href="#" className={styles.resourceLink}>Read Report →</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
