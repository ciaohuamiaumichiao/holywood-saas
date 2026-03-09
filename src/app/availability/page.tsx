'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'

export default function AvailabilityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  if (authLoading || !user) return null

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '0.7rem' }}>
          功能整併說明
        </h1>
        <div style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: 14, padding: '1.3rem 1.4rem' }}>
          <p style={{ color: 'var(--body-text)', fontSize: '0.92rem', lineHeight: 1.9, margin: 0 }}>
            原本的「可參與日期 / 時段意願」流程已從主系統拿掉，避免活動與 slot 兩套模型並行造成資料不一致。
            現在請直接到排班表加入活動角色，系統會以活動需求作為唯一主流程。
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: '0.9rem 0 0' }}>
            這樣做的目的是提高穩定性，讓管理員與成員看到的是同一套資料來源，年度回顧也會依照同一套活動參與紀錄累積。
          </p>
          <div style={{ marginTop: '1.1rem' }}>
            <Link
              href="/schedule"
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.1rem',
                background: 'var(--gold)',
                color: 'var(--black)',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              前往排班表
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
