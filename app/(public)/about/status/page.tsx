import type { Metadata } from 'next'
import PageBanner from '@/components/namsanwon/PageBanner'

export const metadata: Metadata = { title: '현황' }

const STATUS_SECTIONS = [
  {
    title: '기관 현황',
    rows: [
      { label: '기관명', value: '사회복지법인 남산원' },
      { label: '설립연도', value: '1953년' },
      { label: '주소', value: '서울시 중구 소파로 2길 31' },
      { label: '정원', value: '아동 00명' },
    ],
  },
  {
    title: '아동 현황',
    rows: [
      { label: '총 아동 수', value: '현재 인원 입력 필요' },
      { label: '남아', value: '-' },
      { label: '여아', value: '-' },
    ],
  },
  {
    title: '직원 현황',
    rows: [
      { label: '총 직원 수', value: '현재 인원 입력 필요' },
      { label: '사회복지사', value: '-' },
      { label: '보육교사', value: '-' },
    ],
  },
]

export default function StatusPage() {
  return (
    <>
      <PageBanner
        title="현황"
        desc="남산원의 기관·아동·직원 현황을 안내해 드립니다."
        crumbs={['남산원소개', '현황']}
      />
      <div className="subContent">
        {STATUS_SECTIONS.map((section) => (
          <div key={section.title} className="sectionCard">
            <h2>{section.title}</h2>
            <table>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i}>
                    <th scope="row">{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </>
  )
}
