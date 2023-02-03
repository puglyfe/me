require('dotenv').config();

const EleventyFetch = require('@11ty/eleventy-fetch');
const fetch = require('node-fetch');

const ARTISTS_ENDPOINT = 'https://api.spotify.com/v1/me/top/artists';
const TRACKS_ENDPOINT = 'https://api.spotify.com/v1/me/top/tracks';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
// Only get the top 5
const LIMIT = 5;

module.exports = async function () {
  // Base64 encode the auth
  const auth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${
      process.env.SPOTIFY_REFRESH_TOKEN
    }&redirect_uri=${encodeURI(process.env.BASE_URL, +'/callback/')}`,
  };

  const accessToken = await fetch(TOKEN_ENDPOINT, options)
    .then((res) => res.json())
    .then((json) => json.access_token)
    .catch(console.err);

  const artists = await EleventyFetch(`${ARTISTS_ENDPOINT}?limit=${LIMIT}`, {
    duration: '1h',
    type: 'json',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const tracks = await EleventyFetch(`${TRACKS_ENDPOINT}?limit=${LIMIT}`, {
    duration: '1h',
    type: 'json',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  return {
    artists: artists?.items ?? [],
    tracks: tracks?.items ?? [],
  };
};
