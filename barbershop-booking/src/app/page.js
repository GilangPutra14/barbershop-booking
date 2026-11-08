'use client';
import { useState, useEffect } from 'react';

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
          rating: (4.5 + (idx % 5) * 0.1).toFixed(1),
          totalReviews: 12 + (idx * 7),
          specialty: b.specialty || 'Classic Haircut Expert', 
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
      if (bookingForm.paymentMethod === 'QRIS') {
        const formDataToSend = new FormData();
        formDataToSend.append('name', bookingForm.customerName);
        formDataToSend.append('service', bookingForm.service);
        formDataToSend.append('barber', selectedBarber.name);
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
            barber: selectedBarber.name,
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
        loadData(); // Segarkan status jam terbaru
      } else {
        // 🔒 PERBAIKAN UTAMA: MENAMPILKAN PERINGATAN ASLI TUTUP DARI SERVER BACKEND
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
        <p className="text-sm tracking-widest animate-pulse">MEMUAT PROFIL KAPSTER PREMIUM...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold font-serif tracking-tight text-amber-500">BOYTAX HAIRSTUDIO</h1>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Amankan kursi Anda. Pilih kapster bertugas hari ini dan pesan slot antrean secara realtime.
          </p>
          <div className="w-16 h-0.5 bg-amber-500 mx-auto mt-4"></div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase text-center sm:text-left">
            💈 Daftar Kapster Bertugas Hari Ini
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <div 
                key={barber._id} 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-amber-500/40 transition duration-300 shadow-xl"
              >
                <div className="text-center space-y-2">
                  <img src={barber.avatar} alt={barber.name} className="w-20 h-20 mx-auto rounded-full bg-neutral-950 p-1 border border-neutral-800 object-cover animate-fadeIn" />
                  <div>
                    <h3 className="text-lg font-bold text-neutral-200">{barber.name}</h3>
                    <p className="text-[11px] text-amber-500/90 font-medium">{barber.role || 'Professional Barber'}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1 bg-neutral-950/60 py-1.5 px-3 rounded-lg w-max mx-auto border border-neutral-800/40">
                    <span className="text-amber-400 text-xs">⭐ {barber.rating}</span>
                    <span className="text-neutral-500 text-[10px]">({barber.totalReviews} Ulasan)</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBarber(barber)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition duration-200"
                >
                  ✂️ Kunci Kursi {barber.name}
                </button>
              </div>
            ))}
          </div>
        </div>
        {selectedBarber && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-md font-bold text-neutral-200">Konfirmasi Protokol Ritual</h3>
                  <p className="text-xs text-amber-500 font-medium">Hair Artist: {selectedBarber.name}</p>
                </div>
                <button onClick={() => { setSelectedBarber(null); setPaymentProofFile(null); }} className="text-neutral-500 hover:text-neutral-300 text-lg font-mono">✕</button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Nama Pria Terhormat (Gentleman Name)</label>
                  <input 
                    type="text" required placeholder="Masukkan nama lengkap Anda..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Pilih Menu Ritual Perawatan</label>
                  <select
                    required className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    value={bookingForm.service}
                    onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                  >
                    <option value="">-- Pilih Layanan Rambut --</option>
                    {services.map((s) => (
                      <option key={s._id} value={`${s.name} (Rp ${s.price.toLocaleString('id-ID')})`}>
                        {s.name} - Rp {s.price.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div>
                  <label className="block text-xs text-neutral-400 mb-1">Pilih Tanggal Kunjungan</label>
                  <input 
                    type="date" required
                    min={new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"})).toISOString().split('T')[0]}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                    value={bookingDate}
                    onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }}
                  />
                </div> */}

                                {/* INPUT TANGGAL DENGAN PEMBATASAN BINDING MIN & MAX WAKTU LOKAL */}
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Pilih Tanggal Kunjungan</label>
                  <input 
                    type="date" 
                    required
                    // 🔒 Mengunci kalender paling awal agar tidak bisa memilih hari kemarin
                    min={(() => {
                      const hariIni = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
                      const yyyy = hariIni.getFullYear();
                      const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
                      const dd = String(hariIni.getDate()).padStart(2, '0');
                      return `${yyyy}-${mm}-${dd}`;
                    })()}
                    // 🔒 Membatasi pemesanan maksimal hanya 7 hari ke depan dari hari ini
                    max={(() => {
                      const maxDate = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
                      maxDate.setDate(maxDate.getDate() + 7); // Ubah angka 7 jika ingin mengubah batas harinya
                      const yyyy = maxDate.getFullYear();
                      const mm = String(maxDate.getMonth() + 1).padStart(2, '0');
                      const dd = String(maxDate.getDate()).padStart(2, '0');
                      return `${yyyy}-${mm}-${dd}`;
                    })()}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                    value={bookingDate}
                    onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }}
                  />
                </div>


                {bookingDate && (
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Pilih Jam Slot Tersedia</label>
                    <select
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                    >
                      <option value="">-- Pilih Jam Kunjungan --</option>
                      {(() => {
                        const jamOperasional = [
                          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                          '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
                          '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
                          '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
                        ];

                        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const namaHariTerpilih = daysOfWeek[new Date(`${bookingDate}T00:00:00`).getDay()];

                        const slotsSibuk = blockedSlots ? blockedSlots.filter(slot => 
                          (slot.barberId === selectedBarber._id.toString() || slot.barberId === selectedBarber._id) && slot.day === namaHariTerpilih
                        ) : [];

                        const convertToMinutes = (tStr) => {
                          if (!tStr) return 0;
                          const [h, m] = tStr.trim().substring(0, 5).split(':');
                          return (parseInt(h, 10) * 60) + parseInt(m, 10);
                        };

                        return jamOperasional
                          .filter(jam => {
                            const currentMinutes = convertToMinutes(jam);
                            
                            // 1. Validasi Blokir Admin
                            const isBlocked = slotsSibuk.some(slot => {
                              const start = convertToMinutes(slot.startTime);
                              const end = convertToMinutes(slot.endTime);
                              return start > end ? (currentMinutes >= end && currentMinutes <= start) : (currentMinutes >= start && currentMinutes <= end);
                            });

                            // 2. Validasi Bentrok Sesama Pelanggan
                            const isAlreadyBooked = activeAppointments.some(app => 
                              app.barber === selectedBarber.name &&
                              app.date === bookingDate &&
                              app.time.substring(0, 5) === jam &&
                              app.status === 'Active'
                            );

                            return !isBlocked && !isAlreadyBooked;
                          })
                          .map(jam => (
                            <option key={jam} value={jam}>{jam} WIB</option>
                          ));
                      })()}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Metode Transaksi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`p-3 text-xs font-semibold rounded-xl border transition ${bookingForm.paymentMethod === 'Tunai' ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}
                      onClick={() => { setBookingForm({ ...bookingForm, paymentMethod: 'Tunai' }); setPaymentProofFile(null); }}
                    >
                      💵 Tunai di Kasir
                    </button>
                    <button
                      type="button"
                      className={`p-3 text-xs font-semibold rounded-xl border transition ${bookingForm.paymentMethod === 'QRIS' ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}
                      onClick={() => setBookingForm({ ...bookingForm, paymentMethod: 'QRIS' })}
                    >
                      📱 QRIS E-Wallet
                    </button>
                  </div>
                </div>

                {bookingForm.paymentMethod === 'QRIS' && (
                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
                    <div className="flex flex-col items-center p-2 bg-white rounded-lg max-w-[150px] mx-auto shadow-xl">
                      <img src="https://qrserver.com" alt="QRIS Code" className="w-full h-auto aspect-square object-contain" />
                      <span className="text-[9px] text-neutral-800 font-bold tracking-wider mt-1">NMID : BOYTAX_BARBER</span>
                    </div>
                    <input 
                      type="file" required={bookingForm.paymentMethod === 'QRIS'} accept="image/*"
                      onChange={(e) => { if (e.target.files && e.target.files[0]) setPaymentProofFile(e.target.files[0]); }}
                      className="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-neutral-950 hover:file:bg-amber-600 cursor-pointer"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition mt-4"
                >
                  ✂️ Kunci Janji Temu Sekarang
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
