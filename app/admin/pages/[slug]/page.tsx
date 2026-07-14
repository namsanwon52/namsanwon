import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getManagedPage } from '@/lib/managed-pages'
import BlockForm from '../_blocks/BlockForm'
import BlockItem from '../_blocks/BlockItem'
import BlockPreview from '../_blocks/BlockPreview'

type Props = { params: Promise<{ slug: string }> }

export default async function AdminPageEdit({ params }: Props) {
  const { slug } = await params
  const meta = getManagedPage(slug)
  if (!meta) notFound()

  const blocks = await prisma.contentBlock.findMany({ where: { page: slug }, orderBy: { order: 'asc' } })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#3D2B1F]">{meta.title} 편집</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/pages" className="text-sm text-gray-500 hover:underline">
            ← 페이지 관리 목록
          </Link>
          <a
            href={meta.publicPath}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#E8863A] hover:underline"
          >
            공개 페이지 보기 ↗
          </a>
        </div>
      </div>

      <BlockForm page={slug} />

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">등록된 블럭이 없습니다.</p>
      )}

      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <BlockItem
            key={block.id}
            block={block}
            prev={idx > 0 ? { id: blocks[idx - 1].id, order: blocks[idx - 1].order } : undefined}
            next={idx < blocks.length - 1 ? { id: blocks[idx + 1].id, order: blocks[idx + 1].order } : undefined}
          />
        ))}
      </div>

      <div className="space-y-2 pt-4">
        <h2 className="text-lg font-bold text-[#3D2B1F]">미리보기</h2>
        <div className="rounded-xl overflow-hidden shadow-sm">
          <BlockPreview path={meta.publicPath} />
        </div>
      </div>
    </div>
  )
}
