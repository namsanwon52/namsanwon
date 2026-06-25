import Link from 'next/link'

const CARDS = [
  {
    href: '/support/donation',
    title: '자동이체 정기후원(CMS)',
    desc: '매월 이어지는 따뜻한 나눔으로 안정적인 돌봄과 희망을 전해 주세요.',
    icon: '/namsanwon/icon-cms.png',
  },
  {
    href: '/support/volunteer',
    title: '자원봉사 안내',
    desc: '아이들의 건강한 성장과 행복한 일상을 위해 따뜻한 손길을 나누어 주세요.',
    icon: '/namsanwon/icon-volunteer.png',
  },
  {
    href: '/about/directions',
    title: '오시는 길',
    desc: '남산원을 찾아오시는 길을 안내해 드립니다.',
    icon: '/namsanwon/icon-map.png',
  },
]

export default function QuickAction() {
  return (
    <section className="quickAction" id="support" aria-label="빠른 후원 및 안내">
      {CARDS.map((card) => (
        <Link className="quickCard" href={card.href} key={card.title}>
          <span className="quickText">
            <strong>{card.title}</strong>
            <em>{card.desc}</em>
          </span>
          <span className="quickBottom">
            <span className="quickIcon" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.icon} alt="" />
            </span>
            <span className="viewMore" aria-hidden="true"></span>
          </span>
        </Link>
      ))}

      <Link className="quickCard quickCardPrimary" href="/support/donation">
        <span className="quickText">
          <strong>International Sponsorship</strong>
          <em>Support children&apos;s dreams and brighter futures from anywhere in the world.</em>
        </span>
        <span className="quickBottom">
          <span className="quickIcon" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/namsanwon/icon-global.svg" alt="" />
          </span>
          <span className="viewMore" aria-hidden="true"></span>
        </span>
      </Link>
    </section>
  )
}
