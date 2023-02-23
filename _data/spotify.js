require('dotenv').config();

const EleventyFetch = require('@11ty/eleventy-fetch');
const fetch = require('node-fetch');

// https://developer.spotify.com/documentation/web-api/reference/#/operations/get-users-top-artists-and-tracks
const ARTISTS_ENDPOINT = 'https://api.spotify.com/v1/me/top/artists';
const TRACKS_ENDPOINT = 'https://api.spotify.com/v1/me/top/tracks';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
// Only get the top 5
const LIMIT = 5;
// Set to short_term to get some variation
const TIME_RANGE = 'short_term';

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
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
  };

  const accessToken = await fetch(TOKEN_ENDPOINT, options)
    .then((res) => res.json())
    .then((json) => json.access_token)
    .catch(console.err);

  // Build artists query
  const artistsUrl = new URL(ARTISTS_ENDPOINT);
  artistsUrl.searchParams.set('limit', LIMIT);
  artistsUrl.searchParams.set('time_range', TIME_RANGE);

  const artists = await EleventyFetch(artistsUrl.toString(), {
    duration: '1h',
    type: 'json',
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Build tracks query
  const tracksUrl = new URL(TRACKS_ENDPOINT);
  tracksUrl.searchParams.set('limit', LIMIT);
  tracksUrl.searchParams.set('time_range', TIME_RANGE);

  const tracks = await EleventyFetch(tracksUrl.toString(), {
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
