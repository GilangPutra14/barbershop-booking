'use client';
import { useState, useEffect } from 'react';
import { FaInstagram, FaTiktok } from 'react-icons/fa6';

export default function CustomerHomepage() {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentProofFile, setPaymentProofFile] = useState(null); 
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [activeAppointments, setActiveAppointments] = useState([]);

  const [selectedBarber, setSelectedBarber] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    service: '',
    paymentMethod: 'Tunai'
  });
  async function loadData() {
    try {
      const resBarbers = await fetch('/api/barbers');
      const resServices = await fetch('/api/services');
      const resBlocked = await fetch('/api/blocked-slots'); 
      const resApps = await fetch('/api/appointments');
      
      if (resBarbers.ok) {
        const barbersData = await resBarbers.json();
        const enrichedBarbers = barbersData.map((b, idx) => ({
          ...b,
          rating: (4.8 + (idx % 3) * 0.1).toFixed(1),
          totalReviews: 32 + (idx * 12),
          specialty: b.specialty || 'Classic & Modern Cut Expert', 
          avatar: b.image || 'https://unsplash.com'
        }));
        setBarbers(enrichedBarbers);
      }
      if (resServices.ok) setServices(await resServices.json());
      if (resBlocked.ok) setBlockedSlots(await resBlocked.json()); 
      if (resApps.ok) setActiveAppointments(await resApps.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);
    const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.customerName || !bookingForm.service || !bookingDate || !bookingTime) {
      alert("Mohon lengkapi nama, layanan, tanggal, dan jam kunjungan!");
      return;
    }

    if (bookingForm.paymentMethod === 'QRIS' && !paymentProofFile) {
      alert("Harap unggah gambar bukti pembayaran transaksi QRIS Anda terlebih dahulu!");
      return;
    }

    try {
      let response;
      
      // Ambil string ID kapster secara aman (mendukung format teks biasa maupun $oid MongoDB)
      const stringIdBarber = selectedBarber._id?.$oid || selectedBarber._id?.toString() || '';

      if (bookingForm.paymentMethod === 'QRIS') {
        const formDataToSend = new FormData();
        formDataToSend.append('name', bookingForm.customerName);
        formDataToSend.append('service', bookingForm.service);
        
        // 🔒 AMAN: Bersihkan nama dari spasi ujung & kirim ID kapster sekalian
        formDataToSend.append('barber', selectedBarber.name.trim());
        formDataToSend.append('barberId', stringIdBarber);
        
        formDataToSend.append('date', bookingDate); 
        formDataToSend.append('time', bookingTime); 
        formDataToSend.append('paymentMethod', 'QRIS');
        formDataToSend.append('paymentProof', paymentProofFile);

        response = await fetch('/api/appointments', { method: 'POST', body: formDataToSend });
      } else {
        response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: bookingForm.customerName,
            service: bookingForm.service,
            
            // 🔒 AMAN: Bersihkan nama dari spasi ujung & kirim ID kapster sekalian
            barber: selectedBarber.name.trim(),
            barberId: stringIdBarber,
            
            date: bookingDate, 
            time: bookingTime, 
            paymentMethod: 'Tunai'
          })
        });
      }

      const result = await response.json();

      if (response.ok) {
        alert(`🎉 Sukses: ${result.message || 'Antrean berhasil dipesan!'}`);
        setSelectedBarber(null);
        setBookingDate('');
        setBookingTime('');
        setPaymentProofFile(null);
        setBookingForm({ customerName: '', service: '', paymentMethod: 'Tunai' });
        loadData(); 
      } else {
        alert(`⚠️ Peringatan: ${result.message || 'Gagal melakukan pemesanan.'}`);
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Terjadi gangguan koneksi ke server.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs tracking-widest uppercase font-semibold text-neutral-500">Membuka Studio Premium...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950 relative overflow-x-hidden">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 relative z-10">
        
        {/* HERO LOGO EXECUTIVE HEADER & SLOGAN */}
        <div className="text-center space-y-4 pt-6">
          <div className="flex items-center justify-center gap-3 text-amber-500 mb-2">
            <span className="text-2xl">✂️</span>
            <span className="h-6 w-[1px] bg-neutral-800"></span>
            <span className="text-xs font-bold tracking-[0.3em] uppercase">Est. 2024</span>
            <span className="h-6 w-[1px] bg-neutral-800"></span>
            <span className="text-2xl">💈</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black font-serif tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400">
            BOYTAX BARBER.CO
          </h1>
          
          <p className="text-amber-500/90 font-serif italic text-sm md:text-base tracking-wide">
            "Where Sharpness Meets Gentleman Dignity."
          </p>
          
          <p className="text-neutral-400 text-xs max-w-md mx-auto leading-relaxed font-light">
            Lebih dari sekadar potong rambut, ini adalah ritual kepercayaan diri. Pilih Hair Artist andalan Anda dan amankan slot antrean tanpa membuang waktu berharga.
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mt-4"></div>
        </div>
        {/* SECTION UTAMA DAFTAR ARTIST */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-neutral-800 pb-4 gap-2">
            <h2 className="text-sm font-bold text-neutral-300 tracking-[0.2em] uppercase flex items-center gap-2.5">
              <span className="w-1 h-3.5 bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b]"></span>
              💈 MASTER GROOMER ON DUTY
            </h2>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10">
              ⚡ LIVE REALTIME MANIFES
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <div 
                key={barber._id} 
                className="group bg-neutral-900 border border-neutral-800/60 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 hover:bg-neutral-900/40 transition duration-300 shadow-xl relative overflow-hidden"
              >
                <div className="text-center space-y-4 relative z-10">
                  <div className="w-28 h-28 mx-auto rounded-full p-1 border border-neutral-800 group-hover:border-amber-500/40 transition duration-300 overflow-hidden bg-neutral-950 shadow-inner">
                    <img src={barber.avatar} alt={barber.name} className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition duration-500 scale-100 group-hover:scale-105" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-serif font-bold text-neutral-100 group-hover:text-amber-500 transition duration-200">{barber.name}</h3>
                    <p className="text-[9px] font-bold text-amber-500/80 tracking-widest uppercase bg-amber-500/5 py-0.5 px-2 rounded w-max mx-auto border border-amber-500/10">{barber.role || 'Senior Barber'}</p>
                    <p className="text-[11px] text-neutral-400 font-light pt-0.5 italic">{barber.specialty}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-neutral-950/80 border border-neutral-800/60 py-1 px-3 rounded-full w-max mx-auto">
                    <span className="text-amber-400 text-xs font-bold font-mono">⭐ {barber.rating}</span>
                    <span className="text-neutral-500 text-[10px]">({barber.totalReviews} Ulasan)</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBarber(barber)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black py-3 rounded-xl text-[10px] tracking-widest uppercase transition duration-200 mt-6 shadow-md shadow-amber-500/5"
                >
                  ✂️ Kunci Kursi {barber.name}
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* LUXURY INFORMATION FOOTER (MAPS, CONTACT & OPERATIONAL) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-neutral-900 text-xs text-neutral-400">
          {/* <div className="space-y-4">
            <h3 className="text-neutral-200 font-bold uppercase tracking-wider text-amber-500">📍 BOYTAX STUDIO</h3>
            <p className="leading-relaxed font-light">Premium Men's Grooming Hub.<br />Melayani potong rambut modern, hot towel shaving, hair coloring, dan premium wash.</p>
            <div className="space-y-2 pt-2">
              <p className="flex items-center gap-2"><span>📱</span> <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition">@boytaxhairstudio</a></p>
              <p className="flex items-center gap-2"><span>📞</span> <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition">+62 812-3456-7890</a></p>
              <p className="flex items-center gap-2"><span>📞</span> <a href="https://Tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition">@boytaxhairstudio</a></p>
            </div>
          </div> */}
          <div className="space-y-2 pt-2">
  {/* Ikon Instagram */}
  <p className="flex items-center gap-2">
    <span className="text-neutral-400"><FaInstagram size={16} /></span> 
    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition">@boytaxhairstudio</a>
  </p>
  
  {/* Ikon WhatsApp */}
  <p className="flex items-center gap-2">
    <span>📞</span> 
    <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition">+62 812-3456-7890</a>
  </p>
  
  {/* Ikon TikTok */}
  <p className="flex items-center gap-2">
    <span className="text-neutral-400"><FaTiktok size={14} /></span> 
    <a href="https://Tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition">@boytaxhairstudio</a>
  </p>
</div>


          <div className="space-y-4">
            <h3 className="text-neutral-200 font-bold uppercase tracking-wider text-amber-500">⏰ JAM OPERASIONAL</h3>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between border-b border-neutral-900 pb-1.5"><span className="font-sans text-neutral-300">Senin - Jumat</span><span className="text-amber-500 font-bold">09:00 - 21:00 WIB</span></div>
              <div className="flex justify-between border-b border-neutral-900 pb-1.5"><span className="font-sans text-neutral-300">Sabtu - Minggu</span><span className="text-amber-500 font-bold">09:00 - 22:00 WIB</span></div>
              <p className="text-[10px] text-neutral-500 font-sans italic pt-1">*Batas akhir sistem online tutup pukul 21:00 WIB.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-neutral-200 font-bold uppercase tracking-wider text-amber-500">🗺️ LOKASI BOYTAX HAIRSTUDIO</h3>
            <div className="w-full h-32 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-md">
              <iframe src="https://google.com" className="w-full h-full border-0 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition duration-300" allowFullScreen="" loading="lazy"></iframe>
            </div>
            <p className="text-[10px] text-neutral-500 leading-snug">Jl. Klayatan Gg. 3 No.16, Bandungrejosari, Kec. Sukun, Kota Malang, Jawa Timur 65148</p>
          </div>
        </div>

        <div className="text-center text-[10px] text-neutral-600 font-mono pt-4 border-t border-neutral-900">
          © {new Date().getFullYear()} BOYTAX HAIRSTUDIO. ALL RIGHTS RESERVED.
        </div>

        {/* POPUP MODAL DIALOG PEMESANAN */}
        {selectedBarber && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                <div><h3 className="text-md font-serif font-bold text-neutral-100">Konfirmasi Janji Temu</h3><p className="text-xs text-amber-500 font-medium">Hair Artist: {selectedBarber.name}</p></div>
                <button onClick={() => { setSelectedBarber(null); setPaymentProofFile(null); }} className="text-neutral-500 hover:text-neutral-200 text-lg">✕</button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <input type="text" required placeholder="Nama Lengkap Gentleman..." className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-100 focus:border-amber-500 focus:outline-none" value={bookingForm.customerName} onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })} />
                <select required className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none" value={bookingForm.service} onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })} >
                  <option value="">-- Pilih Layanan Perawatan --</option>
                  {services.map((s) => <option key={s._id} value={`${s.name} (Rp ${s.price.toLocaleString('id-ID')})`}>{s.name} - Rp {s.price.toLocaleString('id-ID')}</option>)}
                </select>
                <input type="date" required min={(() => { const h = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"})); return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(h.getDate()).padStart(2, '0')}`; })()} max={(() => { const m = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"})); m.setDate(m.getDate() + 7); return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-${String(m.getDate()).padStart(2, '0')}`; })()} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }} />
                
                {bookingDate && (
                  <select required className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none font-mono" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}>
                    <option value="">-- Pilih Jam Slot --</option>
                    {(() => {
                      const jamOperasional = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const hari = days[new Date(`${bookingDate}T00:00:00`).getDay()];
                      const sibuk = blockedSlots ? blockedSlots.filter(s => (s.barberId === selectedBarber._id.toString() || s.barberId === selectedBarber._id) && s.day === hari) : [];
                      const toMin = (t) => { const [h, m] = t.split(':'); return (parseInt(h,10)*60)+parseInt(m,10); };
                      return jamOperasional.filter(jam => {
                        const cur = toMin(jam);
                        const isB = sibuk.some(s => { const st = toMin(s.startTime); const ed = toMin(s.endTime); return st > ed ? (cur >= ed && cur <= st) : (cur >= st && cur <= ed); });
                        const isA = activeAppointments.some(a => a.barber === selectedBarber.name && a.date === bookingDate && a.time.substring(0, 5) === jam && a.status === 'Active');
                        return !isB && !isA;
                      }).map(jam => <option key={jam} value={jam}>{jam} WIB</option>);
                    })()}
                  </select>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <button type="button" className={`p-3 rounded-xl border transition ${bookingForm.paymentMethod === 'Tunai' ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-500'}`} onClick={() => { setBookingForm({ ...bookingForm, paymentMethod: 'Tunai' }); setPaymentProofFile(null); }}>💵 TUNAI</button>
                  <button type="button" className={`p-3 rounded-xl border transition ${bookingForm.paymentMethod === 'QRIS' ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-500'}`} onClick={() => setBookingForm({ ...bookingForm, paymentMethod: 'QRIS' })}>📱 QRIS</button>
                </div>
                {bookingForm.paymentMethod === 'QRIS' && (
                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3 text-center">
                    <img src="https://qrserver.com" alt="QRIS" className="mx-auto bg-white p-1 rounded-lg" />
                    <input type="file" required accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) setPaymentProofFile(e.target.files[0]); }} className="w-full text-[11px]" />
                  </div>
                )}
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black py-3.5 rounded-xl text-xs tracking-widest uppercase transition">🚀 Amankan Antrean Sekarang</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
