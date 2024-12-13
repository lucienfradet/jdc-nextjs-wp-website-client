import CustomHead from '../components/CustomHead.js';
import styles from '../styles/Homepage.module.css';
import { getPageFieldsByName } from './api/api';

// getStaticProps gets called on pages (in the pages dir)
// It fetches static data to be rendered client side.
// because header and footer are components, they can't use this function.
// the data needs to be fetchs by every page and passed into the pageProps (props) object
// _app.js has access to this object and can pass the data to the components.
export const getStaticProps = async () => {
  const pageData = await getPageFieldsByName("homepage");
  const headerData = await getPageFieldsByName("header");
  const footerData = await getPageFieldsByName("footer");

  if (!pageData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      pageData,
      headerData,
      footerData,
    },
    // amount of time that needs to pass (in seconds) before next.js re-fetches the data
    // if not set, any changes to the CMS won't take effect until the app is rebuilt manually!
    // revalidate: 60,
  };
};

export default function MainPage({ pageData }) {
  const pageContent = pageData.acfFields;

  // debug statement
  // console.log("Page Content:", pageContent);

  return (
    <>
      <CustomHead
        title={pageContent["head-title"]}
        description={pageContent["head-description"]}
        canonicalUrl={pageContent["head-url"]}
      />
      <div>
        {pageContent["catch-phrase"] && <h1>{pageContent["catch-phrase"]}</h1>}
        {pageContent["paragraph-intro"] && <p>{pageContent["paragraph-intro"]}</p>}
        {pageContent["h2-produits"] && <h2>{pageContent["h2-produits"]}</h2>}
        {pageContent["img-crew"] && (
          <img
            src={pageContent["img-crew"].src}
            alt={pageContent["img-crew"].alt}
          />
        )}
      </div>
    </>
  );
}
