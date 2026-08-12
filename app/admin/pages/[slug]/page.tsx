import { notFound } from 'next/navigation'
import { getManagedPage } from '@/lib/managed-pages'
import PageBlockEditor from '../_blocks/PageBlockEditor'

type Props = { params: Promise<{ slug: string }> }

export default async function AdminPageEdit({ params }: Props) {
  const { slug } = await params
  const meta = getManagedPage(slug)
  if (!meta || meta.type !== 'content') notFound()

  return <PageBlockEditor meta={meta} listHref="/admin/pages" listLabel="페이지 관리 목록" />
}
