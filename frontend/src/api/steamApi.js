import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10_000
});

export async function getMostPlayed(limit = 12) {
  const res = await client.get('/most-played', { params: { limit } });
  return res.data;
}

export async function getTrending(limit = 50) {
  const res = await client.get('/trending', { params: { limit } });
  return res.data;
}

export async function getTopRated(limit = 200) {
  const res = await client.get('/top-rated', { params: { limit } });
  return res.data;
}

export async function getPriceVsRating(limit = 200) {
  const res = await client.get('/price-vs-rating', { params: { limit } });
  return res.data;
}

export async function getPlatformsBreakdown() {
  const res = await client.get('/platforms-breakdown');
  return res.data;
}