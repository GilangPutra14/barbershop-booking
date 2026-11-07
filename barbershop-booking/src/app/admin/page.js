'use client';
import { useState, useEffect } from 'react';
import RealtimeClock from '@/components/RealtimeClock';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [history, setHistory] = useState([]); 
  const [blockedSlots, setBlockedSlots] = useState([]);
  
  // State Input Utama
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberRole] = useState('Senior Barber');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration] = useState('45 Menit');
  const [newBarberImage, setNewBarberImage] = useState('');
  const [newBarberSpecialty, setNewBarberSpecialty] = useState('');

  // State Input Fitur Jam Tidak Tersedia (Block Time)
  const [selectedBarber, setSelectedBarber] = useState('');
  const [blockDay, setBlockDay] = useState('Monday');
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:00');
  const [, setIsLoading] = useState(true);

  // State untuk Fitur Edit Kapster
  const [editingBarber, setEditingBarber] = useState(null); 
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editImage, setEditImage] = useState('');

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

      const resBlocked = await fetch('/api/blocked-slots');
      if (resBlocked.ok) setBlockedSlots(await resBlocked.json());
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { 
    loadAllData(); 
  }, []);

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
      body: JSON.stringify({ 
        name: newBarberName, 
        role: newBarberRole,
        image: newBarberImage || 'https://unsplash.com',
        specialty: newBarberSpecialty || 'Haircut Expert'
      }),
    });
    
    if (res.ok) { 
      setNewBarberName(''); 
      setNewBarberImage('');
      setNewBarberSpecialty(''); 
      loadAllData(); 
    }
  };

  // Fungsi pembaca file gambar saat tambah kapster baru
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        alert("Ukuran berkas terlalu besar! Maksimal 1MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBarberImage(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  // Fungsi pembaca file gambar saat EDIT profil kapster
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Ukuran berkas terlalu besar! Maksimal 1MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setEditImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Mengirim data pembaruan ke API Backend PATCH
  const handleUpdateBarber = async (e) => {
    e.preventDefault();
    if (!editName) return;

    const res = await fetch(`/api/barbers?id=${editingBarber._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        specialty: editSpecialty,
        image: editImage
      }),
    });

    if (res.ok) {
      alert("Profil kapster berhasil diperbarui!");
      setEditingBarber(null); 
      loadAllData(); 
    } else {
      alert("Gagal memperbarui data.");
    }
  };

  const startEditBarber = (barber) => {
    setEditingBarber(barber);
    setEditName(barber.name);
    setEditSpecialty(barber.specialty || '');
    setEditImage(barber.image || '');
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
        loadAllData();
      } else {
        const errorData = await res.json();
        alert(`Gagal: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat menghubungi server.");
    }
  };

  const handleDeleteBlockedSlot = async (id) => {
    if (confirm('Buka kembali jam booking yang diblokir ini?')) {
      const res = await fetch(`/api/blocked-slots?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Jam booking berhasil dibuka kembali!");
        loadAllData();
      }
    }
  };

  const getBarberName = (id) => {
    if (!barbers || !Array.isArray(barbers)) return 'Kapster tidak diketahui';
    const found = barbers.find(b => b._id === id);
    return found ? found.name : 'Kapster tidak diketahui';
  };

  const translateDay = (day) => {
    const days = { Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu' };
    return days[day] || day;
  };

  const extractPrice = (serviceString) => {
    if (!serviceString) return 0;
    const match = serviceString.match(/Rp\s*([\d.]+)/);
    if (match && match[1]) {
      return parseInt(match[1].replace(/\./g, ''), 10);
    }
    return 0;
  };

  // Proteksi Array Ketat
  const validHistory = Array.isArray(history) ? history : [];
  const validAppointments = Array.isArray(appointments) ? appointments : [];
  const validBarbers = Array.isArray(barbers) ? barbers : [];
  const validServices = Array.isArray(services) ? services : [];
  const validBlockedSlots = Array.isArray(blockedSlots) ? blockedSlots : [];

  const totalOmzet = validHistory.reduce((acc, curr) => acc + extractPrice(curr.service), 0);
  const omzetTunai = validHistory.filter(item => item.paymentMethod === 'Tunai').reduce((acc, curr) => acc + extractPrice(curr.service), 0);
  const omzetQris = validHistory.filter(item => item.paymentMethod === 'QRIS').reduce((acc, curr) => acc + extractPrice(curr.service), 0);

  const jumlahTunai = validHistory.filter(item => item.paymentMethod === 'Tunai').length;
  const jumlahQris = validHistory.filter(item => item.paymentMethod === 'QRIS').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 1. HEADER */}
        <div className="flex justify-between items-center border-b border-neutral-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif text-amber-500">Dashboard Admin Boytax Barber</h1>
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

        {/* 2. MENU HUBUNGAN CETAK LAPORAN & RINGKASAN OMZET */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-neutral-900/40 p-4 border border-neutral-800/60 rounded-xl">
            <div>
              <h2 className="text-md font-bold text-amber-500 font-serif">📊 Ringkasan Finansial Hari Ini</h2>
              <p className="text-[11px] text-neutral-400">Gunakan tombol kanan untuk membuka manifes cetak bersih dokumen laporan keuangan.</p>
            </div>
            <a 
              href="/api/download-pdf" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-xs font-sans transition tracking-wide flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              📥 Unduh Laporan PDF Hari Ini
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-md">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">💰 Total Pendapatan Hari Ini</p>
              <h3 className="text-2xl font-bold font-mono text-amber-500 mt-2">Rp {totalOmzet.toLocaleString('id-ID')}</h3>
              <p className="text-[10px] text-neutral-500 mt-1">Akumulasi seluruh transaksi sukses.</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-md">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">💵 Pendapatan Kasir (Tunai)</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-500 mt-2">Rp {omzetTunai.toLocaleString('id-ID')}</h3>
              <p className="text-[10px] text-emerald-400/80 font-medium mt-1">✓ Berhasil: {jumlahTunai} Transaksi</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-md">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">📱 Pendapatan Bank (QRIS)</p>
              <h3 className="text-2xl font-bold font-mono text-cyan-400 mt-2">Rp {omzetQris.toLocaleString('id-ID')}</h3>
              <p className="text-[10px] text-cyan-400/80 font-medium mt-1">✓ Berhasil: {jumlahQris} Transaksi</p>
            </div>
          </div>
        </div>

        {/* 3. PANELS (KELOLA KAPSTER & LAYANAN) */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Kelola Kapster Premium dengan Sistem Upload File */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-amber-500">✂️ Kelola Kapster</h2>
            <form onSubmit={handleAddBarber} className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase font-semibold">Nama Lengkap</label>
                <input type="text" required placeholder="Contoh: Gilang Putra" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase font-semibold">Catatan Keahlian / Spesialisasi</label>
                <input type="text" placeholder="Contoh: Fade & Pompadour Expert" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100" value={newBarberSpecialty} onChange={(e) => setNewBarberSpecialty(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase font-semibold">Unggah Foto Profil (.jpg/.png)</label>
                <input type="file" accept="image/*" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-amber-500 file:text-neutral-950 cursor-pointer" onChange={handleFileChange} />
                <p className="text-[9px] text-neutral-500 mt-1">*Disarankan foto rasio kotak (1:1) dengan ukuran maksimal berkas 1MB.</p>
              </div>

              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs self-end transition">Tambah Kapster</button>
            </form>

            <div className="max-h-40 overflow-y-auto space-y-2 mt-4 pt-2 border-t border-neutral-800/60">
              {validBarbers.map(b => (
                <div key={b._id} className="bg-neutral-950 p-2 rounded border border-neutral-800 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={b.image || 'https://unsplash.com'} alt="" className="w-8 h-8 rounded-full object-cover border border-neutral-800" />
                    <div>
                      <div className="font-semibold text-neutral-200">{b.name}</div>
                      <div className="text-[9px] text-amber-500/80">{b.specialty || 'Haircut Expert'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => startEditBarber(b)} className="text-amber-500 hover:text-amber-400 font-medium px-1">✏️</button>
                    <button type="button" onClick={() => handleDeleteBarber(b._id)} className="text-red-400 hover:text-red-500 px-1">❌</button>
                  </div>
                </div>
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
              {validServices.map(s => (
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
                {validBarbers.map(b => (
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
          <div className="mt-6 pt-4 border-t border-neutral-800">
            <h3 className="text-sm font-bold text-amber-500 mb-3">📋 Daftar Slot Jam Terkunci Saat Ini</h3>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              {validBlockedSlots.length === 0 ? (
                <div className="p-4 text-center text-neutral-600 text-xs">Belum ada jam kerja kapster yang diblokir.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Nama Kapster</th>
                      <th className="p-2">Hari</th>
                      <th className="p-2">Rentang Waktu</th>
                      <th className="p-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {validBlockedSlots.map((slot) => (
                      <tr key={slot._id} className="hover:bg-neutral-900/50">
                        <td className="p-2 text-neutral-200 font-medium">{getBarberName(slot.barberId)}</td>
                        <td className="p-2 text-neutral-400">{translateDay(slot.day)}</td>
                        <td className="p-2"><span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/10 font-mono">{slot.startTime} - {slot.endTime}</span></td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => handleDeleteBlockedSlot(slot._id)} className="text-red-500 hover:text-red-400 font-bold">Buka Blokir</button>
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
            {validAppointments.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">Tidak ada antrean aktif.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950 text-amber-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Nama Pelanggan</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">Kapster Request</th>
                    <th className="p-4">Pembayaran</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {validAppointments.map((item) => (
                    <tr key={item._id} className="hover:bg-neutral-950/40">
                      <td className="p-4 text-neutral-200">{item.name}</td>
                      <td className="p-4 text-neutral-400">{item.service}</td>
                      <td className="p-4"><span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-1 rounded border border-amber-500/20">{item.barber}</span></td>
                      <td className="p-4">
                        {item.paymentMethod === 'QRIS' ? (
                          <a href={item.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-1 rounded border border-cyan-500/20 font-medium hover:bg-cyan-500/20 transition">
                            📱 Lihat Bukti QRIS
                          </a>
                        ) : (
                          <span className="bg-neutral-950 text-neutral-400 text-xs px-2 py-1 rounded border border-neutral-800 font-medium">
                            💵 Tunai / Kasir
                          </span>
                        )}
                      </td>
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
            {validHistory.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">Belum ada riwayat transaksi hari ini.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-950 text-emerald-500 text-xs uppercase">
                  <tr>
                    <th className="p-4">Nama Pelanggan</th>
                    <th className="p-4">Layanan</th>
                    <th className="p-4">Diselesaikan Oleh (Kapster)</th>
                    <th className="p-4">Metode</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {validHistory.map((item, idx) => (
                    <tr key={idx} className="bg-emerald-950/5 hover:bg-emerald-950/10 transition">
                      <td className="p-4 text-neutral-300 font-medium">{item.name}</td>
                      <td className="p-4 text-neutral-400">{item.service}</td>
                      <td className="p-4">
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold">
                          🪒 {item.completedBy}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.paymentMethod === 'QRIS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                          {item.paymentMethod === 'QRIS' ? '📱 QRIS' : '💵 Tunai'}
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

      {/* POPUP MODAL UNTUK EDIT DATA KAPSTER */}
      {editingBarber && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">✏️ Edit Profil Kapster</h3>
              <button type="button" onClick={() => setEditingBarber(null)} className="text-neutral-500 hover:text-neutral-300 font-mono text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateBarber} className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase font-semibold">Nama Lengkap</label>
                <input type="text" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase font-semibold">Spesialisasi / Keahlian</label>
                <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-100" value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} />
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 mb-1 uppercase font-semibold">Ganti Foto Profil (Opsional)</label>
                <div className="flex items-center gap-3 mt-1">
                  <img src={editImage || 'https://unsplash.com'} alt="" className="w-10 h-10 rounded-full object-cover border border-neutral-800 bg-neutral-950" />
                  <input type="file" accept="image/*" className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-[11px] text-neutral-400 file:mr-2 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[9px] file:bg-amber-500 file:text-neutral-950 cursor-pointer" onChange={handleEditFileChange} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingBarber(null)} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg text-xs font-semibold">Batal</button>
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 px-4 py-1.5 rounded-lg text-xs font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
