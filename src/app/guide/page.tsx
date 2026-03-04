'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export default function GuidePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    }
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', color: 'var(--body-text)' }}>
      <Navbar />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <h1
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '2.2rem',
            color: 'var(--warm-white)',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          使用說明
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '3rem' }}>
          以下說明本平台的常用功能與流程，讓你快速上手。
        </p>

        <article style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>

          {/* ── Section 1 ── */}
          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>01</div>
            <div>
              <h2 style={h2Style}>如何報名崗位</h2>
              <p>
                前往頁面頂端導覽列的「<strong style={{ color: 'var(--warm-white)' }}>排班表</strong>」，即可看到所有即將舉辦的場次。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                點選任一場次，展開後會列出該場次的所有崗位。找到你想服事的崗位，
                點擊「<strong style={{ color: 'var(--warm-white)' }}>報名</strong>」按鈕即可完成登記。
                若該崗位已有人報名，你仍可查看是誰負責。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                若想取消報名，再次點擊同一崗位的「取消」即可。報名狀態即時同步，
                所有團隊成員都能看到最新排班情況。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* ── Section 2 ── */}
          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>02</div>
            <div>
              <h2 style={h2Style}>如何登記可參與日期</h2>
              <p>
                點選導覽列的「<strong style={{ color: 'var(--warm-white)' }}>可參與日期</strong>」頁面，
                你可以提前告知管理員哪幾個場次你可以出席服事。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                系統會列出近期所有場次，你只需勾選自己方便的日期並送出即可。
                管理員在安排排班時，可參考這份可用清單，優先排入有空的成員。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                建議在每次排班截止日前完成填寫，以利管理員統籌安排。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* ── Section 3 ── */}
          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>03</div>
            <div>
              <h2 style={h2Style}>換班申請流程</h2>
              <p>
                若你已報名某場次的崗位，但臨時有事無法出席，可透過換班功能尋找接替人選。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                步驟如下：
              </p>
              <ol style={{ paddingLeft: '1.4rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>前往「<strong style={{ color: 'var(--warm-white)' }}>排班表</strong>」找到你報名的場次與崗位</li>
                <li>點擊「<strong style={{ color: 'var(--warm-white)' }}>申請換班</strong>」，選擇你希望換班的對象</li>
                <li>系統會通知對方，等待對方確認</li>
                <li>對方同意後，排班即自動更新；若對方拒絕，你可以重新選擇其他人</li>
              </ol>
              <p style={{ marginTop: '0.75rem' }}>
                換班申請發出後，你可以在「<strong style={{ color: 'var(--warm-white)' }}>我的排班</strong>」頁面追蹤申請狀態。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          {/* ── Section 4 ── */}
          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>04</div>
            <div>
              <h2 style={h2Style}>管理員功能</h2>
              <p>
                若你是團隊的 Admin 或 Owner，可進入「<strong style={{ color: 'var(--warm-white)' }}>管理後台</strong>」使用以下功能：
              </p>
              <ul style={{ paddingLeft: '1.4rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>
                  <strong style={{ color: 'var(--warm-white)' }}>新增場次</strong>
                  ：建立新的服事場次，設定日期、時間與類型（一般 / 特別聚會）
                </li>
                <li>
                  <strong style={{ color: 'var(--warm-white)' }}>編輯公告</strong>
                  ：為特定場次新增或修改公告，成員在排班表上即可看到
                </li>
                <li>
                  <strong style={{ color: 'var(--warm-white)' }}>成員管理</strong>
                  ：查看成員列表、調整權限、移除成員，或產生邀請連結邀請新成員加入
                </li>
                <li>
                  <strong style={{ color: 'var(--warm-white)' }}>崗位設定</strong>
                  ：自訂崗位名稱與順序，彈性對應不同聚會的服事需求
                </li>
              </ul>
              <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
                管理後台入口位於頂端導覽列，僅限 Admin 與 Owner 角色可見。
              </p>
            </div>
          </section>

        </article>

        <div style={{ marginTop: '4rem', padding: '1.5rem', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
            有其他問題？請聯絡你的團隊管理員，或在排班表的公告區留言。
          </p>
        </div>
      </main>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2.5rem 1fr',
  gap: '1rem',
  alignItems: 'start',
}

const sectionNumberStyle: React.CSSProperties = {
  fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '1.3rem',
  color: 'var(--gold)',
  lineHeight: 1.4,
  paddingTop: '0.15rem',
}

const h2Style: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--warm-white)',
  marginBottom: '0.6rem',
  letterSpacing: '0.02em',
}

const dividerStyle: React.CSSProperties = {
  height: '1px',
  background: 'var(--dark-border)',
  margin: '2rem 0',
}
