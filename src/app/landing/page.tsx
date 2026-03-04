'use client'

import Link from 'next/link'

const DEMO_URL = '/login'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--black)', minHeight: '100vh', fontFamily: 'Noto Sans TC, sans-serif' }}>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)',
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

        {/* ── Hero ── */}
        <section style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '4rem 0',
        }}>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            SaaS 影視服事排班平台
          </p>
          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            letterSpacing: '0.15em', color: 'var(--warm-white)', lineHeight: 1, marginBottom: '1rem',
          }}>
            HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', color: 'var(--muted)', letterSpacing: '0.15em', fontFamily: 'Bebas Neue, sans-serif', marginBottom: '1rem' }}>
            讓影視服事團隊告別 LINE 群排班
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--body-text)', maxWidth: 480, lineHeight: 1.9, marginBottom: '2.5rem' }}>
            專為教會及服事機構設計的線上排班系統。<br />
            建立團隊、邀請成員、設定崗位，讓每位服事者都能即時查看排班、自主報名、申請換班。
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
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '1.5rem', letterSpacing: '0.08em' }}>
            免費開始 · 不需信用卡 · 30 秒建立團隊
          </p>
        </section>

        {/* ── Stats ── */}
        <section style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px', background: 'var(--dark-border)',
          border: '1px solid var(--dark-border)', marginBottom: '6rem',
        }}>
          {[
            { num: '30秒', label: '建立團隊' },
            { num: '即時', label: '排班同步' },
            { num: '一鍵', label: '邀請成員' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--dark-surface)', padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.5rem', letterSpacing: '0.1em', color: 'var(--gold)' }}>{s.num}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="功能特色" title="排班再也不是難題" desc="從建立場次到崗位分配，HOLYWOOD 完整覆蓋影視服事的所有排班需求。" />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1px', background: 'var(--dark-border)', border: '1px solid var(--dark-border)',
          }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: 'var(--dark-surface)', padding: '2rem', transition: 'background 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,164,85,0.04)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--dark-surface)' }}
              >
                <div style={{ marginBottom: '0.8rem' }}>
                  <LineIcon type={f.icon} />
                </div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--warm-white)', marginBottom: '0.5rem', fontWeight: 500 }}>{f.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Screenshot: 排班表 ── */}
        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="操作截圖" title="排班表一目瞭然" desc="所有即將到來的場次集中顯示，崗位空缺清楚標示，一鍵即可自主報名。" />
          <MockSchedule />
        </section>

        {/* ── Screenshot: 管理後台 ── */}
        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="管理員介面" title="完整掌握團隊排班" desc="新增場次、管理成員、設定崗位，並透過邀請連結快速擴展團隊。" />
          <MockAdmin />
        </section>

        {/* ── Screenshot: 可用日期 ── */}
        <section style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="成員自主登記" title="可參與日期一鍵勾選" desc="成員提前登記可參與的場次，管理員在排班時一眼看出誰可以服事。" />
          <MockAvailability />
        </section>

        {/* ── How It Works ── */}
        <section id="how" style={{ marginBottom: '7rem' }}>
          <SectionHeader tag="使用流程" title="四步驟開始排班" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.title} style={{ padding: '2rem 1.5rem', border: '1px solid var(--dark-border)', position: 'relative' }}>
                <div style={{
                  fontFamily: 'Bebas Neue, sans-serif', fontSize: '3rem',
                  color: 'rgba(200,164,85,0.15)', position: 'absolute', top: '1rem', right: '1.25rem',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <CircleNumber index={i + 1} />
                </div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--warm-white)', marginBottom: '0.4rem', fontWeight: 500 }}>{s.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.8 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          textAlign: 'center', padding: '5rem 2rem',
          border: '1px solid var(--dark-border)', marginBottom: '4rem',
          background: 'linear-gradient(135deg, rgba(200,164,85,0.04) 0%, transparent 60%)',
        }}>
          <p style={{ fontSize: '0.72rem', letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '1rem' }}>開始使用</p>
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.15em', color: 'var(--warm-white)', marginBottom: '1rem' }}>
            讓你的服事團隊更有效率
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
            現在免費建立你的第一個團隊，體驗智慧排班的便利。
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
            用 Google 帳號登入 · 完全免費
          </p>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--dark-border)', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
          HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span> · 影視排班平台
        </p>
        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.05em' }}>v1.0 · 為影視服事團隊打造</p>
      </footer>
    </div>
  )
}

