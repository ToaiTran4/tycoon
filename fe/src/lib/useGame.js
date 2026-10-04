import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from './api.js';

function lsKey(code) { return `ptk:${code}`; }

export function useGame(code) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [conn, setConn] = useState('idle');
  const versionRef = useRef(0);
  const pollRef = useRef(null);
  const socketRef = useRef(null);
  const mounted = useRef(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem(lsKey(code)) : null;

  async function fetchData(force = false) {
    try {
      const v = force ? 0 : versionRef.current;
      const res = await api.getGame(code, { v, token });
      if (!mounted.current) return;
      if (!res.unchanged) {
        versionRef.current = res.version;
        setData(res);
      }
      setError(null);
    } catch (e) {
      if (mounted.current) setError(e.message || String(e));
    }
  }

  useEffect(() => {
    mounted.current = true;
    if (!code) return;
    fetchData(true);

    const url = (import.meta.env.VITE_API_URL ?? '');
    const socket = io(url, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConn('ws');
      socket.emit('join', code);
      startPoll(15000);
    });
    socket.on('disconnect', () => {
      setConn('polling');
      startPoll(3000);
    });
    socket.on('version', ({ version }) => {
      if (version > versionRef.current) fetchData(true);
    });
    socket.on('dice', (payload) => {
      setData(d => d ? { ...d, _diceAnim: payload } : d);
    });

    function startPoll(ms) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchData(), ms);
    }

    return () => {
      mounted.current = false;
      socket.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [code]);

  function mutate() { fetchData(true); }

  return { data, error, conn, token, mutate };
}

export function saveToken(code, token) {
  localStorage.setItem(lsKey(code), token);
}

export function getToken(code) {
  return localStorage.getItem(lsKey(code));
}

export function clearToken(code) {
  localStorage.removeItem(lsKey(code));
}
