import Head from 'next/head'
import CircleMaster from '../components/CircleMaster'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Circle Master - Farcaster Miniapp</title>
        <meta name="description" content="Draw a perfect circle ! Test your drawing skills ," />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />

        {/* Farcaster Frame Meta Tags */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:title" content="Circle Master" />
        <meta property="fc:frame:description" content="Draw a perfect circle ! Test your drawing skills ," />
        <meta property="fc:frame:image" content="https://circle-master.vercel.app/api/og" />
        <meta property="fc:frame:button:1" content="Draw it" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://circle-master.vercel.app" />

        {/* Open Graph */}
        <meta property="og:title" content="Circle Master - Farcaster Miniapp" />
        <meta property="og:description" content="Draw a perfect circle ! Test your drawing skills ," />
        <meta property="og:image" content="https://circle-master.vercel.app/api/og" />
        <meta property="og:url" content="https://circle-master.vercel.app" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Circle Master - Farcaster Miniapp" />
        <meta name="twitter:description" content="Draw a perfect circle ! Test your drawing skills ," />
        <meta name="twitter:image" content="https://circle-master.vercel.app/api/og" />
      </Head>

      <main>
        <CircleMaster />
      </main>
    </div>
  )
}
