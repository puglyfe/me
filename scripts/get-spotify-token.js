// Get a new Spotify refresh token via the authorization code flow.
//
// 1. Add REDIRECT_URI below to your app's Redirect URIs in the Spotify dashboard
// 2. Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set in .env
// 3. Run `node scripts/get-spotify-token.js` and open the printed URL
//
// https://developer.spotify.com/documentation/web-api/tutorials/code-flow
require('dotenv').config();

const crypto = require('crypto');
const http = require('http');
const fetch = require('node-fetch');

const PORT = 8888;
// Spotify no longer allows "localhost" redirect URIs, so use the loopback IP
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = 'user-top-read';
const AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env');
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');

const authorizeUrl = new URL(AUTHORIZE_ENDPOINT);
authorizeUrl.searchParams.set('response_type', 'code');
authorizeUrl.searchParams.set('client_id', SPOTIFY_CLIENT_ID);
authorizeUrl.searchParams.set('scope', SCOPE);
authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authorizeUrl.searchParams.set('state', state);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);

  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }

  const finish = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain' }).end(message);
    server.close();
  };

  if (url.searchParams.get('state') !== state) {
    finish(400, 'State mismatch, try again.');
    console.error('State mismatch, try again.');
    process.exitCode = 1;
    return;
  }

  if (url.searchParams.get('error')) {
    finish(400, `Authorization failed: ${url.searchParams.get('error')}`);
    console.error(`Authorization failed: ${url.searchParams.get('error')}`);
    process.exitCode = 1;
    return;
  }

  // Base64 encode the auth
  const auth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: url.searchParams.get('code'),
      redirect_uri: REDIRECT_URI,
    }),
  });
  const tokenJson = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenJson.refresh_token) {
    finish(500, 'Token exchange failed, check the terminal.');
    console.error(
      `Token exchange failed (${tokenResponse.status}): ${tokenJson.error} - ${tokenJson.error_description}`,
    );
    process.exitCode = 1;
    return;
  }

  finish(200, 'Got it! You can close this tab and check the terminal.');
  console.log('\nSPOTIFY_REFRESH_TOKEN=' + tokenJson.refresh_token);
  console.log(
    '\nPut this in .env and in the repo secrets (Settings > Secrets and variables > Actions).',
  );
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Make sure ${REDIRECT_URI} is a Redirect URI on your Spotify app.`);
  console.log('Then open this URL to authorize:\n');
  console.log(authorizeUrl.toString());
});
