import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';

// 1. AMBIL DAFTAR KAPSTER
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');
    const barbers = await db.collection('barbers').find({}).toArray();
    return NextResponse.json(barbers, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal mengambil data kapster.' }, { status: 500 });
  }
}

// 2. TAMBAH KAPSTER BARU
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, role } = body;

    if (!name || !role) {
      return NextResponse.json({ message: 'Nama dan peran wajib diisi!' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('barbershop');

    const result = await db.collection('barbers').insertOne({
      name,
      role,
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Kapster berhasil ditambahkan!', id: result.insertedId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menambahkan kapster.' }, { status: 500 });
  }
}

// 3. HAPUS/KURANGI KAPSTER
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID tidak ditemukan.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('barbershop');

    await db.collection('barbers').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: 'Kapster berhasil dihapus!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Gagal menghapus kapster.' }, { status: 500 });
  }
}
