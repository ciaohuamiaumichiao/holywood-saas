'use client'

import Link from 'next/link'

const DEMO_URL = '/login'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', fontFamily: 'Noto Sans TC, sans-serif' }}>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--dark-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 56, padding: '0 1.5rem',
      }}>
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', letterSpacing: '0.15em', color: 'var(--warm-white)' }}>
          HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
        </span>
        <Link href={DEMO_URL} style={{
          background: 'var(--gold)', color: 'var(--black)',
          padding: '0.4rem 1rem',
          fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.85rem', letterSpacing: '0.15em',
          textDecoration: 'none',
        }}>
          免費試用
        </Link>
      </nav>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.5rem' }}>
        <section style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '4rem 0',
        }}>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1rem' }}>
            跨組織、多角色、短期任務型人力協作平台
          </p>
          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            letterSpacing: '0.15em', color: 'var(--warm-white)', lineHeight: 1, marginBottom: '1rem',
          }}>
            HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'var(--muted)', letterSpacing: '0.15em', fontFamily: 'Bebas Neue, sans-serif', marginBottom: '0.8rem' }}>
            適用影視製作、活動執行、場館支援、教會/非營利志工與臨時專案團隊
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--body-text)', maxWidth: 620, lineHeight: 1.9, marginBottom: '2.5rem' }}>
            建立自己的團隊、邀請成員加入、分派 Owner / Admin / Member 權限。<br />
            先用活動管理日常工作，讓大家在排班表上的參與、取消與支援軌跡逐步累積成年度回顧。像偏鄉小學教學計畫這種時間分散、地點分散、但志工固定的團隊，也能把每次課程當活動管理，清楚知道這次會有哪些主教老師與助教老師出席，並在說明欄留下集合點、教材與提醒 note；當不同團隊要一起完成同一場活動或專案時，再開一個聯合群組，集中共享合作目的、現場 brief 與跨團隊協作資訊。
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href={DEMO_URL} style={{
              background: 'var(--gold)', color: 'var(--black)',
              padding: '0.9rem 2.5rem',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.2em',
              textDecoration: 'none',
            }}>
              立即免費試用
            </Link>
            <a href="#features" style={{
              background: 'transparent', color: 'var(--warm-white)',
              border: '1px solid var(--dark-border)',
              padding: '0.9rem 2rem',
              fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.2em',
              textDecoration: 'none',
            }}>
              了解功能
            </a>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.55rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 760,
            marginTop: '1.2rem',
          }}>
            {[
              '影視製作',
              '活動執行',
              '場館支援',
              '教會 / 非營利志工',
              '臨時專案團隊',
              '偏鄉教學計畫',
            ].map((label) => (
              <span
                key={label}
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--muted)',
                  padding: '0.28rem 0.6rem',
                  border: '1px solid var(--dark-border)',
                  background: 'rgba(255,255,255,0.02)',
                  letterSpacing: '0.06em',
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '1.5rem', letterSpacing: '0.08em' }}>
            免費開始 · 不需信用卡 · 30 秒建立第一個團隊 · DEMO 版每帳號最多建立 3 個團隊
          </p>
        </section>

        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px', background: 'var(--dark-border)',
          border: '1px solid var(--dark-border)', marginBottom: '6rem',
        }}>
          {[
            { num: '30秒', label: '建立第一個團隊' },
            { num: '年度回顧', label: '累積參與與支援軌跡' },
            { num: '跨團隊', label: '聯合總覽看衝突' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'var(--dark-surface)', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.1em', color: 'var(--gold)' }}>{stat.num}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.3rem' }}>{stat.label}</div>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader
            tag="使用場景"
            title="從影視製作到偏鄉教學，都能套用同一套流程"
            desc="HOLYWOOD 的核心不是單一產業排班，而是跨組織、多角色、短期任務型的人力協作。影視製作、活動執行、場館支援、教會/非營利志工、臨時專案團隊，甚至偏鄉小學教學計畫，都能用相同邏輯管理人力。"
          />
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
            {[
              '影視製作',
              '活動執行',
              '場館支援',
              '教會 / 非營利志工',
              '臨時專案團隊',
            ].map((label) => (
              <span key={label} style={{ fontSize: '0.68rem', color: 'var(--gold-light)', border: '1px solid rgba(200,164,85,0.22)', padding: '0.28rem 0.6rem', background: 'rgba(200,164,85,0.06)' }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            alignItems: 'stretch',
          }}>
            <div style={{
              border: '1px solid var(--dark-border)',
              background: 'var(--dark-surface)',
              padding: '1.4rem 1.3rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--gold)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  場景示例
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--warm-white)' }}>山光偏鄉閱讀教學團</div>
              </div>
              {[
                '把「桃源國小閱讀課」或「瑞峰國小自然課」各自建立成活動。',
                '把角色改成主教老師、助教老師、行政窗口或交通支援。',
                '用活動說明留下集合地點、教材提醒、窗口電話與注意事項。',
                '出班前快速看見這次有哪些老師確定出席，避免臨時漏接。',
              ].map((item) => (
                <div key={item} style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.8, display: 'flex', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--gold)' }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <MockTeachingPlan />
          </div>
        </section>

        <section id="features" style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="功能特色" title="從團隊活動管理，延伸到年度回顧與跨團隊協作" desc="先把每個 team 的權限、活動與成員管理做好，再讓每一次排班與支援逐步累積成可回顧的量化資料。" />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1px', background: 'var(--dark-border)', border: '1px solid var(--dark-border)',
          }}>
            {FEATURES.map((feature) => (
              <div key={feature.title} style={{ background: 'var(--dark-surface)', padding: '2rem', transition: 'background 0.2s' }}
                onMouseEnter={(event) => { (event.currentTarget as HTMLDivElement).style.background = 'rgba(200,164,85,0.04)' }}
                onMouseLeave={(event) => { (event.currentTarget as HTMLDivElement).style.background = 'var(--dark-surface)' }}
              >
                <div style={{ marginBottom: '0.8rem' }}>
                  <LineIcon type={feature.icon} />
                </div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--warm-white)', marginBottom: '0.5rem', fontWeight: 500 }}>{feature.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.8 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="操作截圖" title="先看活動，再讓排班歷程自然累積" desc="活動是主流程；成員在排班表上的參與、取消與支援軌跡，會逐步累積到年度回顧。" />
          <MockSchedule />
        </section>

        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="年度回顧" title="把大家一年來的參與軌跡量化呈現" desc="年底不只知道誰來過，而是能回看每個人排了幾次班、主要在哪些崗位出現、支援了幾次換班。" />
          <MockYearReview />
        </section>

        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="管理員介面" title="團隊權限與成員管理" desc="Owner 可建立團隊並邀請自己的成員加入，也可指派 Admin 協助管理與排班。" />
          <MockAdmin />
        </section>

        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="聯合作業" title="需要跨團隊時，再開聯合群組" desc="A 團隊與 B 團隊不必合併資料，也能在同一個合作空間裡共享分工、聯合時程總覽與共同 brief。" />
          <MockWorkspace />
        </section>

        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="成員自主登記" title="可參與日期一鍵勾選" desc="成員可先登記自己可參與的活動時段，管理者更容易安排人力，之後也能在年度回顧裡看見長期參與軌跡。" />
          <MockAvailability />
        </section>

        <section id="how" style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="使用流程" title="五步驟開始協作與累積回顧" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {STEPS.map((step, index) => (
              <div key={step.title} style={{ padding: '2rem 1.5rem', border: '1px solid var(--dark-border)', position: 'relative' }}>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem',
                  color: 'rgba(200,164,85,0.15)', position: 'absolute', top: '1rem', right: '1.25rem',
                }}>
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <CircleNumber index={index + 1} />
                </div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--warm-white)', marginBottom: '0.4rem', fontWeight: 500 }}>{step.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.8 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{
          textAlign: 'center', padding: '5rem 2rem',
          border: '1px solid var(--dark-border)', marginBottom: '4rem',
          background: 'linear-gradient(135deg, rgba(200,164,85,0.04) 0%, transparent 60%)',
        }}>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1rem' }}>開始使用</p>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '1rem' }}>
            先建立你的團隊，再把合作團隊接進來
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            從自己的 team 開始，先建立活動與成員名單；平時就讓排班與支援軌跡持續累積。等到有大型活動、跨據點任務或多單位專案時，再用聯合群組把資訊串起來。
          </p>
          <Link href={DEMO_URL} style={{
            display: 'inline-block',
            background: 'var(--gold)', color: 'var(--black)',
            padding: '1rem 3rem',
            fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.2em',
            textDecoration: 'none',
          }}>
            進入 DEMO 系統
          </Link>
          <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '1rem', letterSpacing: '0.05em' }}>
            用 Google 帳號登入 · 完全免費 · DEMO 版每帳號最多建立 3 個團隊
          </p>
        </section>
      </div>

      <footer style={{ borderTop: '1px solid var(--dark-border)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
          HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span> · 多團隊排班與聯合作業平台
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>v1.2 · 為影視製作、活動執行、場館支援、教會/非營利志工與臨時專案團隊打造</p>
      </footer>
    </div>
  )
}

function SectionHeader({ tag, title, desc }: { tag: string; title: string; desc?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{tag}</p>
      <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '0.1em', color: 'var(--warm-white)', marginBottom: desc ? '0.75rem' : 0 }}>
        {title}
      </h2>
      {desc && <p style={{ fontSize: '0.88rem', color: 'var(--muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.9 }}>{desc}</p>}
    </div>
  )
}

function LineIcon({ type }: { type: string }) {
  const common = { width: 26, height: 26, stroke: 'var(--gold)', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  switch (type) {
    case 'grid':
      return <svg {...common} viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>
    case 'sliders':
      return <svg {...common} viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6" /><circle cx="10" cy="6" r="2" /><line x1="4" y1="12" x2="20" y2="12" /><circle cx="14" cy="12" r="2" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="8" cy="18" r="2" /></svg>
    case 'zap':
      return <svg {...common} viewBox="0 0 24 24"><polyline points="13 2 4 14 12 14 11 22 20 10 12 10 13 2" /></svg>
    case 'swap':
      return <svg {...common} viewBox="0 0 24 24"><polyline points="16 3 21 3 21 8" /><polyline points="8 21 3 21 3 16" /><line x1="21" y1="3" x2="10" y2="14" /><line x1="3" y1="21" x2="14" y2="10" /></svg>
    case 'calendar':
      return <svg {...common} viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><line x1="4" y1="9" x2="20" y2="9" /><line x1="9" y1="3" x2="9" y2="7" /><line x1="15" y1="3" x2="15" y2="7" /><rect x="8" y="12" width="3" height="3" fill="var(--gold)" stroke="none" /><rect x="13" y="12" width="3" height="3" fill="var(--gold)" stroke="none" /></svg>
    case 'link':
      return <svg {...common} viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5" /><path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.1a5 5 0 0 0 7.07 7.07L13.1 18" /></svg>
    default:
      return <svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
  }
}

function CircleNumber({ index }: { index: number }) {
  const label = String(index).padStart(2, '0')
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      <circle cx="21" cy="21" r="20" stroke="var(--dark-border)" strokeWidth="1.2" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="Bebas Neue, sans-serif" fontSize="14" letterSpacing="2" fill="var(--gold)">
        {label}
      </text>
    </svg>
  )
}

function MockNavbar({ active }: { active: string }) {
  return (
    <div style={{ background: 'var(--nav-bg-strong)', borderBottom: '1px solid var(--dark-border)', height: 44, display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '1.5rem' }}>
      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.15em', color: 'var(--warm-white)' }}>
        HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
      </span>
      {['排班表', '我的排班', '年度回顧', '聯合群組', '管理'].map((label) => (
        <span key={label} style={{ fontSize: '0.65rem', color: label === active ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gold)', background: 'rgba(200,164,85,0.1)', border: '1px solid rgba(200,164,85,0.2)', padding: '0.15rem 0.5rem' }}>HOLYWOOD 團隊</span>
    </div>
  )
}

function MockSchedule() {
  const roles = ['導播', 'AD', '攝影師 1', '攝影師 2', '網路直播', '平面攝影']
  const assigned: Record<string, string> = { '導播': '王大明', '攝影師 1': '林小花', '網路直播': '陳志遠' }

  return (
    <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark-surface)', overflow: 'hidden' }}>
      <MockNavbar active="排班表" />
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: 'var(--warm-white)', letterSpacing: '0.12em', marginBottom: '1rem' }}>排班表</div>
        <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark)', marginBottom: '0.75rem' }}>
          <div style={{ borderBottom: '1px solid var(--dark-border)', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.88rem', color: 'var(--warm-white)', letterSpacing: '0.1em' }}>4/5（六）</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>週六服事</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>14:00–17:00</span>
          </div>
          {roles.map((role, index) => (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 1rem',
              borderBottom: index < roles.length - 1 ? '1px solid rgba(42,42,42,0.5)' : 'none',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', width: 76 }}>{role}</span>
              {assigned[role] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'var(--muted)' }}>
                    {assigned[role][0]}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--warm-white)' }}>{assigned[role]}</span>
                  {role !== '導播' && (
                    <span style={{ fontSize: '0.6rem', color: 'var(--muted)', marginLeft: 4, background: 'rgba(42,42,42,0.8)', padding: '0.1rem 0.35rem' }}>申請換班</span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontStyle: 'italic' }}>— 空缺 —</span>
                  <button style={{ fontSize: '0.62rem', background: 'rgba(200,164,85,0.08)', border: '1px solid rgba(200,164,85,0.25)', color: 'var(--gold)', padding: '0.15rem 0.45rem', cursor: 'pointer' }}>
                    報名
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {['◈ 點「報名」自主搶位', '⇌ 可對隊友申請換班', '● 即時同步'].map((tip) => (
            <span key={tip} style={{ fontSize: '0.68rem', color: 'var(--muted)' }}><span style={{ color: 'var(--gold)' }}>{tip[0]}</span>{tip.slice(1)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockAdmin() {
  return (
    <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark-surface)', overflow: 'hidden' }}>
      <MockNavbar active="管理" />
      <div style={{ borderBottom: '1px solid var(--dark-border)', display: 'flex', padding: '0 1.5rem' }}>
        {['排班管理', '成員管理', '團隊設定'].map((tab, index) => (
          <div key={tab} style={{
            padding: '0.65rem 1.1rem', fontSize: '0.75rem', letterSpacing: '0.08em', cursor: 'pointer',
            color: index === 1 ? 'var(--gold)' : 'var(--muted)',
            borderBottom: index === 1 ? '2px solid var(--gold)' : '2px solid transparent',
          }}>
            {tab}
          </div>
        ))}
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', color: 'var(--warm-white)', letterSpacing: '0.1em', marginBottom: '1rem' }}>成員列表</div>
        {[
          { name: '王大明', role: 'owner', email: 'david@example.com' },
          { name: '林小花', role: 'admin', email: 'lily@example.com' },
          { name: '陳志遠', role: 'member', email: 'peter@example.com' },
        ].map((member) => (
          <div key={member.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--dark-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--muted)' }}>
                {member.name[0]}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{member.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{member.email}</div>
              </div>
            </div>
            <span style={{
              fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.18rem 0.45rem',
              background: member.role !== 'member' ? 'rgba(200,164,85,0.12)' : 'rgba(42,42,42,0.5)',
              color: member.role !== 'member' ? 'var(--gold)' : 'var(--muted)',
              border: member.role !== 'member' ? '1px solid rgba(200,164,85,0.25)' : '1px solid var(--dark-border)',
            }}>
              {member.role}
            </span>
          </div>
        ))}
        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--dark)', border: '1px solid var(--dark-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>團隊邀請連結（7 天有效）</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: '0.68rem', color: 'var(--muted)', fontFamily: 'monospace', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', padding: '0.35rem 0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              https://holywood.app/join/abc123?team=xxx
            </div>
            <button style={{ fontSize: '0.68rem', background: 'rgba(200,164,85,0.1)', border: '1px solid rgba(200,164,85,0.3)', color: 'var(--gold)', padding: '0.35rem 0.65rem', cursor: 'pointer' }}>複製</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockWorkspace() {
  return (
    <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark-surface)', overflow: 'hidden' }}>
      <MockNavbar active="聯合群組" />
      <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: 'var(--warm-white)', letterSpacing: '0.12em' }}>母親節特別聚會聯合作業</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.35rem', marginBottom: 0, lineHeight: 1.7 }}>
              A 團隊負責影像與直播，B 團隊負責招待、報到與現場動線。雙方共用一份合作 brief。
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold)', background: 'rgba(200,164,85,0.08)', border: '1px solid rgba(200,164,85,0.22)', padding: '0.35rem 0.65rem' }}>
            已連結 2 個團隊
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { team: 'HOLYWOOD 影視', by: 'Owner 王大明' },
            { team: 'CITY CARE 招待組', by: 'Admin 李佩珊' },
          ].map((item) => (
            <div key={item.team} style={{ border: '1px solid var(--dark-border)', background: 'var(--dark)', padding: '0.7rem 0.8rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{item.team}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{item.by} 加入</div>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark)', padding: '0.85rem 0.95rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>共享說明</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--body-text)', lineHeight: 1.8, margin: 0 }}>
            16:00 開始進場，影像組 15:00 完成機位架設；招待組 15:30 到位。直播測試與現場動線表統一以這份 brief 為準。
          </p>
        </div>

        <div style={{ border: '1px solid rgba(200,164,85,0.22)', background: 'rgba(200,164,85,0.06)', padding: '0.85rem 0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>聯合時程總覽</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warm-white)' }}>同一人員在兩個團隊的時段重疊時，系統會標記衝突提醒雙方協調。</div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--gold)', border: '1px solid rgba(200,164,85,0.28)', padding: '0.25rem 0.55rem' }}>
              衝突 1 筆
            </span>
          </div>
        </div>

        <div style={{ padding: '0.85rem', background: 'rgba(200,164,85,0.06)', border: '1px solid rgba(200,164,85,0.22)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>合作邀請連結</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: '0.68rem', color: 'var(--gold-light)', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--dark-border)', padding: '0.35rem 0.6rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              https://holywood.app/workspaces?invite=ws-9c18ab
            </div>
            <button style={{ fontSize: '0.68rem', background: 'rgba(200,164,85,0.12)', border: '1px solid rgba(200,164,85,0.3)', color: 'var(--gold)', padding: '0.35rem 0.65rem', cursor: 'pointer' }}>複製</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MockAvailability() {
  const sessions = [
    { date: '4/5（六）', title: '週六服事', time: '14:00–17:00', checked: true },
    { date: '4/12（六）', title: '週六服事', time: '14:00–17:00', checked: false },
    { date: '4/19（六）', title: '週六服事', time: '14:00–17:00', checked: true },
    { date: '4/26（六）', title: '特別聚會', time: '10:00–13:00', checked: false },
  ]
  return (
    <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark-surface)', overflow: 'hidden' }}>
      <MockNavbar active="可參與日期" />
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: 'var(--warm-white)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>可參與日期</div>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>請勾選你可以參與的場次，管理員會依此安排位置。勾選後即時儲存。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {sessions.map((session) => (
            <div key={session.date} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.8rem 1rem',
              background: session.checked ? 'rgba(200,164,85,0.06)' : 'var(--dark)',
              border: `1px solid ${session.checked ? 'rgba(200,164,85,0.4)' : 'var(--dark-border)'}`,
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: session.checked ? 'var(--gold)' : 'var(--warm-white)', marginBottom: '0.1rem' }}>
                  {session.date}　{session.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{session.time}</div>
              </div>
              <div style={{
                width: 20, height: 20,
                border: `1.5px solid ${session.checked ? 'var(--gold)' : 'var(--dark-border)'}`,
                background: session.checked ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {session.checked && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.75rem' }}>已登記 2 場</p>
      </div>
    </div>
  )
}

function MockTeachingPlan() {
  const lessons = [
    {
      date: '4/18（六）',
      title: '桃源國小閱讀課',
      meta: '08:30 集合 · 桃源國小圖書室',
      note: '提醒：帶繪本、投影筆、點名表。窗口：陳老師 0912-345-678',
      lead: '王雅婷',
      assistant: '林以恩',
    },
    {
      date: '4/25（六）',
      title: '瑞峰國小自然課',
      meta: '09:00 集合 · 瑞峰國小自然教室',
      note: '提醒：雨備教案放在雲端，助教先確認材料箱。',
      lead: '陳柏宇',
      assistant: '待補位',
    },
  ]

  return (
    <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark-surface)', overflow: 'hidden' }}>
      <MockNavbar active="排班表" />
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', color: 'var(--warm-white)', letterSpacing: '0.12em' }}>本月教學行程</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>同一批志工老師，分散到不同學校與日期上課</div>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--gold)', border: '1px solid rgba(200,164,85,0.22)', padding: '0.25rem 0.55rem', background: 'rgba(200,164,85,0.08)' }}>
            2 堂待執行
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {lessons.map((lesson) => (
            <div key={lesson.title} style={{ border: '1px solid var(--dark-border)', background: 'var(--dark)', padding: '0.9rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '0.7rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold)', marginBottom: '0.15rem' }}>{lesson.date}</div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--warm-white)' }}>{lesson.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>{lesson.meta}</div>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', border: '1px solid var(--dark-border)', padding: '0.2rem 0.45rem' }}>
                  活動說明可當提醒 note
                </span>
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--body-text)', lineHeight: 1.7, padding: '0.65rem 0.7rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.75rem' }}>
                {lesson.note}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.6rem' }}>
                <div style={{ border: '1px solid var(--dark-border)', padding: '0.6rem 0.7rem', background: 'rgba(200,164,85,0.05)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.15rem' }}>主教老師</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--warm-white)' }}>{lesson.lead}</div>
                </div>
                <div style={{ border: '1px solid var(--dark-border)', padding: '0.6rem 0.7rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '0.15rem' }}>助教老師</div>
                  <div style={{ fontSize: '0.8rem', color: lesson.assistant === '待補位' ? 'var(--gold)' : 'var(--warm-white)' }}>{lesson.assistant}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: 'grid', title: '多團隊身份並存', desc: '同一個人可以在 A 團隊是 Owner，在 B 團隊是 Admin 或 Member，也能再建立自己的新團隊。' },
  { icon: 'link', title: '聯合群組共享資訊', desc: '不同團隊要一起合作時，再建立聯合群組，把合作目的、共同 brief、聯合時程總覽與 partner team 集中在同一頁。' },
  { icon: 'calendar', title: '年度回顧與量化資料', desc: '平時的排班參與、取消與支援紀錄會自然累積，年底能回看每個人的排班次數、服務時數與主力崗位。' },
  { icon: 'sliders', title: '團隊角色彈性設定', desc: 'Owner、Admin、Member 權限分清楚，崗位與工作角色也能依照據點、現場或專案自由調整。' },
  { icon: 'zap', title: '遊戲化鼓勵參與', desc: '用積分、活躍月份與成就徽章，把平常默默支援的人看見，也讓團隊年末回顧更有溫度。' },
  { icon: 'swap', title: '邀請連結快速擴編', desc: '不論是邀請自己團隊成員，還是拉另一個團隊加入合作，都能用連結快速完成；DEMO 版每帳號最多建立 3 個團隊。' },
]

const STEPS = [
  { title: 'Google 登入', desc: '用同一個帳號登入系統，未來可同時加入多個團隊，也能自己建立新的 team。' },
  { title: '建立或加入團隊', desc: '建立自己的團隊就自動成為 Owner；若是收到邀請，也能加入別人的團隊成為 Admin 或 Member。DEMO 版每帳號最多建立 3 個團隊。' },
  { title: '先建立活動', desc: '從活動開始管理日常工作，成員之後在排班表上的參與與支援會逐步累積成年度回顧。' },
  { title: '建立聯合群組', desc: '當兩個團隊要一起完成同一場活動或專案時，建立聯合群組並分享合作邀請給 partner team。' },
  { title: '共享 brief 與年底回顧', desc: '雙方加入後可在合作空間裡查看共享說明與跨團隊衝突；平時累積的排班資料則會在年度回顧中呈現。' },
]

function MockYearReview() {
  const rows = [
    { name: '王大明', points: 184, badges: ['出勤之星', '穩定同行'], roles: '導播 × 8 / 攝影 × 4' },
    { name: '林小花', points: 166, badges: ['多面手', '長跑戰將'], roles: '攝影 × 7 / 招待 × 5 / 報到 × 3' },
    { name: '陳志遠', points: 128, badges: ['救援王'], roles: '音控 × 6 / 網路直播 × 4' },
  ]

  return (
    <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark-surface)', overflow: 'hidden' }}>
      <MockNavbar active="年度回顧" />
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: '總排班次數', value: '42' },
            { label: '總服務時數', value: '96h' },
            { label: '成功換班', value: '7' },
            { label: '活躍成員', value: '12' },
          ].map((item) => (
            <div key={item.label} style={{ border: '1px solid var(--dark-border)', background: 'var(--dark)', padding: '0.75rem 0.85rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{item.label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', color: 'var(--gold)', letterSpacing: '0.08em', marginTop: '0.25rem' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid rgba(200,164,85,0.22)', background: 'rgba(200,164,85,0.06)', padding: '0.9rem 1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>我的年度戰績</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.95rem', color: 'var(--warm-white)' }}>林小花</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '0.15rem' }}>16 次排班 · 34 小時 · 3 個主力崗位</div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['多面手', '長跑戰將'].map((badge) => (
                <span key={badge} style={{ fontSize: '0.66rem', color: 'var(--gold)', border: '1px solid rgba(200,164,85,0.25)', padding: '0.18rem 0.45rem', background: 'rgba(200,164,85,0.08)' }}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {rows.map((row, index) => (
            <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.7rem 0.8rem', border: '1px solid var(--dark-border)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ color: index === 0 ? 'var(--gold)' : 'var(--muted)', fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.05rem', letterSpacing: '0.08em' }}>
                #{index + 1}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{row.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{row.roles}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--gold)' }}>{row.points} 分</div>
                <div style={{ fontSize: '0.64rem', color: 'var(--muted)', marginTop: '0.15rem' }}>{row.badges.join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
