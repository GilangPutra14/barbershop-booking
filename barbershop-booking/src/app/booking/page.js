// 'use client';
// import { useState, useEffect } from 'react';

// export default function BookingPage() {
//   const [formData, setFormData] = useState({
//     name: '',
//     service: '',
//     barber: 'Siapa Saja (Ketersediaan Tercepat)',
//     date: '',
//     time: '',
//   });

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [dbBarbers, setDbBarbers] = useState([]);
//   const [dbServices, setDbServices] = useState([]);
//   const [blockedSlots, setBlockedSlots] = useState([]); // State baru untuk data jam terkunci

//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   // Sinkronisasi Pengambilan Data Master (Barber, Service, & Blocked Slots) dalam 1 Effect
//   useEffect(() => {
//     async function getData() {
//       try {
//         const resBarbers = await fetch('/api/barbers');
//         if (resBarbers.ok) setDbBarbers(await resBarbers.json());

//         const resServices = await fetch('/api/services');
//         if (resServices.ok) {
//           const servicesData = await resServices.json();
//           setDbServices(servicesData);
//           // Set default service dari data pertama jika tersedia
//           if (servicesData.length > 0) {
//             setFormData(prev => ({
//               ...prev,
//               service: `${servicesData[0].name} (Rp ${servicesData[0].price.toLocaleString('id-ID')})`
//             }));
//           }
//         }

//         const resBlocked = await fetch('/api/blocked-slots');
//         if (resBlocked.ok) setBlockedSlots(await resBlocked.json());
//       } catch (error) {
//         console.error("Gagal memuat data awal:", error);
//       }
//     }
//     getData();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMessage('');

//     try {
//       // 1. Dapatkan nama hari berdasarkan tanggal yang dipilih oleh pelanggan
//       const selectedDate = new Date(formData.date);
//       const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//       const selectedDayName = daysOfWeek[selectedDate.getDay()];

//       // 2. Ekstrak data nama kapster murni dari value pilihan (karena format dropdown: "Nama (Role)")
//       let selectedBarberId = null;
//       if (formData.barber !== 'Siapa Saja (Ketersediaan Tercepat)') {
//         const matchedBarber = dbBarbers.find(b => `${b.name} (${b.role})` === formData.barber);
//         if (matchedBarber) selectedBarberId = matchedBarber._id;
//       }

//       // 3. Validasi Logika Penguncian Waktu (Jam Istirahat/Blokir)
//       if (selectedBarberId) {
//         const isTimeBlocked = blockedSlots.some(slot => {
//           // Cocokkan ID Kapster dan Hari Kerja terlebih dahulu
//           if (slot.barberId === selectedBarberId && slot.day === selectedDayName) {
//             const timeVal = formData.time; // Format 'HH:MM'
//             // Periksa apakah waktu booking berada di antara startTime dan endTime blokir
//             return timeVal >= slot.startTime && timeVal <= slot.endTime;
//           }
//           return false;
//         });

//         if (isTimeBlocked) {
//           setErrorMessage(`Maaf, kapster pilihan Anda sedang tidak tersedia (Jam Istirahat/Blokir) pada rentang jam tersebut untuk tanggal ${formData.date}. Silakan pilih jam atau kapster lain.`);
//           setIsLoading(false);
//           return; // Hentikan proses pengiriman data booking
//         }
//       }

//       // 4. Proses Kirim Data ke API Jika Lolos Validasi Jam Kerja
//       const response = await fetch('/api/appointments', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         setIsSubmitted(true);
//       } else {
//         setErrorMessage(result.message || 'Gagal mengirim data booking.');
//       }
//     } catch (error) {
//       setErrorMessage('Koneksi internet bermasalah atau server mati.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-neutral-950 text-neutral-100 px-6 py-12 font-sans flex items-center justify-center">
//       <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl">
        
//         <div className="mb-8">
//           <a href="/" className="text-amber-500 hover:text-amber-400 text-sm font-medium transition duration-200">
//             ← Kembali ke Beranda
//           </a>
//           <h1 className="text-3xl font-serif font-bold text-amber-500 mt-4">Formulir Booking Slot</h1>
//           <p className="text-neutral-400 text-sm mt-1">Silakan isi detail kunjungan Anda di bawah ini.</p>
//         </div>

//         {isSubmitted ? (
//           <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl text-center">
//             <h3 className="text-xl font-bold text-amber-500 mb-2">🎉 Booking Berhasil!</h3>
//             <p className="text-neutral-300 text-sm mb-4">Jadwal Anda telah tercatat di sistem kami.</p>
//             <div className="text-left bg-neutral-950 p-4 rounded-lg text-xs space-y-2 text-neutral-400 font-mono">
//               <p><span className="text-amber-500">Nama:</span> {formData.name}</p>
//               <p><span className="text-amber-500">Layanan:</span> {formData.service}</p>
//               <p><span className="text-amber-500">Kapster:</span> {formData.barber}</p>
//               <p><span className="text-amber-500">Jadwal:</span> {formData.date} Pukul {formData.time} WIB</p>
//             </div>
//             <button 
//               onClick={() => setIsSubmitted(false)}
//               className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-3 rounded-lg text-sm transition duration-200"
//             >
//               Buat Janji Baru
//             </button>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="space-y-6">
            
