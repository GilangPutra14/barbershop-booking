'use client';
import { useState, useEffect } from 'react';


export default function BookingPage() {
  const [formData, setFormData] = useState({
    name: '',
    service: 'Classic Haircut',
    barber: 'Fadholi (Senior)',
    date: '',
    time: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dbBarbers, setDbBarbers] = useState([]);
  const [dbServices, setDbServices] = useState([]);

// Ambil daftar kapster dinamis saat halaman dibuka
  useEffect(() => {
    async function getBarbers() {
      const res = await fetch('/api/barbers');
      if (res.ok) setDbBarbers(await res.json());
    }
    getBarbers();
  }, []);

   useEffect(() => {
     async function getData() {
       const resBarbers = await fetch('/api/barbers');
       if (resBarbers.ok) setDbBarbers(await resBarbers.json());

       const resServices = await fetch('/api/services');
       if (resServices.ok) setDbServices(await resServices.json());
     }
     getData();
   }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(result.message || 'Gagal mengirim data booking.');
      }
      {
        /* Tambahkan kode peringatan ini di dalam src/app/booking/page.js */}
{errorMessage && (
  <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm mb-4">
    ⚠️ {errorMessage}
  </div>
)}

    } catch (error) {
      setErrorMessage('Koneksi internet bermasalah atau server mati.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-12 font-sans flex items-center justify-center">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl">
        
        <div className="mb-8">
          <a href="/" className="text-amber-500 hover:text-amber-400 text-sm font-medium transition duration-200">
            ← Kembali ke Beranda
          </a>
          <h1 className="text-3xl font-serif font-bold text-amber-500 mt-4">Formulir Booking Slot</h1>
          <p className="text-neutral-400 text-sm mt-1">Silakan isi detail kunjungan Anda di bawah ini.</p>
        </div>

        {isSubmitted ? (
          <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl text-center">
            <h3 className="text-xl font-bold text-amber-500 mb-2">🎉 Booking Berhasil!</h3>
            <p className="text-neutral-300 text-sm mb-4">Jadwal Anda telah tercatat di sistem kami.</p>
            <div className="text-left bg-neutral-950 p-4 rounded-lg text-xs space-y-2 text-neutral-400 font-mono">
              <p><span className="text-amber-500">Nama:</span> {formData.name}</p>
              <p><span className="text-amber-500">Layanan:</span> {formData.service}</p>
              <p><span className="text-amber-500">Kapster:</span> {formData.barber}</p>
              <p><span className="text-amber-500">Jadwal:</span> {formData.date} Pukul {formData.time} WIB</p>
            </div>
            <button 
              onClick={() => setIsSubmitted(false)}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-3 rounded-lg text-sm transition duration-200"
            >
              Buat Janji Baru
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
           {errorMessage && (
  <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm font-medium">
    ⚠️ {errorMessage}
  </div>
)}

            {/* Input Nama */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Nama Lengkap</label>
              <input 
                type="text" 
                required
                placeholder="Masukkan nama Anda"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Pilih Layanan */}
            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Pilih Layanan</label>
              <select 
    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
    value={formData.service}
    onChange={(e) => setFormData({...formData, service: e.target.value})}
  >
    {dbServices.length === 0 ? (
      <option>Memuat layanan...</option>
    ) : (
      dbServices.map((s) => (
        <option key={s._id} value={`${s.name} (Rp ${s.price.toLocaleString('id-ID')})`}>
          {s.name} - Rp {s.price.toLocaleString('id-ID')} ({s.duration})
        </option>
      ))
    )}
  </select>
            </div>

            {/* Pilih Kapster */}
<div>
  <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Pilih Kapster</label>
  <select
    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
    value={formData.barber}
    onChange={(e) => setFormData({ ...formData, barber: e.target.value })}
  >
    <option value="Siapa Saja (Ketersediaan Tercepat)">Siapa Saja (Ketersediaan Tercepat)</option>
    {dbBarbers && dbBarbers.map((b) => (
      <option key={b._id} value={`${b.name} (${b.role})`}>
        {b.name} ({b.role})
      </option>
    ))}
  </select>
</div>


            {/* Tanggal & Jam */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Tanggal</label>
                <input 
  type="date" 
  required
  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:invert"
  value={formData.date}
  onChange={(e) => setFormData({...formData, date: e.target.value})}
/>

              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Jam Slot</label>
                <input 
  type="time" 
  required
  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:invert"
  value={formData.time}
  onChange={(e) => setFormData({...formData, time: e.target.value})}
/>

              </div>
            </div>

            {/* Tombol Submit */}
            <button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-4 rounded-lg tracking-wide shadow-lg shadow-amber-500/10 transition duration-300 mt-4"
            >
              {isLoading ? 'MEMPROSES...' : 'KONFIRMASI JADWAL'}

            </button>
          </form>
        )}
      </div>
    </div>
  );
}
