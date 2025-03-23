import Link from 'next/link';
import WPImage from '@/components/WPImage';
import styles from '@/styles/desktop/Footer.module.css';
import NewsletterForm from '@/components/NewsletterForm';

export default function Footer({ pageData }) {
  const pageContent = pageData.acfFields;

  return (
    <footer className={styles.footer}>
      {/* Column 1: Logo */}
      <div className={styles.columns}>
        <div className={styles.footerCol}>
          <Link href="/">
            <WPImage className={styles.footerLogo} image={pageContent["img-logo"]} forceFullSize={true} />
          </Link>
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
              <a href="/unsubscribe">Unsubscribe</a>
            </div>
          </div>

          <div className={styles.socialAndAddress}>
            <div className={styles.iconsWrapper}>
              <a href={`mailto:${pageContent["email"]}`}>
                <WPImage className={styles.iconImage} image={pageContent["img-mail"]} forceFullSize={true} />
              </a>
              <a href={pageContent["url-instagram"]} target="_blank" rel="noopener noreferrer">
                <WPImage className={styles.iconImage} image={pageContent["img-instagram"]} forceFullSize={true} />
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
            <NewsletterForm 
              inputPlaceholder={pageContent["newsletter-field-text"]}
              buttonText={pageContent["btn-text"]}
              className={styles.newsletterForm}
            />
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