//             {/* Tampilan Peringatan Error Jika Jam Kerja Terkunci */}
//             {errorMessage && (
//               <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-sm font-medium">
//                 ⚠️ {errorMessage}
//               </div>
//             )}

//             {/* Input Nama */}
//             <div>
//               <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Nama Lengkap</label>
//               <input 
//                 type="text" 
//                 required
//                 placeholder="Masukkan nama Anda"
//                 className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
//                 value={formData.name}
//                 onChange={(e) => setFormData({...formData, name: e.target.value})}
//               />
//             </div>

//             {/* Pilih Layanan */}
//             <div>
//               <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Pilih Layanan</label>
//               <select 
//                 className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
//                 value={formData.service}
//                 onChange={(e) => setFormData({...formData, service: e.target.value})}
//               >
//                 {dbServices.length === 0 ? (
//                   <option>Memuat layanan...</option>
//                 ) : (
//                   dbServices.map((s) => (
//                     <option key={s._id} value={`${s.name} (Rp ${s.price.toLocaleString('id-ID')})`}>
//                       {s.name} - Rp {s.price.toLocaleString('id-ID')} ({s.duration})
//                     </option>
//                   ))
//                 )}
//               </select>
//             </div>

//             {/* Pilih Kapster */}
//             <div>
//               <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Pilih Kapster</label>
//               <select
//                 className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
//                 value={formData.barber}
//                 onChange={(e) => setFormData({ ...formData, barber: e.target.value })}
//               >
//                 <option value="Siapa Saja (Ketersediaan Tercepat)">Siapa Saja (Ketersediaan Tercepat)</option>
//                 {dbBarbers && dbBarbers.map((b) => (
//                   <option key={b._id} value={`${b.name} (${b.role})`}>
//                     {b.name} ({b.role})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Tanggal & Jam */}
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Tanggal</label>
//                 <input 
//                   type="date" 
//                   required
//                   className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:invert"
//                   value={formData.date}
//                   onChange={(e) => setFormData({...formData, date: e.target.value})}
//                 />
//               </div>
//               <div>
//                 <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Jam Slot</label>
//                 <input 
//                   type="time" 
//                   required
//                   className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:invert"
//                   value={formData.time}
//                   onChange={(e) => setFormData({...formData, time: e.target.value})}
//                 />
//               </div>
//             </div>

//             {/* Tombol Submit */}
//             <button 
//               type="submit" 
//               disabled={isLoading}
//               className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-4 rounded-lg tracking-wide shadow-lg shadow-amber-500/10 transition duration-300 mt-4 disabled:bg-amber-700"
//             >
//               {isLoading ? 'MEMPROSES...' : 'KONFIRMASI JADWAL'}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }
'use client';
import { useState, useEffect } from 'react';

