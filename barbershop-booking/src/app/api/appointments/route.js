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
    
    // Variabel penampung data formulir
    let name, service, barber, date, time, paymentMethod, file;
    let paymentProofUrl = null;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // JALUR 1: Jika frontend mengirim FormData (Unggah Bukti QRIS)
      const formData = await request.formData();
      name = formData.get('name');
      service = formData.get('service');
      barber = formData.get('barber');
      date = formData.get('date');
      time = formData.get('time');
      paymentMethod = formData.get('paymentMethod');
      file = formData.get('paymentProof');
    } else {
      // JALUR 2: Jika frontend mengirim JSON biasa (Metode Tunai)
      const json = await request.json();
      name = json.name;
      service = json.service;
      barber = json.barber;
      date = json.date;
      time = json.time;
      paymentMethod = json.paymentMethod;
      paymentProofUrl = json.paymentProofUrl || null;
    }

    // ==========================================
    // OTOMATISASI DAN PENJAGAAN KETAT BILA DATA WAKTU KOSONG
    // ==========================================
    if (!date) {
      date = new Date().toISOString().split('T')[0]; // Menghasilkan format otomatis YYYY-MM-DD
    }
    if (!time) {
      const sekarang = new Date();
      const jam = String(sekarang.getHours()).padStart(2, '0');
      const menit = String(sekarang.getMinutes()).padStart(2, '0');
      time = `${jam}:${menit}`; // Menghasilkan format otomatis HH:MM
    }

    // Validasi Integritas Data Inti (Nama, Layanan, dan Kapster wajib ada)
    if (!name || !service || !barber) {
      return NextResponse.json({ message: 'Kolom nama, layanan, dan kapster wajib diisi!' }, { status: 400 });
    }

    // Pemrosesan File Gambar Fisik untuk jalur QRIS
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

    // Menyusun objek dokumen akhir untuk disave ke MongoDB
    const newAppointment = {
      name,
      service,
      barber,
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
      message: 'Booking berhasil dibuat!', 
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
