'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { DEMO_TEAM_LIMIT } from '@/lib/demo-config'

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

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
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
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.8 }}>
          HOLYWOOD 的核心流程是：先管理自己的團隊與活動，再把平時的排班與支援軌跡累積成年度回顧；必要時再把不同團隊拉進聯合群組協作。你可以把它理解成一個跨組織、多角色、短期任務型的人力協作平台。
        </p>
        <div style={{
          marginBottom: '3rem',
          padding: '1rem 1.1rem',
          border: '1px solid var(--dark-border)',
          background: 'var(--dark-surface)',
          fontSize: '0.84rem',
          color: 'var(--muted)',
          lineHeight: 1.8,
        }}>
          適用場景可擴到影視製作、活動執行、場館支援、教會 / 非營利志工、臨時專案團隊，也包含像偏鄉小學教學計畫這種時間與地點分散、但人力是同一批志工的任務型團隊。同一個帳號也可以同時加入很多個團隊，在不同團隊中保有不同角色。
        </div>
        <div style={{
          marginBottom: '3rem',
          padding: '1rem 1.1rem',
          border: '1px solid rgba(200,164,85,0.22)',
          background: 'rgba(200,164,85,0.08)',
          fontSize: '0.84rem',
          color: 'var(--muted)',
          lineHeight: 1.8,
        }}>
          DEMO 版每個帳號最多可建立 {DEMO_TEAM_LIMIT} 個團隊。若需要更多團隊，請洽管理員協助開通。
        </div>

        <article style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>
          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>01</div>
            <div>
              <h2 style={h2Style}>建立與切換團隊</h2>
              <p>
                第一次登入後，可前往
                {' '}
                <Link href="/onboarding" style={inlineLinkStyle}>
                  建立團隊
                </Link>
                {' '}
                建立自己的 team。建立者會自動成為該團隊的
                <strong style={{ color: 'var(--warm-white)' }}> Owner </strong>
                。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                之後可到
                {' '}
                <Link href="/teams" style={inlineLinkStyle}>
                  我的團隊
                </Link>
                {' '}
                查看你建立或加入的所有團隊，並切換目前使用中的 team。系統所有資料操作都以「目前團隊」為準。
              </p>
              <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
                DEMO 版每個帳號最多可建立 {DEMO_TEAM_LIMIT} 個自己擁有的團隊，但仍可加入其他人邀請你的團隊。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>02</div>
            <div>
              <h2 style={h2Style}>邀請自己的團隊成員加入</h2>
              <p>
                若你是團隊的 Owner 或 Admin，可進入
                {' '}
                <Link href="/admin" style={inlineLinkStyle}>
                  管理後台
                </Link>
                {' '}
                的成員管理頁籤，產生團隊邀請連結。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                把這個連結傳給需要排班的夥伴，對方點擊後就會加入你的 team。這只會影響他在這個團隊裡的身份，不會改變他在其他團隊的角色。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>03</div>
            <div>
              <h2 style={h2Style}>先建立活動，讓排班歷程自然累積</h2>
              <p>
                建議先到
                {' '}
                <Link href="/admin" style={inlineLinkStyle}>
                  管理後台
                </Link>
                {' '}
                建立活動。活動是主流程，方便先把日期、標題與說明定義清楚，之後成員就能在排班表上參與與支援。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                建立活動後，後續成員在排班表上的參與、取消與換班紀錄，會逐步累積到年度回顧。管理頁目前先聚焦在活動、成員與團隊設定，不再把流程推向較重的進階配置。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>04</div>
            <div>
              <h2 style={h2Style}>如果你是偏鄉小學教學計畫</h2>
              <p>
                建議把整個計畫建立成一個 team，角色可設為
                <strong style={{ color: 'var(--warm-white)' }}> 主教老師、助教老師、行政窗口、交通支援 </strong>
                等。這樣每次上課時，就能直接知道這堂課目前有哪些老師會出現。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                每一堂課都可建立成一個活動，例如「桃源國小閱讀課」或「瑞峰國小自然課」。若目前沒有獨立的地點欄位，可先把學校名稱放在活動標題，把集合點、教材提醒、帶隊窗口與注意事項寫在活動說明，當成這次行前 note。
              </p>
              <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
                這種場景最適合用來回答兩件事：這次會有哪些老師出現？這堂課出發前有什麼提醒要一起看到？
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>05</div>
            <div>
              <h2 style={h2Style}>建立聯合群組</h2>
              <p>
                當兩個團隊要一起完成同一場活動、專案或現場任務時，請先切到要代表操作的 team，然後前往
                {' '}
                <Link href="/workspaces" style={inlineLinkStyle}>
                  聯合群組
                </Link>
                {' '}
                頁面建立新的合作空間。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                在建立時可填入聯合群組名稱與合作目的，例如「母親節特別聚會聯合作業」或「巡迴工作坊影像 x 招待協作」。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>06</div>
            <div>
              <h2 style={h2Style}>邀請合作團隊加入聯合群組</h2>
              <p>
                在聯合群組列表裡，可對某個 workspace 產生合作邀請。把這個連結交給另一個團隊的 Owner 或 Admin。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                對方要先切到自己要代表加入的團隊，再用邀請碼加入。加入後，兩個 team 都會出現在同一個聯合群組中，並共享同一份合作資訊。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>07</div>
            <div>
              <h2 style={h2Style}>共享說明、查看聯合時程總覽與衝突</h2>
              <p>
                聯合群組頁面可維護
                <strong style={{ color: 'var(--warm-white)' }}> 共享說明 </strong>
                ，把雙方都要知道的現場 brief、分工、流程與注意事項集中管理。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                聯合群組也會彙整各團隊的時程，讓你看到同一個人在不同團隊是否剛好被排到重疊時段。這個頁面是
                <strong style={{ color: 'var(--warm-white)' }}> 協調用總覽 </strong>
                ，不是跨團隊直接改派班表的地方。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                真正的排班調整仍回到各自團隊的
                {' '}
                <Link href="/schedule" style={inlineLinkStyle}>
                  排班表
                </Link>
                {' '}
                與
                {' '}
                <Link href="/availability" style={inlineLinkStyle}>
                  可參與日期
                </Link>
                {' '}
                頁面操作。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>08</div>
            <div>
              <h2 style={h2Style}>年度回顧與遊戲化資料</h2>
              <p>
                前往
                {' '}
                <Link href="/year-review" style={inlineLinkStyle}>
                  年度回顧
                </Link>
                {' '}
                ，可查看這一年團隊累積了多少排班、總服務時數、成功換班數，以及每個成員的主要崗位分布。
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                系統會把平時的參與、取消、換班與支援軌跡整理成積分與 badge，例如出勤之星、多面手、救援王、穩定同行等，方便你在年末回顧時看見每個人的投入。
              </p>
              <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
                舊的排班資料會納入年度總量統計；新的報名與取消動作則會開始累積更完整的歷程時間線。
              </p>
            </div>
          </section>

          <div style={dividerStyle} />

          <section style={sectionStyle}>
            <div style={sectionNumberStyle}>09</div>
            <div>
              <h2 style={h2Style}>角色與管理權限</h2>
              <p>每個 team 的角色分成三種：</p>
              <ul style={{ paddingLeft: '1.4rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><strong style={{ color: 'var(--warm-white)' }}>Owner</strong>：建立團隊、管理成員、調整權限、建立聯合群組。</li>
                <li><strong style={{ color: 'var(--warm-white)' }}>Admin</strong>：協助管理排班、邀請成員、加入或維護聯合群組。</li>
                <li><strong style={{ color: 'var(--warm-white)' }}>Member</strong>：查看排班、登記可參與日期、在已加入的團隊或聯合群組中閱讀共享資訊。</li>
              </ul>
              <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
                角色是 team scope。同一個人在不同 team 裡可以有不同權限。
              </p>
            </div>
          </section>
        </article>

        <div style={{ marginTop: '4rem', padding: '1.5rem', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', margin: 0, lineHeight: 1.8 }}>
            如果你要代表不同團隊加入不同合作空間，記得先到「我的團隊」切換目前使用中的 team，再進行邀請或加入操作。
          </p>
        </div>
      </main>
    </div>
  )
}

const inlineLinkStyle = {
  color: 'var(--warm-white)',
  textDecoration: 'none',
  borderBottom: '1px solid transparent',
}

const sectionStyle = {
  display: 'grid',
  gridTemplateColumns: '2.5rem 1fr',
  gap: '1rem',
  alignItems: 'start',
}

const sectionNumberStyle = {
  fontFamily: 'Bebas Neue, sans-serif',
  fontSize: '1.3rem',
  color: 'var(--gold)',
  lineHeight: 1.4,
  paddingTop: '0.15rem',
}

const h2Style = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--warm-white)',
  marginBottom: '0.6rem',
  letterSpacing: '0.02em',
}

const dividerStyle = {
  height: '1px',
  background: 'var(--dark-border)',
  margin: '2rem 0',
}
