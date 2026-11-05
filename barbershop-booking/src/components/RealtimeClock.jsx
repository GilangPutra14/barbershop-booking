'use client'; // Wajib karena menggunakan hook di Next.js App Router

import React, { useState, useEffect } from 'react';

const RealtimeClock = () => {
  const [time, setTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateClock = () => {
      const now = new Date();
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta' // Ubah sesuai lokasi barbershop Anda
      };
      setTime(now.toLocaleTimeString('id-ID', options));
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  if (!mounted) {
    return <div className="font-mono text-gray-400">Loading...</div>;
  }

  return (
    <div className="font-mono font-bold text-xl text-emerald-500 bg-gray-900 px-4 py-2 rounded-lg inline-block border border-gray-800">
      {time}
    </div>
  );
};

export default RealtimeClock;
