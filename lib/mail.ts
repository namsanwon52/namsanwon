import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT ?? 587) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to,
    subject: '[남산원] 비밀번호 재설정 인증번호',
    text: `비밀번호 재설정 인증번호는 [${code}] 입니다. 5분 이내에 입력해주세요.`,
    html: `<p>비밀번호 재설정 인증번호는 <strong>${code}</strong> 입니다.</p><p>5분 이내에 입력해주세요.</p>`,
  })
}
