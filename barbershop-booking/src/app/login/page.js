'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // PASSWORD DAN USERNAME ADMIN ANDA (Silakan diganti sesuai keinginan)
    if (username === 'adminboytax' && password === 'boytax123') {
      // Simpan status login di cookie browser selama 1 hari
      document.cookie = "admin_session=authenticated; path=/; max-age=86400";
      router.push('/admin');
      router.refresh();
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-serif font-bold text-amber-500">BOYTAX HAIRSTUDIO</h1>
          <p className="text-neutral-400 text-xs mt-1">Grooming Panel Authentication</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-lg text-xs font-medium mb-4 text-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Username</label>
            <input 
              type="text" required
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition"
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Password</label>
            <input 
              type="password" required
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-3 rounded-lg text-sm tracking-wide shadow-md transition duration-200 mt-2">
            MASUK PANEL
          </button>
        </form>
      </div>
    </div>
  );
}
