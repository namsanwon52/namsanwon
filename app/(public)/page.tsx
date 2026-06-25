import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ImageSlider from '@/components/home/ImageSlider'
import QuickLinks from '@/components/home/QuickLinks'
import RecentPostsSection from '@/components/home/RecentPostsSection'

export const revalidate = 600

const STATS = [
  { value: '1953', label: '설립연도', suffix: '년' },
  { value: '70+', label: '운영 연수', suffix: '년' },
  { value: '100+', label: '보호 아동', suffix: '명' },
  { value: '500+', label: '자원봉사', suffix: '명/년' },
]

export default async function HomePage() {
  const sliderImages = await prisma.sliderImage.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })

  return (
    <>
      {/* 히어로 슬라이더 */}
      <ImageSlider images={sliderImages} />

      {/* 임팩트 숫자 섹션 */}
      <section className="bg-[#3B9EDA]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {STATS.map((stat) => (
              <div key={stat.label} className="py-2">
                <p className="text-3xl md:text-4xl font-bold leading-none mb-1">
                  {stat.value}
                  <span className="text-lg font-normal opacity-80">{stat.suffix}</span>
                </p>
                <p className="text-sm text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 빠른 링크 */}
      <QuickLinks />

      {/* 기관소개 섹션 */}
      <section className="bg-[#EBF5FF] py-14 mt-2">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-[#3B9EDA] bg-white px-3 py-1 rounded-full mb-4 border border-[#3B9EDA]/20">
                About Us
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4 leading-snug">
                아이들의 밝은 미래를<br />
                함께 만들어갑니다
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm md:text-base">
                사회복지법인 남산원은 1953년 설립 이후 서울 남산 자락에서
                아동들의 건강한 성장과 자립을 지원해온 사회복지기관입니다.
                교육, 보육, 자립지원 등 다양한 프로그램으로 아이들이
                행복한 미래를 꿈꿀 수 있도록 돕고 있습니다.
              </p>
              <Link
                href="/about/greeting"
                className="inline-flex items-center gap-2 bg-[#3B9EDA] text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-[#1a6fa8] transition-all shadow-sm hover:shadow-md"
              >
                기관소개 보기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🎓', title: '교육지원', desc: '아동의 학습 능력 향상을 위한 체계적 교육 프로그램' },
                { icon: '🏡', title: '보육지원', desc: '안전하고 따뜻한 주거 환경과 생활 지원' },
                { icon: '🌱', title: '자립지원', desc: '사회 구성원으로 건강하게 자립할 수 있도록 지원' },
                { icon: '❤️', title: '후원·봉사', desc: '지역사회와 함께하는 후원 및 자원봉사 활동' },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-4 shadow-sm border border-white">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 최근 소식 */}
      <div className="py-10">
        <RecentPostsSection />
      </div>

      {/* 후원 유도 배너 */}
      <section className="bg-[#FF7A59] py-14">
        <div className="max-w-6xl mx-auto px-4 text-center text-white">
          <p className="text-sm font-medium opacity-80 mb-2 tracking-wide uppercase">Support Us</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">
            함께라면 더 많은 아이들을<br />
            도울 수 있습니다
          </h2>
          <p className="text-white/80 mb-8 text-sm md:text-base">
            여러분의 소중한 후원이 아이들의 꿈이 됩니다.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/support/donation"
              className="bg-white text-[#FF7A59] font-bold px-8 py-3.5 rounded-full text-sm hover:bg-orange-50 transition-all shadow-md hover:shadow-lg"
            >
              후원하기
            </Link>
            <Link
              href="/support/volunteer"
              className="border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-white/10 transition-all"
            >
              자원봉사 신청
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
