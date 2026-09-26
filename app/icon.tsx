import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

// Route segment config
export const runtime = 'nodejs'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/png;base64,${buffer.toString('base64')}`
    }
  } catch (e) {
    console.error('Failed to load logo.png for favicon:', e)
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
          background: '#0D0D0D',
          borderRadius: '50%',
          border: '1.5px solid #D4AF37',
          overflow: 'hidden',
          padding: 2,
        }}
      >
        {logoBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoBase64}
            alt="Yalı Logo"
            style={{
              width: '90%',
              height: '90%',
              objectFit: 'contain',
              filter: 'invert(1) drop-shadow(0px 0px 1px #D4AF37)',
            }}
          />
        ) : (
          <span
            style={{
              color: '#D4AF37',
              fontSize: 18,
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
