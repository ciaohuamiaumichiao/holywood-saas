import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { TeamProvider } from '@/context/TeamContext'

export const metadata: Metadata = {
  title: 'HOLYWOOD — 影視排班平台',
  description: '專為影視服事團隊打造的 SaaS 排班系統',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          <TeamProvider>
            {children}
          </TeamProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