export default function BookingPage() {
  const [formData, setFormData] = useState({
    name: '',
    service: '',
    barber: 'Siapa Saja (Ketersediaan Tercepat)',
    date: '',
    time: '',
    paymentMethod: 'Tunai',
  });

  const [paymentProof, setPaymentProof] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [dbBarbers, setDbBarbers] = useState([]);
  const [dbServices, setDbServices] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    async function getData() {
      try {
        const resBarbers = await fetch('/api/barbers');
        if (resBarbers.ok) setDbBarbers(await resBarbers.json());

        const resServices = await fetch('/api/services');
        if (resServices.ok) {
          const servicesData = await resServices.json();
          setDbServices(servicesData);
          
          // PERBAIKAN: Menambahkan indeks [0] agar membaca objek data pertama dengan benar
          if (servicesData.length > 0) {
            setFormData(prev => ({
              ...prev,
              service: `${servicesData[0].name} (Rp ${servicesData[0].price.toLocaleString('id-ID')})`
            }));
          }
        }

        const resBlocked = await fetch('/api/blocked-slots');
        if (resBlocked.ok) setBlockedSlots(await resBlocked.json());
      } catch (error) {
        console.error("Gagal memuat data awal:", error);
      }
    }
    getData();
  }, []); // PERBAIKAN: Menambahkan array dependensi kosong agar tidak loop terus-menerus


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validExtensions = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validExtensions.includes(file.type)) {
        alert('Format berkas tidak valid! Harap unggah gambar bukti pembayaran (JPG/PNG).');
        e.target.value = null;
        return;
      }
      setPaymentProof(file);
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Data yang akan dikirim ke backend:", formData);
    
    setIsLoading(true);
    setErrorMessage('');
    // setIsLoading(true);
    // setErrorMessage('');

    if (formData.paymentMethod === 'QRIS' && !paymentProof) {
      setErrorMessage('Harap unggah bukti pembayaran valid Anda terlebih dahulu untuk metode QRIS.');
      setIsLoading(false);
      return;
    }

    try {
      const selectedDate = new Date(formData.date);
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDayName = daysOfWeek[selectedDate.getDay()];

      let selectedBarberId = null;
      if (formData.barber !== 'Siapa Saja (Ketersediaan Tercepat)') {
        const matchedBarber = dbBarbers.find(b => `${b.name} (${b.role})` === formData.barber);
        if (matchedBarber) selectedBarberId = matchedBarber._id;
      }

      if (selectedBarberId && blockedSlots.length > 0) {
        const isTimeBlocked = blockedSlots.some(slot => {
          if (slot.barberId === selectedBarberId && slot.day === selectedDayName) {
            const timeVal = formData.time;
            return timeVal >= slot.startTime && timeVal <= slot.endTime;
          }
          return false;
        });

        if (isTimeBlocked) {
          setErrorMessage(`Maaf, kapster pilihan Anda sedang tidak tersedia pada rentang jam tersebut untuk tanggal ${formData.date}.`);
          setIsLoading(false);
          return;
        }
      }

      const dataToSend = new FormData();
      dataToSend.append('name', formData.name);
      dataToSend.append('service', formData.service);
      dataToSend.append('barber', formData.barber);
      dataToSend.append('date', formData.date);
      dataToSend.append('time', formData.time);
      dataToSend.append('paymentMethod', formData.paymentMethod);
      if (paymentProof) {
        dataToSend.append('paymentProof', paymentProof);
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        body: dataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(result.message || 'Gagal mengirim data booking.');
      }
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
              <p><span className="text-amber-500">Metode Pembayaran:</span> {formData.paymentMethod}</p>
            </div>
            <button 
              onClick={() => { setIsSubmitted(false); setPaymentProof(null); }}
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

            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Nama Lengkap</label>
              <input 
                type="text" required placeholder="Masukkan nama Anda"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Pilih Layanan</label>
              <select 
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
                value={formData.service} onChange={(e) => setFormData({...formData, service: e.target.value})}
              >
                {dbServices.length === 0 ? <option>Memuat layanan...</option> : dbServices.map((s) => (
                  <option key={s._id} value={`${s.name} (Rp ${s.price.toLocaleString('id-ID')})`}>
                    {s.name} - Rp {s.price.toLocaleString('id-ID')} ({s.duration})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Pilih Kapster</label>
              <select
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200"
                value={formData.barber} onChange={(e) => setFormData({ ...formData, barber: e.target.value })}
              >
                <option value="Siapa Saja (Ketersediaan Tercepat)">Siapa Saja (Ketersediaan Tercepat)</option>
                {dbBarbers && dbBarbers.map((b) => (
                  <option key={b._id} value={`${b.name} (${b.role})`}>
                    {b.name} ({b.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Tanggal</label>
                <input 
                  type="date" required className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:invert"
                  value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Jam Slot</label>
                <input 
                  type="time" required className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-lg p-3 text-sm text-neutral-100 focus:outline-none transition duration-200 [&::-webkit-calendar-picker-indicator]:invert"
                  value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition ${formData.paymentMethod === 'Tunai' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                  <input type="radio" name="paymentMethod" value="Tunai" checked={formData.paymentMethod === 'Tunai'} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="hidden" />
                  <span className="text-sm font-medium">💵 Tunai / Cash</span>
                </label>
                <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition ${formData.paymentMethod === 'QRIS' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                  <input type="radio" name="paymentMethod" value="QRIS" checked={formData.paymentMethod === 'QRIS'} onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})} className="hidden" />
                  <span className="text-sm font-medium">📱 QRIS / Digital</span>
                </label>
              </div>
            </div>

            {formData.paymentMethod === 'QRIS' && (
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
                <div className="flex flex-col items-center p-2 bg-white rounded-lg max-w-[200px] mx-auto">
                  <img src="https://qrserver.com" alt="QRIS Code" className="w-full h-auto aspect-square object-contain" />
                  <span className="text-[10px] text-neutral-800 font-bold tracking-wider mt-1">NMID : BARBER_PREMIUM</span>
                </div>
                <p className="text-center text-xs text-neutral-400 px-4">Silakan pindai QRIS di atas untuk melakukan transfer pembayaran sesuai harga layanan.</p>
                
                <div className="pt-2 border-t border-neutral-800">
                  <label className="block text-xs font-semibold tracking-wider text-amber-500 uppercase mb-2">Unggah Bukti Transaksi Valid</label>
                  <input 
                    type="file" required={formData.paymentMethod === 'QRIS'} accept="image/*" onChange={handleFileChange}
                    className="w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-neutral-950 hover:file:bg-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-4 rounded-lg tracking-wide shadow-lg transition duration-300 mt-4 disabled:bg-amber-700"
            >
              {isLoading ? 'MEMPROSES...' : 'KONFIRMASI JADWAL'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
