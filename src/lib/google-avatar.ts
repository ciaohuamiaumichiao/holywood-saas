type PhotoProvider = {
  providerId?: string | null
  photoURL?: string | null
}

type PhotoSource = {
  photoURL?: string | null
  providerData?: PhotoProvider[] | null
} | null | undefined

function normalizeGoogleAvatarUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (!/googleusercontent\.com/i.test(trimmed)) return trimmed

  if (/[?&]sz=\d+/i.test(trimmed)) {
    return trimmed.replace(/([?&]sz=)\d+/i, '$1256')
  }

  if (/=s\d+(-c)?(-k)?(-mo)?$/i.test(trimmed)) {
    return trimmed.replace(/=s\d+(-c)?(-k)?(-mo)?$/i, '=s256-c')
  }

  return trimmed
}

export function resolveGoogleAvatarUrl(source: PhotoSource, fallback = ''): string {
  const providers = source?.providerData ?? []
  const googlePhoto =
    providers.find((provider) => provider?.providerId === 'google.com' && provider?.photoURL)?.photoURL ?? ''
  const providerPhoto = providers.find((provider) => provider?.photoURL)?.photoURL ?? ''

  return normalizeGoogleAvatarUrl(googlePhoto || source?.photoURL || providerPhoto || fallback)
}
