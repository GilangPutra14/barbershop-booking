'use client';
import { useState, useEffect } from 'react';
import RealtimeClock from '@/components/RealtimeClock';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [history, setHistory] = useState([]); 
  const [blockedSlots, setBlockedSlots] = useState([]); // State baru untuk daftar jam diblokir
  
  // State Input Utama
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole] = useState('Senior Barber');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration] = useState('45 Menit');

  // State Input Fitur Jam Tidak Tersedia (Block Time)
  const [selectedBarber, setSelectedBarber] = useState('');
  const [blockDay, setBlockDay] = useState('Monday');
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:00');

  const [, setIsLoading] = useState(true);

  async function loadAllData() {
    try {
      const resApps = await fetch('/api/appointments');
      if (resApps.ok) setAppointments(await resApps.json());

      const resBarbers = await fetch('/api/barbers');
      if (resBarbers.ok) {
        const barbersData = await resBarbers.json();
        setBarbers(barbersData);
        if (barbersData.length > 0 && !selectedBarber) setSelectedBarber(barbersData[0]._id);
      }

      const resServices = await fetch('/api/services');
      if (resServices.ok) setServices(await resServices.json());

      const resHistory = await fetch('/api/appointments', { method: 'PUT' });
      if (resHistory.ok) setHistory(await resHistory.json());

      // MEMANGGIL DATA JAM BLOKIR DARI API BACKEND
      const resBlocked = await fetch('/api/blocked-slots');
      if (resBlocked.ok) setBlockedSlots(await resBlocked.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadAllData(); }, []);

  // FUNGSI SELESAI ANTREAN
  const handleComplete = async (id) => {
    const barberName = prompt("Siapa nama kapster yang menyelesaikan orderan ini?");
    if (barberName === null) return; 
    if (barberName.trim() === "") {
      alert("Nama kapster wajib diisi untuk menyelesaikan antrean!");
      return;
    }
    const res = await fetch(`/api/appointments?id=${id}&completedBy=${encodeURIComponent(barberName)}`, { 
      method: 'DELETE' 
    });
    if (res.ok) {
      alert("Antrean sukses dipindahkan ke riwayat!");
      loadAllData();
    }
  };

  const handleAddBarber = async (e) => {
    e.preventDefault();
    if (!newBarberName) return;
    const res = await fetch('/api/barbers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBarberName, role: newBarberRole }),
    });
    if (res.ok) { setNewBarberName(''); loadAllData(); }
  };

  const handleDeleteBarber = async (id) => {
    if (confirm('Hapus kapster ini?')) {
      const res = await fetch(`/api/barbers?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadAllData();
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newServiceName, price: newServicePrice, duration: newServiceDuration }),
    });
    if (res.ok) { setNewServiceName(''); setNewServicePrice(''); loadAllData(); }
  };

  const handleDeleteService = async (id) => {
    if (confirm('Hapus layanan ini?')) {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadAllData();
    }
  };

  // Fungsi Handler Simpan Jam Blokir ke API Backend
  const handleSaveUnavailableTime = async (e) => {
    e.preventDefault();
    if (!selectedBarber) {
      alert("Silakan pilih kapster terlebih dahulu!");
      return;
    }
    
    try {
      const res = await fetch('/api/blocked-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber,
          day: blockDay,
          startTime: blockStartTime,
          endTime: blockEndTime
        }),
      });

      if (res.ok) {
        alert("Jam kerja kapster berhasil diblokir!");
        setBlockStartTime('12:00');
        setBlockEndTime('13:00');
        loadAllData(); // Refresh data agar langsung muncul di tabel bawah
      } else {
        const errorData = await res.json();
        alert(`Gagal: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat menghubungi server.");
    }
  };

  // FUNGSI MENGHAPUS BLOKIR JAM DARI BACKEND
  const handleDeleteBlockedSlot = async (id) => {
    if (confirm('Buka kembali jam booking yang diblokir ini?')) {
      const res = await fetch(`/api/blocked-slots?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Jam booking berhasil dibuka kembali!");
        loadAllData();
      }
    }
  };

  // Helper untuk menerjemahkan nama objek Barber ID ke nama String teks asli kapster
  const getBarberName = (id) => {
    const found = barbers.find(b => b._id === id);
    return found ? found.name : 'Kapster tidak diketahui';
  };

  // Helper konversi nama Hari bahasa Inggris ke bahasa Indonesia
  const translateDay = (day) => {
    const days = { Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu' };
    return days[day] || day;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif text-amber-500">Dashboard Admin Premium v4</h1>
            <p className="text-neutral-400 text-sm mt-1">Sistem Manajemen Kasir & Riwayat Kerja Kapster.</p>
          </div>
          <div className="flex items-center gap-4">
            <RealtimeClock />
            <div className="flex gap-2">
              <a href="/" className="bg-neutral-900 border border-neutral-800 text-xs px-4 py-2 rounded-md text-neutral-400 font-medium transition hover:bg-neutral-800">Lihat Beranda</a>
              <button onClick={() => { document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; window.location.href = '/login'; }} className="bg-red-600/10 border border-red-500/20 text-red-500 text-xs px-4 py-2 rounded-md font-medium transition hover:bg-red-600/20">🔒 Logout</button>
            </div>
          </div>
        </div>

        {/* PANELS (KAPSTER & LAYANAN) */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Kapster */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-amber-500">✂️ Kelola Kapster</h2>
            <form onSubmit={handleAddBarber} className="flex gap-2">
              <input type="text" required placeholder="Nama Kapster" className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} />
              <button type="submit" className="bg-amber-500 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs">Tambah</button>
            </form>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {barbers.map(b => (
                <div key={b._id} className="bg-neutral-950 p-2 rounded border border-neutral-800 text-xs flex justify-between">{b.name} <button type="button" onClick={() => handleDeleteBarber(b._id)} className="text-red-400">❌</button></div>
              ))}
            </div>
          </div>

          {/* Layanan */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-amber-500">💈 Kelola Layanan</h2>
            <form onSubmit={handleAddService} className="grid grid-cols-3 gap-2">
              <input type="text" required placeholder="Nama" className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} />
              <input type="number" required placeholder="Harga" className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} />
              <button type="submit" className="bg-amber-500 text-neutral-950 font-bold rounded-lg text-xs">Tambah</button>
            </form>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {services.map(s => (
                <div key={s._id} className="bg-neutral-950 p-2 rounded border border-neutral-800 text-xs flex justify-between">{s.name} (Rp {s.price}) <button type="button" onClick={() => handleDeleteService(s._id)} className="text-red-400">❌</button></div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL PENGATURAN JAM TIDAK TERSEDIA KAPSTER */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-bold text-amber-500">🔒 Atur Jam Istirahat / Blokir Jam Kerja Kapster</h2>
          <p className="text-xs text-neutral-400">Tentukan rentang jam di mana pelanggan tidak dapat melakukan booking pada kapster tertentu.</p>
          
          <form onSubmit={handleSaveUnavailableTime} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Pilih Kapster</label>
              <select 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200"
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
              >
                {barbers.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Hari</label>
              <select 
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200"
                value={blockDay}
                onChange={(e) => setBlockDay(e.target.value)}
              >
                <option value="Monday">Senin</option>
                <option value="Tuesday">Selasa</option>
                <option value="Wednesday">Rabu</option>
                <option value="Thursday">Kamis</option>
                <option value="Friday">Jumat</option>
                <option value="Saturday">Sabtu</option>
                <option value="Sunday">Minggu</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Mulai Dari</label>
                <input 
                  type="time" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200"
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Sampai Dengan</label>
                <input 
                  type="time" 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-200"
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold p-2 rounded-lg text-xs transition">
              Blokir Jam Booking
            </button>
          </form>

          {/* TABEL DAFTAR JAM YANG SEDANG DIBLOKIR */}
          <div className="pt-4 border-t border-neutral-800">
            <h3 className="text-sm font-bold text-amber-500 mb-2">📋 Daftar Slot Jam Terkunci Saat Ini</h3>
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {blockedSlots.length === 0 ? (
                <div className="p-4 text-center text-neutral-500 text-xs">Belum ada jam kerja kapster yang diblokir.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Nama Kapster</th>
                      <th className="p-3">Hari</th>
                      <th className="p-3">Rentang Waktu</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40">
                    {blockedSlots.map((slot) => (
                      <tr key={slot._id} className="hover:bg-neutral-900/30">
                        <td className="p-3 text-neutral-200 font-medium">{getBarberName(slot.barberId)}</td>
                        <td className="p-3 text-neutral-400">{translateDay(slot.day)}</td>
                        <td className="p-3">
                          <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10 font-mono">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleDeleteBlockedSlot(slot._id)} 
                            className="text-red-400 bg-red-500/5 hover:bg-red-500/10 px-2 py-1 rounded transition border border-red-500/10 text-[11px]"
                          >
                            🔓 Buka Blokir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* TABEL 1: ANTREAN AKTIF */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-serif text-amber-500">🗓️ Antrean Booking Aktif</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            {appointments.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">Tidak ada antrean aktif.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950 text-amber-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Nama Pelanggan</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">Kapster Request</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {appointments.map((item) => (
                    <tr key={item._id} className="hover:bg-neutral-950/40">
                      <td className="p-4 text-neutral-200">{item.name}</td>
                      <td className="p-4 text-neutral-400">{item.service}</td>
                      <td className="p-4"><span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-1 rounded border border-amber-500/20">{item.barber}</span></td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleComplete(item._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded transition">✓ Selesai</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* TABEL 2: RIWAYAT BOOKING YANG SELESAI */}
        <div className="space-y-4 pt-6 border-t border-neutral-900">
          <h2 className="text-xl font-bold font-serif text-emerald-500">✅ Riwayat Pemotongan Selesai</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
            {history.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">Belum ada riwayat transaksi hari ini.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950 text-emerald-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Nama Pelanggan</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">Diselesaikan Oleh (Kapster)</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {history.map((item, idx) => (
                    <tr key={idx} className="bg-emerald-950/5 hover:bg-emerald-950/10 transition">
                      <td className="p-4 text-neutral-300 font-medium">{item.name}</td>
                      <td className="p-4 text-neutral-400">{item.service}</td>
                      <td className="p-4">
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold">
                          🪒 {item.completedBy}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">🟢 Sukses</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
