import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { TeamProvider } from '@/context/TeamContext'

export const metadata: Metadata = {
  title: 'HOLYWOOD — 多團隊排班與協作平台',
  description: '跨組織、多角色、短期任務型人力協作平台，適用影視製作、活動執行、場館支援、教會與非營利志工、臨時專案團隊',
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
