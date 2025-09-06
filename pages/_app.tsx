import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Script from 'next/script';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Product Idea Lab | From Concept to Creation</title>
        <meta name="description" content="An interactive portal to transform product ideas into reality. Upload an image of a product, get an AI-generated description, iteratively edit the design with text prompts, and generate a final product sketch for manufacturing specifications." />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      </Head>
      <Script src="https://accounts.google.com/gsi/client" async defer strategy="afterInteractive" />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
