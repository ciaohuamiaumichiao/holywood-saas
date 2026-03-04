'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getMyTeams, getTeamMember } from '@/lib/firestore-teams'
import { Team, TeamMember } from '@/lib/types'

interface TeamContextType {
  teams: Team[]
  activeTeam: Team | null
  activeMember: TeamMember | null   // 自己在 activeTeam 的 member 文件
  activeTeamId: string | null
  loadingTeams: boolean
  switchTeam: (teamId: string) => void
  refreshTeams: () => Promise<void>
}

const TeamContext = createContext<TeamContextType>({
  teams: [],
  activeTeam: null,
  activeMember: null,
  activeTeamId: null,
  loadingTeams: true,
  switchTeam: () => {},
  refreshTeams: async () => {},
})

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setTeams([])
      setActiveTeamId(null)
      setLoadingTeams(false)
      return
    }
    setLoadingTeams(true)
    try {
      const myTeams = await getMyTeams(user.uid)
      setTeams(myTeams)
      // 預設選第一個，或從 localStorage 恢復
      const saved = localStorage.getItem('activeTeamId')
      const validId = saved && myTeams.some(t => t.id === saved) ? saved : (myTeams[0]?.id ?? null)
      setActiveTeamId(validId)
    } finally {
      setLoadingTeams(false)
    }
  }, [user])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  // 當 activeTeamId 變更時，載入自己的 member 資料
  useEffect(() => {
    if (!user || !activeTeamId) {
      setActiveMember(null)
      return
    }
    getTeamMember(activeTeamId, user.uid).then(setActiveMember)
  }, [user, activeTeamId])

  const switchTeam = (teamId: string) => {
    setActiveTeamId(teamId)
    localStorage.setItem('activeTeamId', teamId)
  }

  const activeTeam = teams.find(t => t.id === activeTeamId) ?? null

  return (
    <TeamContext.Provider value={{
      teams,
      activeTeam,
      activeMember,
      activeTeamId,
      loadingTeams,
      switchTeam,
      refreshTeams: fetchTeams,
    }}>
      {children}
    </TeamContext.Provider>
  )
}

export const useTeam = () => useContext(TeamContext)
