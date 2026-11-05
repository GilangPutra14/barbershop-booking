import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';


import { ObjectId } from 'mongodb';

// 1. GET: Mengambil daftar jam yang diblokir untuk divalidasi di form customer
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop'); // Sesuaikan nama database Anda
    
    const blockedSlots = await db.collection('blocked_slots').find({}).toArray();
    
    return NextResponse.json(blockedSlots, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data blokir jam' }, { status: 500 });
  }
}

// 2. POST: Menyimpan data jam blokir baru dari admin panel
export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const body = await request.json();
    const { barberId, day, startTime, endTime } = body;

    if (!barberId || !day || !startTime || !endTime) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi!' }, { status: 400 });
    }

    const newBlock = {
      barberId: new ObjectId(barberId),
      day, // Contoh: 'Monday'
      startTime, // Contoh: '12:00'
      endTime, // Contoh: '13:00'
      createdAt: new Date()
    };

    const result = await db.collection('blocked_slots').insertOne(newBlock);

    return NextResponse.json({ 
      success: true, 
      message: 'Jam kerja kapster berhasil diblokir!', 
      insertedId: result.insertedId 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 3. DELETE: Menghapus jam blokir jika kapster ingin membuka kembali jam tersebut
export async function DELETE(request) {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID tidak ditemukan' }, { status: 400 });
    }

    await db.collection('blocked_slots').deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ success: true, message: 'Blokir jam berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
