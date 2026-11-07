'use client';
import { useState, useEffect } from 'react';

export default function CustomerHomepage() {
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentProofFile, setPaymentProofFile] = useState(null); // Penampung berkas gambar QRIS
  
  // State untuk form pemesanan yang terpilih
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
    if (!bookingForm.customerName || !bookingForm.service) {
      alert("Mohon lengkapi nama dan jenis layanan!");
      return;
    }

    // VALIDASI KETAT: Jika pilih QRIS tetapi file gambar masih kosong
    if (bookingForm.paymentMethod === 'QRIS' && !paymentProofFile) {
      alert("Harap unggah gambar bukti pembayaran transaksi QRIS Anda terlebih dahulu!");
      return;
    }

    try {
      let response;

      if (bookingForm.paymentMethod === 'QRIS') {
        // JALUR A: Mengirim data sebagai FormData jika memilih QRIS agar berkas terunggah ke server
        const formDataToSend = new FormData();
        formDataToSend.append('name', bookingForm.customerName);
        formDataToSend.append('service', bookingForm.service);
        formDataToSend.append('barber', selectedBarber.name);
        formDataToSend.append('paymentMethod', 'QRIS');
        formDataToSend.append('paymentProof', paymentProofFile); // Mengirim file gambar fisik

        response = await fetch('/api/appointments', {
          method: 'POST',
          body: formDataToSend // Browser otomatis menangani Content-Type multipart/form-data
        });
      } else {
        // JALUR B: Mengirim data sebagai JSON biasa jika memilih Tunai di Kasir
        response = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: bookingForm.customerName,
            service: bookingForm.service,
            barber: selectedBarber.name,
            paymentMethod: 'Tunai'
          })
        });
      }

      if (response.ok) {
        alert(`Antrean berhasil dipesan untuk kapster ${selectedBarber.name}! Silakan datang tepat waktu.`);
        setSelectedBarber(null); // Tutup modal
        setPaymentProofFile(null); // Reset file gambar
        setBookingForm({ customerName: '', service: '', paymentMethod: 'Tunai' });
      } else {
        const result = await response.json();
        alert(result.message || "Gagal melakukan pemesanan. Coba beberapa saat lagi.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat menghubungi server.");
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
        
        {/* HERO HEADER */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold font-serif tracking-tight text-amber-500">BOYTAX HAIRSTUDIO</h1>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Pilih kapster andalan Anda, lihat rating performa kerja, dan pesan kursi antrean secara realtime.
          </p>
          <div className="w-16 h-0.5 bg-amber-500 mx-auto mt-4"></div>
        </div>

        {/* LIST PROFIL KAPSTER */}
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
                  <img src={barber.avatar} alt={barber.name} className="w-20 h-20 mx-auto rounded-full bg-neutral-950 p-1 border border-neutral-800 object-cover" />
                  <div>
                    <h3 className="text-lg font-bold text-neutral-200">{barber.name}</h3>
                    <p className="text-[11px] text-amber-500/90 font-medium">{barber.specialty}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1 bg-neutral-950/60 py-1.5 px-3 rounded-lg w-max mx-auto border border-neutral-800/40">
                    <span className="text-amber-400 text-xs">⭐ {barber.rating}</span>
                    <span className="text-neutral-500 text-[10px]">({barber.totalReviews} Penilaian)</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBarber(barber)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-2.5 rounded-xl text-xs tracking-wider uppercase transition duration-200"
                >
                  ✂️ Pesan Kursi {barber.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* POPUP MODAL/FORM PEMESANAN KONDISIONAL */}
        {selectedBarber && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-md font-bold text-neutral-200">Konfirmasi Pemesanan</h3>
                  <p className="text-xs text-amber-500 font-medium">Kapster Terpilih: {selectedBarber.name}</p>
                </div>
                <button onClick={() => { setSelectedBarber(null); setPaymentProofFile(null); }} className="text-neutral-500 hover:text-neutral-300 text-lg font-mono">✕</button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Nama Lengkap Anda</label>
                  <input 
                    type="text" required placeholder="Masukkan nama Anda..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Pilih Model / Layanan Rambut</label>
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

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`p-3 text-xs font-medium rounded-xl border transition ${bookingForm.paymentMethod === 'Tunai' ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}
                      onClick={() => { setBookingForm({ ...bookingForm, paymentMethod: 'Tunai' }); setPaymentProofFile(null); }}
                    >
                      💵 Tunai di Kasir
                    </button>
                    <button
                      type="button"
                      className={`p-3 text-xs font-medium rounded-xl border transition ${bookingForm.paymentMethod === 'QRIS' ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}
                      onClick={() => setBookingForm({ ...bookingForm, paymentMethod: 'QRIS' })}
                    >
                      📱 QRIS E-Wallet
                    </button>
                  </div>
                </div>

                {/* AREA TAMPILAN DINAMIS QRIS CODE & UPLOAD BUKTI DOKUMEN */}
                {bookingForm.paymentMethod === 'QRIS' && (
                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4 border-dashed border-amber-500/30">
                    <div className="flex flex-col items-center p-2 bg-white rounded-lg max-w-[160px] mx-auto">
                      <img 
                        src="https://qrserver.com" 
                        alt="QRIS Code" 
                        className="w-full h-auto aspect-square object-contain" 
                      />
                      <span className="text-[9px] text-neutral-800 font-bold tracking-wider mt-1">NMID : BOYTAX_BARBER</span>
                    </div>
                    <p className="text-center text-[11px] text-neutral-400 px-2">
                      Silakan scan barcode QRIS di atas untuk melakukan transfer sesuai dengan nominal harga layanan Anda.
                    </p>
                    <div className="pt-2 border-t border-neutral-800 text-left">
                      <label className="block text-[11px] font-semibold text-amber-500 uppercase mb-1.5">
                        Unggah Bukti Transfer Gambar (JPG/PNG)
                      </label>
                      <input 
                        type="file" required={bookingForm.paymentMethod === 'QRIS'} accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPaymentProofFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-neutral-950 hover:file:bg-amber-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-3 rounded-xl text-xs tracking-wider uppercase transition mt-2"
                >
                  🚀 Konfirmasi Antrean Sekarang
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
