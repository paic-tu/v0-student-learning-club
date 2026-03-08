import { ImageResponse } from 'next/og'

export const runtime = 'edge'

// Image metadata
export const alt = 'Neon | نيون التعليمية'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image({ params }: { params: { lang: string } }) {
  // const isAr = params.lang === 'ar'
  // Getting lang from params might be tricky in some Next.js versions for opengraph-image 
  // if it's not strictly passed down, but usually it works in [lang] folder.
  // We'll try to infer or just use a bilingual design.
  
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(to bottom right, #09090b, #18181b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            }}
        />
        
        {/* Logo/Icon */}
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 40,
        }}>
             <div style={{ 
                 width: '120px', 
                 height: '120px', 
                 borderRadius: '30px', 
                 background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 fontSize: '70px',
                 fontWeight: 'bold',
                 boxShadow: '0 20px 50px rgba(139, 92, 246, 0.3)',
                 color: 'white'
             }}>N</div>
        </div>

        {/* Title */}
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', 
            gap: '10px' 
        }}>
            <div style={{ 
                fontSize: 80, 
                fontWeight: 900, 
                textAlign: 'center', 
                background: 'linear-gradient(to right, #fff, #cbd5e1)', 
                backgroundClip: 'text', 
                color: 'transparent',
                lineHeight: 1.1
            }}>
              Neon Platform
            </div>
            <div style={{ 
                fontSize: 60, 
                fontWeight: 700, 
                textAlign: 'center', 
                color: '#94a3b8',
                marginTop: 10
            }}>
              نيون التعليمية
            </div>
        </div>

        {/* Tagline */}
        <div style={{ 
            marginTop: 40, 
            fontSize: 32, 
            color: '#64748b', 
            textAlign: 'center', 
            maxWidth: '80%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
          <span>Empowering Your Future with Tech Skills</span>
          <span style={{ marginTop: 10 }}>تمكين مستقبلك بالمهارات التقنية</span>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
