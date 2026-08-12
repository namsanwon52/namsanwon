import { notFound } from 'next/navigation'
import { getManagedPage } from '@/lib/managed-pages'
import PageBlockEditor from '../../pages/_blocks/PageBlockEditor'

type Props = { params: Promise<{ slug: string }> }

export default async function AdminBoardImageEdit({ params }: Props) {
  const { slug } = await params
  const meta = getManagedPage(slug)
  if (!meta || meta.type !== 'board') notFound()

  return <PageBlockEditor meta={meta} listHref="/admin/board-images" listLabel="게시판 이미지 관리 목록" />
}
