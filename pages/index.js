import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { getPageFieldsByName } from './api/api';

export const getStaticProps = async () => {
  const pageData = await getPageFieldsByName("main-page", "mainPageFields");

  if (!pageData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      pageData,
    },
  };
};

export default function Home({ pageData }) {
  const acfFields = pageData.acfFields;
  console.log(acfFields);

  return (
    <div>
      {acfFields["catch-phrase"] && <h1>{acfFields["catch-phrase"]}</h1>}
      {acfFields["paragraph-intro"] && <p>{acfFields["paragraph-intro"]}</p>}
      {acfFields["heading-produits"] && <h2>{acfFields["heading-produits"]}</h2>}
      {acfFields["img-crew"] && (
        <img
          src={acfFields["img-crew"].src}
          alt={acfFields["img-crew"].alt}
        />
      )}
    </div>
  );
}
