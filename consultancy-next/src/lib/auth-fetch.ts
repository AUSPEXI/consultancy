import { auth } from '@/firebase';

/**
 * Drop-in replacement for fetch() that automatically attaches the Firebase
 * ID token as Authorization: Bearer <token>.
 * Use this for all internal /api/ calls from client components.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
