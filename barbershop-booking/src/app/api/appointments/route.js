import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';


// GANTI FUNGSI POST di src/app/api/appointments/route.js dengan kode ini:
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, service, barber, date, time } = body;

    if (!name || !service || !barber || !date || !time) {
      return NextResponse.json(
        { message: 'Semua data formulir wajib diisi!' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('barbershop');

    // Cek apakah kapster sudah ada yang pesan di tanggal & jam yang sama
    const isConflict = await db.collection('appointments').findOne({
      barber,
      date,
      time
    });

    if (isConflict) {
      return NextResponse.json(
        { message: `Maaf, ${barber} sudah dipesan pada tanggal ${date} jam ${time} WIB. Silakan pilih waktu atau kapster lain!` },
        { status: 400 }
      );
    }

    // Jika aman, masukkan data dengan tambahan status 'Pending'
    const result = await db.collection('appointments').insertOne({
      name,
      service,
      barber,
      date,
      time,
      status: 'Pending', // Status awal antrean
      createdAt: new Date()
    });

    return NextResponse.json(
      { message: 'Booking berhasil disimpan!', bookingId: result.insertedId },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error pada POST:", error);
    return NextResponse.json(
      { message: 'Gagal menyimpan data ke database.' },
      { status: 500 }
    );
  }
}


// 2. FUNGSI UNTUK MENGAMBIL DATA KE DASHBOARD (GET)
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');

    // Ambil data dan urutkan dari yang terbaru dimasukkan
    const appointments = await db
      .collection('appointments')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error("Error pada GET:", error);
    return NextResponse.json(
      { message: 'Gagal mengambil data dari database.' },
      { status: 500 }
    );
  }
}
// Tambahkan fungsi DELETE ini di bagian paling bawah src/app/api/appointments/route.js
// (INI FUNGSI SELSAI LANGSUNG DELETE DATA)

// export async function DELETE(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');

//     if (!id) {
//       return NextResponse.json({ message: 'ID booking tidak ditemukan.' }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db('barbershop');

//     // PERBAIKAN: Menggunakan _id yang benar
//     const result = await db.collection('appointments').deleteOne({
//       _id: new ObjectId(id)
//     });

//     if (result.deletedCount === 0) {
//       return NextResponse.json({ message: 'Data tidak ditemukan di database.' }, { status: 404 });
//     }

//     return NextResponse.json({ message: 'Antrean berhasil diselesaikan!' }, { status: 200 });
//   } catch (error) {
//     console.error("Error pada DELETE:", error);
//     return NextResponse.json({ message: 'Gagal menghapus data.' }, { status: 500 });
//   }
// }

// GANTI FUNGSI DELETE di src/app/api/appointments/route.js dengan kode ini:
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const completedBy = searchParams.get('completedBy'); // Menangkap nama kapster yang menyelesaikan

    if (!id || !completedBy) {
      return NextResponse.json({ message: 'ID booking dan nama kapster wajib diisi.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('barbershop');

    // 1. Cari data appointment aktif sebelum dihapus
    const appointment = await db.collection('appointments').findOne({ _id: new ObjectId(id) });

    if (!appointment) {
      return NextResponse.json({ message: 'Data antrean tidak ditemukan.' }, { status: 404 });
    }

    // 2. Pindahkan data ke koleksi "history" dengan info tambahan
    await db.collection('history').insertOne({
      ...appointment,
      status: 'Selesai',
      completedBy: completedBy, // Kapster yang menyelesaikan tugas
      completedAt: new Date()   // Jam selesai transaksi
    });

    // 3. Hapus dari daftar antrean aktif
    await db.collection('appointments').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: 'Antrean berhasil diselesaikan dan masuk riwayat!' }, { status: 200 });
  } catch (error) {
    console.error("Error pada DELETE:", error);
    return NextResponse.json({ message: 'Gagal menyelesaikan antrean.' }, { status: 500 });
  }
}

// Tambahkan fungsi ini di bagian paling bawah src/app/api/appointments/route.js
export async function PUT() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Mengambil data riwayat dan mengurutkannya dari yang paling baru diselesaikan
    const history = await db.collection('history').find({}).sort({ completedAt: -1 }).toArray();
    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal memuat data riwayat.' }, { status: 500 });
  }
}
// import { NextResponse } from 'next/server';
// import clientPromise from '@/lib/db';
// import { ObjectId } from 'mongodb';

// // FUNGSI VALIDASI WAKTU BOOKING CUSTOMER
// export async function POST(request) {
//   try {
//     const client = await clientPromise;
//     const db = client.db('barbershop');

//     const body = await request.json();
//     const { name, phone, service, barberId, date, time } = body;
//     // barberId: string ID dari kapster
//     // date: string format tanggal "YYYY-MM-DD"
//     // time: string format waktu "HH:mm" (contoh: "14:30")

//     if (!name || !service || !barberId || !date || !time) {
//       return NextResponse.json({ message: 'Semua kolom booking wajib diisi!' }, { status: 400 });
//     }

//     // 1. Cari data kapster berdasarkan ID
//     const barber = await db.collection('barbers').findOne({ _id: new ObjectId(barberId) });
//     if (!barber) {
//       return NextResponse.json({ message: 'Kapster tidak ditemukan!' }, { status: 404 });
//     }

//     // 2. Dapatkan nama hari berdasarkan tanggal booking yang dipilih customer
//     const bookingDate = new Date(date);
//     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//     const bookingDay = days[bookingDate.getDay()]; // Menghasilkan string hari berbahasa Inggris

//     // 3. Cocokkan dengan jadwal kerja operasional kapster tersebut
//     const scheduleToday = barber.workingHours?.find(h => h.day === bookingDay);
//     if (!scheduleToday) {
//       return NextResponse.json({ 
//         message: `Kapster ${barber.name} tidak menerima booking pada hari ${bookingDay}.` 
//       }, { status: 400 });
//     }

//     // 4. Fungsi pembantu untuk konversi format string waktu "HH:mm" ke total menit
//     const toMinutes = (t) => {
//       const [h, m] = t.split(':').map(Number);
//       return h * 60 + m;
//     };

//     const bookingMinutes = toMinutes(time);
//     const startMinutes = toMinutes(scheduleToday.startTime);
//     const endMinutes = toMinutes(scheduleToday.endTime);

//     // 5. Validasi rentang waktu booking
//     if (bookingMinutes < startMinutes || bookingMinutes >= endMinutes) {
//       return NextResponse.json({ 
//         message: `Waktu pilihan Anda di luar jam operasional kerja Kapster ${barber.name} (${scheduleToday.startTime} - ${scheduleToday.endTime}).` 
//       }, { status: 400 });
//     }

//     // 6. Jika lolos semua validasi, masukkan data ke koleksi appointments
//     const newAppointment = {
//       name,
//       phone,
//       service,
//       barber: barber.name, // Menyimpan nama kapster
//       barberId: new ObjectId(barberId),
//       date,
//       time,
//       createdAt: new Date()
//     };

//     const result = await db.collection('appointments').insertOne(newAppointment);

//     return NextResponse.json({ 
//       message: 'Booking antrean berhasil dikonfirmasi!', 
//       appointmentId: result.insertedId 
//     }, { status: 201 });

//   } catch (error) {
//     return NextResponse.json({ message: 'Gagal memproses booking.', error: error.message }, { status: 500 });
//   }
// }
