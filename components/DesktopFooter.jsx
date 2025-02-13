import  styles from '../styles/DesktopFooter.module.css';

export default function Footer({ pageData }) {
  const pageContent = pageData.acfFields;
  
  // debugging
  // console.log("Footer content:", pageContent);

  return (
    <footer className={styles.footer}>
      {/* Column 1: Logo */}
      <div className={styles.columns}>
        <div className={styles.footerCol}>
          <img 
            src={pageContent["img-logo"].src} 
            alt={pageContent["img-logo"].alt || 'Logo'} 
            className={styles.footerLogo} 
          />
        </div>

        {/* Column 2: Links and address */}
        <div className={styles.footerCol}>
          <div className={styles.linkWrapper}>
            <div className={styles.linkColumn}>
              <a href="/a-propos">{pageContent["a-propos"]}</a>
              <a href="/agrotourisme">{pageContent["agrotourisme"]}</a>
              <a href="/evenements">{pageContent["evenements"]}</a>
            </div>
            <div className={styles.linkColumn}>
              <a href="/abonnement">{pageContent["abonnement"]}</a>
              <a href="/contact">{pageContent["contact"]}</a>
            </div>
          </div>

          <div className={styles.socialAndAddress}>
            <div className={styles.iconsWrapper}>
              <a href={`mailto:${pageContent["email"]}`}><img src={pageContent["img-mail"].src} alt={pageContent["img-mail"].alt || 'Email'} /></a>
              <a href={pageContent["url-instagram"]} target="_blank" rel="noopener noreferrer">
                <img src={pageContent["img-instagram"].src} alt={pageContent["img-instagram"].alt || 'Instagram'} />
              </a>
            </div>
            <p className={styles.address}>
              {pageContent["addresse"]}
            </p>
          </div>
        </div>

        {/* Column 3: Newsletter */}
        <div className={styles.footerCol}>
          <div className={styles.newsletterWrapper}>
            <h3 className={styles.newsletterTitle}>{pageContent["newsletter-h3"]}</h3>
            <div className={styles.newsletterForm}>
              <input
                type="email"
                placeholder={pageContent["newsletter-field-text"]}
                className={`${styles.newsletterInput} disabled`}
              />
              <button className={`${styles.newsletterButton} disabled`}>{pageContent["btn-text"]}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Copyright Section */}
      <div className={styles.copyright}>
        <p>{pageContent["copyright"]}</p>
      </div>
    </footer>
  )
}
