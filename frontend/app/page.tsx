import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.background} />
      
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon} />
          WebhookLab
        </div>
        
        <nav className={styles.nav}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#docs" className={styles.navLink}>Documentation</Link>
          <Link href="#pricing" className={styles.navLink}>Pricing</Link>
        </nav>
        
        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
          <Link href="/register" className={styles.signupBtn}>Get Started</Link>
        </div>
      </header>

      <main className={styles.hero}>
        <div className={styles.badge}>
          <span style={{ marginRight: '6px' }}>✨</span> WebhookLab v2.0 is now live
        </div>
        
        <h1 className={styles.title}>
          Inspect Webhooks <br />
          <span className={styles.titleHighlight}>at the Speed of Thought</span>
        </h1>
        
        <p className={styles.description}>
          The ultimate developer toolkit to capture, inspect, and route webhooks locally and in the cloud. Beautifully designed, lightning fast, and infinitely scalable.
        </p>
        
        <div className={styles.heroActions}>
          <Link href="/register" className={styles.primaryBtn}>
            Start for free
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
          <Link href="/workspace" className={styles.secondaryBtn}>
            Enter Workspace
          </Link>
        </div>

        <div className={styles.mockupContainer}>
          <div className={styles.mockup}>
            <div className={styles.mockupHeader}>
              <div className={`${styles.dot} ${styles.dotRed}`} />
              <div className={`${styles.dot} ${styles.dotYellow}`} />
              <div className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <div className={styles.mockupBody}>
              <div><span className={styles.mockupKey}>POST</span> /api/webhooks/stripe_live_9a8b7c</div>
              <div><span className={styles.mockupKey}>Host:</span> hook.webhooklab.com</div>
              <div><span className={styles.mockupKey}>Content-Type:</span> application/json</div>
              <br />
              <div>{`{`}</div>
              <div>&nbsp;&nbsp;<span className={styles.mockupKey}>"id"</span>: <span className={styles.mockupString}>"evt_1Mqw..."</span>,</div>
              <div>&nbsp;&nbsp;<span className={styles.mockupKey}>"object"</span>: <span className={styles.mockupString}>"event"</span>,</div>
              <div>&nbsp;&nbsp;<span className={styles.mockupKey}>"type"</span>: <span className={styles.mockupString}>"payment_intent.succeeded"</span>,</div>
              <div>&nbsp;&nbsp;<span className={styles.mockupKey}>"data"</span>: {`{`}</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.mockupKey}>"object"</span>: {`{`}</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.mockupKey}>"amount"</span>: <span className={styles.mockupNumber}>2000</span>,</div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.mockupKey}>"currency"</span>: <span className={styles.mockupString}>"usd"</span></div>
              <div>&nbsp;&nbsp;&nbsp;&nbsp;{`}`}</div>
              <div>&nbsp;&nbsp;{`}`}</div>
              <div>{`}`}</div>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureContent}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12h4l3-9 5 18 3-9h5"></path>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Real-time Inspection</h3>
            <p className={styles.featureDesc}>
              Watch webhooks stream in instantly. Inspect headers, payload, and query parameters in a beautiful interface without refreshing the page.
            </p>
          </div>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureContent}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Team Workspaces</h3>
            <p className={styles.featureDesc}>
              Collaborate effortlessly. Share webhook URLs across your organization and debug external integrations as a team in secure workspaces.
            </p>
          </div>
        </div>
        
        <div className={styles.featureCard}>
          <div className={styles.featureContent}>
            <div className={styles.featureIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>Local Forwarding</h3>
            <p className={styles.featureDesc}>
              Route webhooks directly to your localhost. Our CLI tunnel ensures you can test your APIs in development without deploying a single line of code.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
