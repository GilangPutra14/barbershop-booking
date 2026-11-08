import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db'; 
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

// 1. GET: Mengambil daftar antrean aktif (untuk Dashboard Admin)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Mengambil antrean aktif dan diurutkan berdasarkan tanggal terdekat
    const appointments = await db.collection('appointments').find({}).sort({ date: 1, time: 1 }).toArray();
    
    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data antrean' }, { status: 500 });
  }
}

// 2. POST: Menyimpan data booking baru secara fleksibel (JSON & FormData)
export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const contentType = request.headers.get("content-type") || "";
    let name, service, barber, date, time, paymentMethod, file;
    let paymentProofUrl = null;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      name = formData.get('name');
      service = formData.get('service');
      barber = formData.get('barber');
      date = formData.get('date');
      time = formData.get('time');
      paymentMethod = formData.get('paymentMethod');
      file = formData.get('paymentProof');
    } else {
      const json = await request.json();
      name = json.name;
      service = json.service;
      barber = json.barber;
      date = json.date;
      time = json.time;
      paymentMethod = json.paymentMethod;
      paymentProofUrl = json.paymentProofUrl || null;
    }

    // Fungsi penolong konversi string waktu 'HH:MM' ke angka menit murni
    const convertToMinutes = (timeString) => {
      if (!timeString) return 0;
      const cleanTime = timeString.trim().substring(0, 5); 
      const [hours, minutes] = cleanTime.split(':');
      return (parseInt(hours, 10) * 60) + parseInt(minutes, 10);
    };

    // 1. DAPATKAN WAKTU REALTIME WIB SAAT INI (ZONA WAKTU ASIA/JAKARTA)
    const sekarangWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    
    const tahunSekarang = sekarangWIB.getFullYear();
    const bulanSekarang = String(sekarangWIB.getMonth() + 1).padStart(2, '0');
    const tanggalSekarang = String(sekarangWIB.getDate()).padStart(2, '0');
    const stringTanggalHariIni = `${tahunSekarang}-${bulanSekarang}-${tanggalSekarang}`; // Format: YYYY-MM-DD

    const jamSekarangRealtime = String(sekarangWIB.getHours()).padStart(2, '0');
    const menitSekarangRealtime = String(sekarangWIB.getMinutes()).padStart(2, '0');
    const menitRealtimeSaatIni = convertToMinutes(`${jamSekarangRealtime}:${menitSekarangRealtime}`);

    // Jika input kosong, otomatisasikan ke waktu WIB saat ini
    if (!date) date = stringTanggalHariIni;
    if (!time) time = `${jamSekarangRealtime}:${menitSekarangRealtime}`;

    if (!name || !service || !barber) {
      return NextResponse.json({ message: 'Kolom nama, layanan, dan kapster wajib diisi!' }, { status: 400 });
    }

    const bookingMinutes = convertToMinutes(time);

    // ====================================================================
    // 🚨 BENTENG 1: CEKAL JIKA BOOKING HARI INI DI ATAS JAM 21:00 WIB REALTIME
    // ====================================================================
    const BATAS_AKHIR_BOOKING_HARI_INI = convertToMinutes("21:00");

    // Jika pelanggan memilih tanggal hari ini
    if (date === stringTanggalHariIni) {
      // Cek apakah waktu saat ini di jam dinding riil sudah melewati 21:00 WIB
      if (menitRealtimeSaatIni > BATAS_AKHIR_BOOKING_HARI_INI) {
        return NextResponse.json({ 
          message: `Slot pemesanan untuk hari ini telah ditutup (Batas akhir pukul 21:00 WIB). Silakan jadwalkan kunjungan ritual Anda di hari berikutnya.` 
        }, { status: 400 });
      }

      // Cek juga jika mereka mencoba memilih jam slot di masa lalu yang sudah terlewat
      if (bookingMinutes < menitRealtimeSaatIni) {
        return NextResponse.json({
          message: `Pemesanan ditolak! Anda tidak dapat memesan jam slot yang sudah terlewat untuk hari ini.`
        }, { status: 400 });
      }
    }

    // ====================================================================
    // 🛡️ BENTENG 2: BATAS JAM OPERASIONAL TOKO SECARA UMUM (09:00 - 21:00 WIB)
    // ====================================================================
    const JAM_BUKA_MENIT = convertToMinutes("09:00");
    if (bookingMinutes < JAM_BUKA_MENIT || bookingMinutes > BATAS_AKHIR_BOOKING_HARI_INI) {
      return NextResponse.json({ 
        message: `Waktu berada di luar jam operasional resmi Boytax Hairstudio. Silakan pilih antara pukul 09:00 hingga 21:00 WIB.` 
      }, { status: 400 });
    }

    // ====================================================================
    // 🔒 BENTENG 3: PROTEKSI JAM SIBUK / ISTIRAHAT KASIR (BLOCKED SLOTS)
    // ====================================================================
    const namaBarberMurni = barber.split(' (')[0].trim();

    const barberDoc = await db.collection('barbers').findOne({ 
      name: { $regex: new RegExp(`^${namaBarberMurni}$`, 'i') } 
    });
    
    if (barberDoc) {
      const [tahun, bulan, tanggal] = date.split('-').map(num => parseInt(num, 10));
      const objekTanggalLokal = new Date(tahun, bulan - 1, tanggal);
      
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const namaHariBooking = daysOfWeek[objekTanggalLokal.getDay()];

      const targetBarberId = barberDoc._id.toString();
      const activeBlockedSlots = await db.collection('blocked-slots').find({
        $or: [
          { barberId: targetBarberId },
          { barberId: barberDoc._id }
        ],
        day: namaHariBooking
      }).toArray();

      const isColliding = activeBlockedSlots.some(slot => {
        const start = convertToMinutes(slot.startTime);
        const end = convertToMinutes(slot.endTime);
        
        if (start > end) {
          return bookingMinutes >= end && bookingMinutes <= start;
        }
        return bookingMinutes >= start && bookingMinutes <= end;
      });

      if (isColliding) {
        return NextResponse.json({ 
          message: `Maaf, kapster ${barberDoc.name} sedang istirahat atau tidak tersedia pada pukul ${time.substring(0, 5)} WIB.` 
        }, { status: 400 }); 
      }
    }
    // ====================================================================

    // Pemrosesan Berkas Gambar Fisik QRIS
    if (paymentMethod === 'QRIS' && file && typeof file !== 'string') {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(file.name) || '.png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);
      paymentProofUrl = `/uploads/${fileName}`; 
    }

    const newAppointment = {
      name,
      service,
      barber: barberDoc ? barberDoc.name : namaBarberMurni, 
      date,
      time,
      paymentMethod: paymentMethod || 'Tunai',
      paymentProofUrl, 
      status: 'Active',
      createdAt: new Date()
    };

    const result = await db.collection('appointments').insertOne(newAppointment);

    return NextResponse.json({ 
      success: true, 
      message: 'Booking kursi berhasil diamankan!', 
      insertedId: result.insertedId 
    }, { status: 201 });

  } catch (error) {
    console.error("Gagal memproses booking:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}





// 3. PUT: Mengambil riwayat booking yang HANYA diselesaikan HARI INI
export async function PUT() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const history = await db.collection('appointments_history')
      .find({
        completedAt: {
          $gte: startOfToday,
          $lte: endOfToday
        }
      })
      .sort({ completedAt: -1 })
      .toArray();
    
    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data riwayat harian' }, { status: 500 });
  }
}

// 4. DELETE: Menyelesaikan antrean (Memindahkan antrean aktif ke koleksi riwayat)
export async function DELETE(request) {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const completedBy = searchParams.get('completedBy');

    if (!id || !completedBy) {
      return NextResponse.json({ error: 'ID antrean dan nama kapster wajib diisi!' }, { status: 400 });
    }

    const appointment = await db.collection('appointments').findOne({ _id: new ObjectId(id) });
    
    if (!appointment) {
      return NextResponse.json({ error: 'Data antrean tidak ditemukan!' }, { status: 404 });
    }

    const historyData = {
      ...appointment,
      completedBy,
      completedAt: new Date(),
      status: 'Completed'
    };
    delete historyData._id; 

    await db.collection('appointments_history').insertOne(historyData);
    await db.collection('appointments').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: 'Antrean berhasil diselesaikan!' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
