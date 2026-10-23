'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import styles from '@/styles/notFound.module.css';

function NotFoundContent() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>
          404 - Page Non Trouvée
        </h1>

        <p className={styles.message}>
          Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>

        <Link href="/" className={styles.button}>
          Retourner à l&apos;accueil
        </Link>
      </div>
    </div>

    // <div className={styles.container}>
    //   <div className={styles.card}>
    //     <h1 className={styles.title}>
    //       404 - Page Non Trouvée
    //     </h1>
    //
    //     <p className={styles.message}>
    //       Désolé, ce site est temporairement hors d&apos;usage.<br/>
    //       Veuillez réessayer plus tard.
    //     </p>
    //   </div>
    // </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className={styles.loading}>Chargement...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
