import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyPassword } from './hash'

// NEXTAUTH_SECRET 환경변수 검증
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다.')
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        })
        // 사용자가 없어도 bcrypt 연산 수행 (타이밍 공격 방지)
        const DUMMY_HASH = '$2b$10$dummy.hash.for.timing.attack.prevention.padding'
        const valid = admin
          ? await verifyPassword(credentials.password, admin.password)
          : await verifyPassword(credentials.password, DUMMY_HASH)

        if (!admin || !valid) return null
        return { id: String(admin.id), email: admin.email }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
