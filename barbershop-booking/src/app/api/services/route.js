import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';

// 1. AMBIL SEMUA LAYANAN
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    const services = await db.collection('services').find({}).toArray();
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data layanan.' }, { status: 500 });
  }
}

// 2. TAMBAH LAYANAN BARU
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, price, duration } = body;

    if (!name || !price || !duration) {
      return NextResponse.json({ message: 'Semua data layanan wajib diisi!' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('barbershop');

    const result = await db.collection('services').insertOne({
      name,
      price: Number(price),
      duration,
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Layanan berhasil ditambahkan!', id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menambahkan layanan.' }, { status: 500 });
  }
}

// 3. HAPUS LAYANAN
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID tidak ditemukan.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('barbershop');

    await db.collection('services').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: 'Layanan berhasil dihapus!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menghapus layanan.' }, { status: 500 });
  }
}
