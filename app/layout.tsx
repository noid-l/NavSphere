import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'NavSphere',
  description: '基于 Next.js 与 Supabase 的开发者项目导航站',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
