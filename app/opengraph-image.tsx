import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Restox — Automate the Everyday'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(-45deg, #FF8C42, #FFD166, #F97316, #F43F5E)',
          backgroundSize: '400% 400%',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgba(244,63,94,0.3)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            padding: '0 80px',
            textAlign: 'center',
          }}
        >
          {/* Logo text */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            Restox
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 36,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.2,
              maxWidth: 800,
              textAlign: 'center',
            }}
          >
            <span>Automate the Everyday.</span>
            <span>Focus on What Matters.</span>
          </div>

          <div
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.82)',
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            One dashboard for Amazon, Walmart, groceries, and more.
          </div>

          {/* Pill */}
          <div
            style={{
              marginTop: 16,
              padding: '12px 32px',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.5)',
              color: 'white',
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            restox.net
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
