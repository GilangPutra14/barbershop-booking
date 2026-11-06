import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db'; // Menggunakan helper lib/db sesuai konfigurasi proyek Anda
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

// 2. POST: Menyimpan data booking baru beserta file bukti QRIS dari customer
export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Membaca data sebagai FormData karena ada unggahan file gambar
    const formData = await request.formData();
    
    const name = formData.get('name');
    const service = formData.get('service');
    const barber = formData.get('barber');
    const date = formData.get('date');
    const time = formData.get('time');
    const paymentMethod = formData.get('paymentMethod');
    const file = formData.get('paymentProof');

    if (!name || !service || !barber || !date || !time || !paymentMethod) {
      return NextResponse.json({ message: 'Semua kolom wajib diisi!' }, { status: 400 });
    }

    let paymentProofUrl = null;

    // Jika metode QRIS dan ada file yang diunggah, proses penyimpanan file
    if (paymentMethod === 'QRIS' && file && typeof file !== 'string') {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Membuat folder penyimpanan 'public/uploads' jika belum ada
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Membuat nama unik untuk file agar tidak bentrok (contoh: 1718293812-bukti.png)
      const fileExtension = path.extname(file.name) || '.png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Menulis file ke disk lokal server
      fs.writeFileSync(filePath, buffer);
      paymentProofUrl = `/uploads/${fileName}`; // Jalur URL yang bisa diakses di browser
    }

    const newAppointment = {
      name,
      service,
      barber,
      date,
      time,
      paymentMethod,
      paymentProofUrl, // Menyimpan link gambar bukti transfer
      status: 'Active',
      createdAt: new Date()
    };

    const result = await db.collection('appointments').insertOne(newAppointment);

    return NextResponse.json({ 
      success: true, 
      message: 'Booking berhasil dibuat!', 
      insertedId: result.insertedId 
    }, { status: 201 });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal pada server' }, { status: 500 });
  }
}

// 3. PUT: Mengambil riwayat booking yang HANYA diselesaikan HARI INI (Otomatis Reset Setiap Hari)
export async function PUT() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    // Tentukan waktu mulai hari ini (00:00:00) dan akhir hari ini (23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    // Ambil data riwayat yang kolom 'completedAt'-nya berada dalam rentang hari ini saja
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

    // 1. Cari data antrean aktif yang ingin diselesaikan
    const appointment = await db.collection('appointments').findOne({ _id: new ObjectId(id) });
    
    if (!appointment) {
      return NextResponse.json({ error: 'Data antrean tidak ditemukan!' }, { status: 404 });
    }

    // 2. Masukkan data tersebut ke dalam tabel riwayat (appointments_history)
    const historyData = {
      ...appointment,
      completedBy,
      completedAt: new Date(),
      status: 'Completed'
    };
    delete historyData._id; // Hapus ID lama agar dibuatkan ID baru di tabel riwayat

    await db.collection('appointments_history').insertOne(historyData);

    // 3. Hapus dari tabel antrean aktif
    await db.collection('appointments').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: 'Antrean berhasil diselesaikan!' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
