import { auth } from './firebase'

export async function postJsonWithAuth<T>(
  url: string,
  payload: Record<string, unknown>
): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new Error('尚未登入')

  const idToken = await user.getIdToken()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  })

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : 'Request failed'
    throw new Error(message)
  }

  return (body as T) ?? ({} as T)
}
