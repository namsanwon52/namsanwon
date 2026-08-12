import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { ManagedPage } from '@/lib/managed-pages'
import BlockForm from './BlockForm'
import BlockItem from './BlockItem'
import BlockPreview from './BlockPreview'

export default async function PageBlockEditor({
  meta,
  listHref,
  listLabel,
}: {
  meta: ManagedPage
  listHref: string
  listLabel: string
}) {
  const blocks = await prisma.contentBlock.findMany({ where: { page: meta.slug }, orderBy: { order: 'asc' } })
  const imageOnly = meta.type === 'board'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1b1c1c]">{meta.title} 편집</h1>
        <div className="flex items-center gap-3">
          <Link href={listHref} className="text-sm text-gray-500 hover:underline">
            ← {listLabel}
          </Link>
          <a
            href={meta.publicPath}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#88b04b] hover:underline"
          >
            공개 페이지 보기 ↗
          </a>
        </div>
      </div>

      <BlockForm page={meta.slug} imageOnly={imageOnly} />

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          {imageOnly ? '등록된 서브이미지가 없습니다.' : '등록된 블럭이 없습니다.'}
        </p>
      )}

      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <BlockItem
            key={block.id}
            block={block}
            imageOnly={imageOnly}
            prev={idx > 0 ? { id: blocks[idx - 1].id, order: blocks[idx - 1].order } : undefined}
            next={idx < blocks.length - 1 ? { id: blocks[idx + 1].id, order: blocks[idx + 1].order } : undefined}
          />
        ))}
      </div>

      <div className="space-y-2 pt-4">
        <h2 className="text-lg font-bold text-[#1b1c1c]">미리보기</h2>
        <div className="rounded-xl overflow-hidden shadow-sm">
          <BlockPreview path={meta.publicPath} />
        </div>
      </div>
    </div>
  )
}
