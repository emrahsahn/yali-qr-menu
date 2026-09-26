import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/png;base64,${buffer.toString('base64')}`
    }
  } catch (e) {
    console.error('Failed to load logo.png for apple icon:', e)
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1A1612 0%, #0D0D0D 100%)',
          borderRadius: 40,
          border: '4px solid #D4AF37',
          padding: 16,
          boxShadow: '0 8px 32px rgba(185, 138, 74, 0.3)',
        }}
      >
        {logoBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoBase64}
            alt="Yalı"
            style={{
              width: '85%',
              height: '85%',
              objectFit: 'contain',
              filter: 'invert(1) drop-shadow(0 2px 8px rgba(212, 175, 55, 0.4))',
            }}
          />
        ) : (
          <span
            style={{
              color: '#D4AF37',
              fontSize: 90,
              fontWeight: 900,
              fontFamily: 'serif',
            }}
          >
            Y
          </span>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}