// ── 子元件 ──────────────────────────────────────────────────────────────────

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
    <div style={{ background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid var(--dark-border)', height: 44, display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '1.5rem' }}>
      <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1rem', letterSpacing: '0.15em', color: 'var(--warm-white)' }}>
        HOLY<span style={{ color: 'var(--gold)' }}>WOOD</span>
      </span>
      {['排班表', '我的排班', '可參與日期', '管理'].map(l => (
        <span key={l} style={{ fontSize: '0.65rem', color: l === active ? 'var(--gold)' : 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</span>
      ))}
      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--gold)', background: 'rgba(200,164,85,0.1)', border: '1px solid rgba(200,164,85,0.2)', padding: '0.15rem 0.5rem' }}>HOLYWOOD 影視</span>
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
        {/* Session Card */}
        <div style={{ border: '1px solid var(--dark-border)', background: 'var(--dark)', marginBottom: '0.75rem' }}>
          <div style={{ borderBottom: '1px solid var(--dark-border)', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '0.88rem', color: 'var(--warm-white)', letterSpacing: '0.1em' }}>4/5（六）</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 8 }}>週六服事</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>14:00–17:00</span>
          </div>
          {roles.map((role, ri) => (
            <div key={role} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.4rem 1rem',
              borderBottom: ri < roles.length - 1 ? '1px solid rgba(42,42,42,0.5)' : 'none',
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
        {/* Tips */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {['◈ 點「報名」自主搶位', '⇌ 可對隊友申請換班', '● 即時同步'].map(t => (
            <span key={t} style={{ fontSize: '0.68rem', color: 'var(--muted)' }}><span style={{ color: 'var(--gold)' }}>{t[0]}</span>{t.slice(1)}</span>
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
      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--dark-border)', display: 'flex', padding: '0 1.5rem' }}>
        {['排班管理', '成員管理', '團隊設定'].map((tab, i) => (
          <div key={tab} style={{
            padding: '0.65rem 1.1rem', fontSize: '0.75rem', letterSpacing: '0.08em', cursor: 'pointer',
            color: i === 1 ? 'var(--gold)' : 'var(--muted)',
            borderBottom: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
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
        ].map(m => (
          <div key={m.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--dark-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--dark-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--muted)' }}>
                {m.name[0]}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--warm-white)' }}>{m.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{m.email}</div>
              </div>
            </div>
            <span style={{
              fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.18rem 0.45rem',
              background: m.role !== 'member' ? 'rgba(200,164,85,0.12)' : 'rgba(42,42,42,0.5)',
              color: m.role !== 'member' ? 'var(--gold)' : 'var(--muted)',
              border: m.role !== 'member' ? '1px solid rgba(200,164,85,0.25)' : '1px solid var(--dark-border)',
            }}>
              {m.role}
            </span>
          </div>
        ))}
        {/* Invite link */}
        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--dark)', border: '1px solid var(--dark-border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.45rem' }}>邀請連結（7 天有效）</div>
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
          {sessions.map(s => (
            <div key={s.date} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.8rem 1rem',
              background: s.checked ? 'rgba(200,164,85,0.06)' : 'var(--dark)',
              border: `1px solid ${s.checked ? 'rgba(200,164,85,0.4)' : 'var(--dark-border)'}`,
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: s.checked ? 'var(--gold)' : 'var(--warm-white)', marginBottom: '0.1rem' }}>
                  {s.date}　{s.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{s.time}</div>
              </div>
              <div style={{
                width: 20, height: 20,
                border: `1.5px solid ${s.checked ? 'var(--gold)' : 'var(--dark-border)'}`,
                background: s.checked ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.checked && (
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

// ── 資料 ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: 'grid', title: '多租戶團隊隔離', desc: '每個教會、場館或社企據點擁有獨立資料空間，成員只能看到自己的團隊。' },
  { icon: 'sliders', title: '崗位彈性設定', desc: '音控、燈光、影像導播、招待、志工、市集攤位…角色由你自訂，完全貼合現場編制。' },
  { icon: 'zap', title: '即時排班同步', desc: '排班、調度、公告立即同步所有人，不再因截圖或舊版表單造成錯位。' },
  { icon: 'swap', title: '換班申請系統', desc: '成員直接對同仁發起換班請求，雙方同意即自動更新，減少管理者協調成本。' },
  { icon: 'calendar', title: '可用時段登記', desc: '先收集大家可服務的時段，再排班；支援不定期活動、多場次與多時段。' },
  { icon: 'link', title: '邀請連結加入', desc: '產生邀請連結分享出去，新人用 Google 登入即可加入，零帳號申請流程。' },
]

const STEPS = [
  { icon: 'step', title: '用 Google 登入', desc: '只需 Google 帳號，30 秒完成登入，不用另外建立帳號密碼。' },
  { icon: 'step', title: '建立團隊', desc: '輸入團隊或據點名稱，設定需要的崗位清單，立即建立排班空間。' },
  { icon: 'step', title: '邀請成員', desc: '產生邀請連結，傳給 LINE / Slack / Email，成員點擊即可加入。' },
  { icon: 'step', title: '開始排班', desc: '建立活動、設定多個時段與名額，成員可自主報名、換班，全程線上處理。' },
]
