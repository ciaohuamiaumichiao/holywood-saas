'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { postJsonWithAuth } from '@/lib/authed-post'
import { getTeamMember } from '@/lib/firestore-teams'
import { Team, TeamMember } from '@/lib/types'

interface TeamContextType {
  teams: Team[]
  activeTeam: Team | null
  activeMember: TeamMember | null   // 自己在 activeTeam 的 member 文件
  activeTeamId: string | null
  loadingTeams: boolean
  teamsError: string | null
  switchTeam: (teamId: string) => void
  refreshTeams: () => Promise<void>
}

const TeamContext = createContext<TeamContextType>({
  teams: [],
  activeTeam: null,
  activeMember: null,
  activeTeamId: null,
  loadingTeams: true,
  teamsError: null,
  switchTeam: () => {},
  refreshTeams: async () => {},
})

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [activeMemberState, setActiveMemberState] = useState<{
    teamId: string
    userId: string
    member: TeamMember | null
  } | null>(null)
  const lastUserIdRef = useRef<string | null>(null)

  const fetchTeams = useCallback(async () => {
    if (authLoading) {
      setLoadingTeams(true)
      return
    }
    if (!user) {
      setTeams([])
      setActiveTeamId(null)
      setActiveMemberState(null)
      setTeamsError(null)
      lastUserIdRef.current = null
      setLoadingTeams(false)
      return
    }

    if (lastUserIdRef.current !== user.uid) {
      setTeams([])
      setActiveTeamId(null)
      setActiveMemberState(null)
      lastUserIdRef.current = user.uid
    }

    setLoadingTeams(true)
    setTeamsError(null)
    try {
      const { teams: myTeams } = await postJsonWithAuth<{ teams: Team[] }>('/api/teams/list', {})
      setTeams(myTeams)
      const saved = localStorage.getItem('activeTeamId')
      const validId = saved && myTeams.some(t => t.id === saved) ? saved : (myTeams[0]?.id ?? null)
      setActiveTeamId(validId)
      setTeamsError(null)
    } catch (error) {
      console.error('[teams] list API failed', error)
      setTeamsError('團隊資料暫時無法載入，請稍後再試。')
    } finally {
      setLoadingTeams(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchTeams()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [fetchTeams])

  // 當 activeTeamId 變更時，載入自己的 member 資料
  useEffect(() => {
    if (!user || !activeTeamId) return

    let cancelled = false

    getTeamMember(activeTeamId, user.uid)
      .then(member => {
        if (cancelled) return
        setActiveMemberState({ teamId: activeTeamId, userId: user.uid, member })
      })
      .catch(error => {
        if (cancelled) return
        console.error('[teams] getTeamMember failed', error)
        setActiveMemberState({ teamId: activeTeamId, userId: user.uid, member: null })
      })

    return () => {
      cancelled = true
    }
  }, [user, activeTeamId])

  const switchTeam = (teamId: string) => {
    setActiveTeamId(teamId)
    localStorage.setItem('activeTeamId', teamId)
  }

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null
  const activeMember =
    activeMemberState?.teamId === activeTeamId && activeMemberState.userId === user?.uid
      ? activeMemberState.member
      : null

  return (
    <TeamContext.Provider value={{
      teams,
      activeTeam,
      activeMember,
      activeTeamId,
      loadingTeams,
      teamsError,
      switchTeam,
      refreshTeams: fetchTeams,
    }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
