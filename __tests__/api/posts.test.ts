import { prisma } from '@/lib/prisma'

describe('Post DB 로직', () => {
  beforeEach(async () => {
    await prisma.post.deleteMany({ where: { category: '__test__' } })
  })

  afterAll(async () => {
    await prisma.post.deleteMany({ where: { category: '__test__' } })
    await prisma.$disconnect()
  })

  it('게시글을 생성할 수 있다', async () => {
    const post = await prisma.post.create({
      data: {
        category: '__test__',
        title: '테스트 제목',
        content: '테스트 내용',
        author: '테스터',
      },
    })
    expect(post.title).toBe('테스트 제목')
    expect(post.views).toBe(0)
    expect(post.isAdmin).toBe(false)
  })

  it('카테고리로 게시글을 필터링할 수 있다', async () => {
    await prisma.post.createMany({
      data: [
        { category: '__test__', title: '테스트1', content: '', author: '작성자' },
        { category: 'notice', title: '공지글', content: '', author: '관리자' },
      ],
    })
    const posts = await prisma.post.findMany({ where: { category: '__test__' } })
    expect(posts.length).toBeGreaterThanOrEqual(1)
    expect(posts.every((p) => p.category === '__test__')).toBe(true)
  })

  it('조회수를 증가시킬 수 있다', async () => {
    const post = await prisma.post.create({
      data: { category: '__test__', title: '조회수 테스트', content: '', author: '작성자' },
    })
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    })
    expect(updated.views).toBe(1)
  })
})
