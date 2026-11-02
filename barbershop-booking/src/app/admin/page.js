'use client';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [history, setHistory] = useState([]); // State baru untuk riwayat
  
  // State Input
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole, setNewBarberRole] = useState('Senior Barber');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('45 Menit');

  // State Baru untuk Mengatur Jadwal Hari & Jam Kerja Kapster
  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday', isChecked: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Tuesday', isChecked: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Wednesday', isChecked: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Thursday', isChecked: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Friday', isChecked: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Saturday', isChecked: false, startTime: '09:00', endTime: '17:00' },
    { day: 'Sunday', isChecked: false, startTime: '09:00', endTime: '17:00' },
  ]);

  const [isLoading, setIsLoading] = useState(true);

  

  async function loadAllData() {
    try {
      const resApps = await fetch('/api/appointments');
      if (resApps.ok) setAppointments(await resApps.json());

      const resBarbers = await fetch('/api/barbers');
      if (resBarbers.ok) setBarbers(await resBarbers.json());

      const resServices = await fetch('/api/services');
      if (resServices.ok) setServices(await resServices.json());

      // Menarik data riwayat menggunakan method PUT
      const resHistory = await fetch('/api/appointments', { method: 'PUT' });
      if (resHistory.ok) setHistory(await resHistory.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadAllData(); }, []);

  // Handler untuk mendeteksi perubahan checkbox hari atau rentang waktu jam
  const handleScheduleChange = (index, field, value) => {
    const updatedHours = [...workingHours];
    updatedHours[index][field] = value;
    setWorkingHours(updatedHours);
  };

  // FUNGSI SELESAI ANTREAN DENGAN INPUT KAPSTER
  const handleComplete = async (id) => {
    // Meminta admin mengetik/memilih nama kapster penanggung jawab
    const barberName = prompt("Siapa nama kapster yang menyelesaikan orderan ini?");
    
    if (barberName === null) return; // Jika admin klik cancel
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

  const handle領leteBarber = async (id) => {
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

  const handle領leteService = async (id) => {
    if (confirm('Hapus layanan ini?')) {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadAllData();
    }
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
          <div className="flex gap-2">
            <a href="/" className="bg-neutral-900 border border-neutral-800 text-xs px-4 py-2 rounded-md text-neutral-400 font-medium transition">Lihat Beranda</a>
            <button onClick={() => { document.cookie = "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; window.location.href = '/login'; }} className="bg-red-600/10 border border-red-500/20 text-red-500 text-xs px-4 py-2 rounded-md font-medium transition">🔒 Logout</button>
          </div>
        </div>

        {/* PANELS (KAPSTER & LAYANAN) */}
        <div className="grid md:grid-cols-2 gap-8 border-b border-neutral-900 pb-8">
          {/* Kapster */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-amber-500">✂️ Kelola Kapster</h2>
            <form onSubmit={handleAddBarber} className="flex gap-2">
              <input type="text" required placeholder="Nama Kapster" className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} />
              <button type="submit" className="bg-amber-500 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs">Tambah</button>
            </form>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {barbers.map(b => (
                <div key={b._id} className="bg-neutral-950 p-2 rounded border border-neutral-800 text-xs flex justify-between">{b.name} <button onClick={() => handle領leteBarber(b._id)} className="text-red-400">❌</button></div>
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
                <div key={s._id} className="bg-neutral-950 p-2 rounded border border-neutral-800 text-xs flex justify-between">{s.name} (Rp {s.price}) <button onClick={() => handle領leteService(s._id)} className="text-red-400">❌</button></div>
              ))}
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
