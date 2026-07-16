import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'
import PageBlocks from '@/components/namsanwon/PageBlocks'

export const metadata: Metadata = { title: '오시는 길' }
export const dynamic = 'force-dynamic'

const iframeStyle: React.CSSProperties = {
  position : 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border:0,
};


  //반응형 레이아웃을 위한 스타일 정의
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
    overflow: 'hidden',
    border:'1px solid #ccc',
    borderRadius: '8px',
    maxHeight: '450px',
  };

export default function DirectionsPage() {
  return (
    <>
      <PageBanner
        title="오시는 길"
        desc="남산원을 찾아오시는 방법을 안내해 드립니다."
        crumbs={['남산원소개', '오시는 길']}
      />
     
      <div className="subContent">
<<<<<<< HEAD
          <div style={containerStyle}>
          <iframe src="https://www.google.com/maps/embed?pb=!1m5!3m3!1m2!1s0x357ca2fbd4336449%3A0xfeb7be3fc57a269b!2z7ISc7Jq47Yq567OE7IucIOykkeq1rCDshoztjIzroZwy6ri4IDMx!5e0!3m2!1sko!2skr!4v1783489845869!5m2!1sko!2skr" 
         style={iframeStyle} allowFullScreen={true} loading="lazy" referrerPolicy='no-referrer-when-downgrade' title='구글지도'></iframe>
         </div>
        <DbPageContent slug="directions" />
       
=======
        <PageBlocks page="directions" />
>>>>>>> origin/feature/slider-db-integration
      </div>
    </>
  )
}
