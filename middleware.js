export const config = {
  matcher: '/((?!favicon.ico).*)',
};

const USER = 'ACEBACE';
const PASS = 'Sielsrus';
const COOKIE_NAME = 'sielsoord_auth';
const COOKIE_VALUE = 'granted-9f2e7a1c';

const LOGIN_PAGE = `<!DOCTYPE html>
<html lang="af">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sielsoord — Meld aan</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1410; color: #f0e6d6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  form { background: #241c15; padding: 2.5rem; border-radius: 12px; width: 100%; max-width: 360px; box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
  h1 { font-size: 1.4rem; margin: 0 0 1.5rem; text-align: center; }
  label { display: block; font-size: 0.85rem; margin-bottom: 0.3rem; opacity: 0.8; }
  input { width: 100%; box-sizing: border-box; padding: 0.7rem; margin-bottom: 1rem; border-radius: 6px; border: 1px solid #4a3d2e; background: #1a1410; color: #f0e6d6; font-size: 1rem; }
  button { width: 100%; padding: 0.8rem; border-radius: 6px; border: none; background: #c9a15a; color: #1a1410; font-weight: 600; font-size: 1rem; cursor: pointer; }
  .error { color: #e08a8a; font-size: 0.85rem; margin-bottom: 1rem; text-align: center; }
</style>
</head>
<body>
<form method="POST" action="/_login">
  <h1>Sielsoord</h1>
  {{ERROR}}
  <label for="u">Gebruikersnaam</label>
  <input type="text" id="u" name="u" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" required>
  <label for="p">Wagwoord</label>
  <input type="password" id="p" name="p" autocomplete="off" required>
  <button type="submit">Meld aan</button>
</form>
</body>
</html>`;

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname === '/_login' && request.method === 'POST') {
    const form = await request.formData();
    const user = (form.get('u') || '').toString();
    const pass = (form.get('p') || '').toString();

    if (user === USER && pass === PASS) {
      const res = Response.redirect(url.origin, 303);
      const headers = new Headers(res.headers);
      headers.append(
        'Set-Cookie',
        `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
      );
      return new Response(null, { status: 303, headers });
    }

    return new Response(
      LOGIN_PAGE.replace('{{ERROR}}', '<p class="error">Verkeerde gebruikersnaam of wagwoord.</p>'),
      { status: 401, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  const cookie = request.headers.get('cookie') || '';
  const hasAuth = cookie
    .split(';')
    .map((c) => c.trim())
    .includes(`${COOKIE_NAME}=${COOKIE_VALUE}`);

  if (hasAuth) {
    return;
  }

  return new Response(LOGIN_PAGE.replace('{{ERROR}}', ''), {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
