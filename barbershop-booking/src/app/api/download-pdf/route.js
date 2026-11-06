import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('barbershop');

    // 1. Ambil batasan waktu hari ini (00:00:00 s/d 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Query koleksi history sesuai rentang tanggal hari ini
    const history = await db.collection('appointments_history')
      .find({
        completedAt: { $gte: startOfToday, $lte: endOfToday }
      })
      .toArray();

    // 3. Parser angka harga yang akurat
    const extractPrice = (str) => {
      if (!str) return 0;
      const match = str.match(/Rp\s*([\d.]+)/);
      return match ? parseInt(match[1].replace(/\./g, ''), 10) : 0;
    };

    // Kalkulasi data keuangan dinamis
    const total = history.reduce((acc, curr) => acc + extractPrice(curr.service), 0);
    const tunai = history.filter(i => i.paymentMethod === 'Tunai').reduce((acc, curr) => acc + extractPrice(curr.service), 0);
    const qris = history.filter(i => i.paymentMethod === 'QRIS').reduce((acc, curr) => acc + extractPrice(curr.service), 0);

    const countTunai = history.filter(i => i.paymentMethod === 'Tunai').length;
    const countQris = history.filter(i => i.paymentMethod === 'QRIS').length;

    const dateString = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // 4. Dokumen Template Laporan Finansial Cetak Eksklusif (Portrait Style)
    const htmlContent = `
      <html>
        <head>
          <title>Laporan Keuangan Boytax Hairstudio - ${dateString}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            
            /* Branding Header */
            .header-container { text-align: center; border-bottom: 2px dashed #b45309; padding-bottom: 12px; margin-bottom: 20px; }
            .brand-name { font-size: 24px; font-weight: 800; color: #78350f; tracking-wide; margin: 0; font-family: 'Georgia', serif; letter-spacing: 1px; }
            .brand-slogan { font-size: 10px; text-transform: uppercase; color: #d97706; font-weight: 600; tracking-widest; margin: 4px 0 6px 0; }
            .brand-address { font-size: 9px; color: #4b5563; font-weight: 500; }
        
            /* Social Media Badges Top */
            .social-header { display: flex; justify-content: center; gap: 15px; font-size: 10px; color: #4b5563; font-weight: 500; margin-bottom: 6px; }
            .social-item { display: flex; align-items: center; gap: 4px; }
            
            .meta-title { font-size: 12px; color: #4b5563; font-weight: 500; text-transform: uppercase; tracking-wider; }

            /* Grid Card Omzet Vertikal/Compact untuk Portrait */
            .grid-summary { display: flex; width: 100%; gap: 10px; margin-bottom: 20px; }
            .card-report { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; background: #f9fafb; text-align: left; }
            .card-title { font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: 700; tracking-wider; }
            .card-val { font-size: 18px; font-weight: 700; margin-top: 4px; font-family: 'Courier New', Courier, monospace; }
            .card-sub { font-size: 9px; color: #6b7280; margin-top: 2px; }
            
            /* Table Styling */
            .table-title { font-size: 12px; font-weight: 700; color: #111827; margin: 15px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
            table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 11px; }
            th { background: #78350f; color: #ffffff; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking-wider; }
            td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr:last-child td { border-bottom: none; }
            
            /* Badges */
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .badge-qris { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
            .badge-tunai { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
            
            /* Footer */
            .footer-report { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; text-align: center; font-size: 9px; color: #9ca3af; line-height: 1.4; }
          </style>
        </head>
        <body>
          
          <!-- BRANDING HEADER -->
          <div class="header-container">
            <div class="brand-name">BOYTAX HAIRSTUDIO</div>
            <div class="brand-slogan">"Gayamu Pribadimu"</div>
            <div class="brand-address">Jl. Klayatan Gg.3 No.16, Bandungrejosari, Kec. Sukun, Kota Malang, Jawa Timur 65148</div>
            
            <!-- SOSIAL MEDIA METODE SVG -->
            <div class="social-header">
              <div class="social-item">
                <svg class="social-icon" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                <b>Instagram:</b> @boytaxbarber.co
              </div>
              <div class="social-item">
                <svg class="social-icon" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.05 1.78 4.07 1.02.89 2.34 1.41 3.68 1.56v3.89c-1.42-.02-2.84-.46-4.01-1.28-.68-.49-1.26-1.12-1.73-1.83v7.94c.03 2.19-.74 4.41-2.4 5.89-1.66 1.48-4.04 2.12-6.22 1.63-2.18-.49-4.09-2.07-4.94-4.14-.9-2.18-.61-4.81.85-6.66 1.41-1.78 3.74-2.73 6-2.45v3.94c-1.26-.22-2.6.24-3.37 1.25-.8 1.05-.72 2.63.22 3.56.93.9 2.44.96 3.42.14.62-.53.96-1.34.94-2.16V0z"/></svg>
                <b>TikTok:</b> @boytax.hairstudio
              </div>
            </div>
          
                    <!-- TIGA KARTU OMZET KONSISTEN (KINI LEBIH RAMPING) -->
          <div class="grid-summary">
            <div class="card-report" style="border-top: 3px solid #d97706; background: linear-gradient(to bottom right, #ffffff, #fffbeb);">
              <!-- 📑 SEBELUMNYA: 腸 Total Pendapatan -->
              <div class="card-title" style="display: flex; align-items: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                Total Pendapatan
              </div>
              <div class="card-val" style="color: #b45309;">Rp ${total.toLocaleString('id-ID')}</div>
              <div class="card-sub">Total akumulasi hari ini</div>
            </div>
            <div class="card-report" style="border-top: 3px solid #059669; background: linear-gradient(to bottom right, #ffffff, #f0fdf4);">
              <!-- 📑 SEBELUMNYA: 跳 Omzet Tunai -->
              <div class="card-title" style="display: flex; align-items: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Omzet Tunai
              </div>
              <div class="card-val" style="color: #047857;">Rp ${tunai.toLocaleString('id-ID')}</div>
              <div class="card-sub">Volume: <b>${countTunai} Transaksi</b></div>
            </div>
            <div class="card-report" style="border-top: 3px solid #0284c7; background: linear-gradient(to bottom right, #ffffff, #eff6ff);">
              <!-- 📑 SEBELUMNYA: 導 Omzet QRIS -->
              <div class="card-title" style="display: flex; align-items: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                Omzet QRIS
              </div>
              <div class="card-val" style="color: #1d4ed8;">Rp ${qris.toLocaleString('id-ID')}</div>
              <div class="card-sub">Volume: <b>${countQris} Transaksi</b></div>
            </div>
          </div>


                    <!-- MANIFES DETAIL TABEL -->
          <!-- 📑 SEBELUMNYA: 搭 Detail Manifest Pelanggan Selesai -->
          <div class="table-title" style="display: flex; align-items: center; gap: 5px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Detail Manifest Pelanggan Selesai
          </div>
          <table>
            <thead>
              <tr>
                <th>Nama Pelanggan</th>
                <th>Layanan Transaksi</th>
                <th>Kapster</th>
                <th>Metode</th>
              </tr>
            </thead>
            <tbody>
              ${history.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding: 20px;">Belum ada riwayat transaksi potong rambut masuk hari ini.</td></tr>' : history.map(item => `
                <tr>
                  <td><b>${item.name}</b></td>
                  <td style="font-family: monospace;">${item.service}</td>
                  <!-- 📑 SEBELUMNYA: 笞｡ ${item.completedBy} -->
                  <td><span>${item.completedBy}</span></td>
                  <td>
                    <span class="badge ${item.paymentMethod === 'QRIS' ? 'badge-qris' : 'badge-tunai'}">
                      ${item.paymentMethod === 'QRIS' ? 'QRIS' : 'Tunai'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          
          <!-- FOOTER DOKUMEN -->
          <div class="footer-report">
            Dokumen ini dicetak otomatis secara sah melalui Sistem Kasir Digital Boytax Hairstudio.<br>
            <i>Membangun karakter dan ketampanan pria terbaik di Kota Malang.</i>
          </div>

          <script>
            window.onload = function() { 
              window.print(); 
            }
          </script>
        </body>
      </html>
    `;

       return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8', // 🟢 Pastikan ada tulisan charset=utf-8 di sini
        'Content-Disposition': `inline; filename=Laporan-Omzet-${Date.now()}.html`,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memproses berkas' }, { status: 500 });
  }
}
