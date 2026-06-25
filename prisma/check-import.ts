import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImport() {
  try {
    const totalPosts = await prisma.post.count();

    // 카테고리별 통계
    const categories = [
      'nt1', 'nt2', 'nt3', 'nt4',
      'com1', 'com3',
      'liv1', 'liv2',
      'dus3'
    ];

    console.log('📊 SQL 임포트 결과\n');
    console.log(`총 게시물: ${totalPosts}개\n`);

    console.log('카테고리별 통계:');
    console.log('─'.repeat(50));

    const stats: { [key: string]: string } = {
      'nt1': '공지사항',
      'nt2': '예산',
      'nt3': '결산',
      'nt4': '법인',
      'com1': '자유게시판',
      'com3': '갤러리',
      'liv1': '아동생활',
      'liv2': '영아방',
      'dus3': '학교생활'
    };

    let totalByCategory = 0;
    for (const code of categories) {
      const count = await prisma.post.count({
        where: { code }
      });
      const name = stats[code];
      console.log(`${name.padEnd(12)} (${code}): ${count.toString().padStart(5)}개`);
      totalByCategory += count;
    }

    console.log('─'.repeat(50));
    console.log(`합계: ${totalByCategory}개\n`);

    if (totalPosts > 0) {
      console.log('✅ 임포트 성공!');
      const latest = await prisma.post.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      console.log(`\n최신 게시물: ${latest?.title.substring(0, 50)}...`);
    } else {
      console.log('❌ 임포트 실패: 데이터가 없습니다');
    }

  } catch (error) {
    console.error('❌ 확인 중 에러:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImport();
