export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
     {/* Navbar Area - Membuat Logo di Tengah */}
  <nav className="max-w-6xl mx-auto px-6 py-8 flex flex-col items-center justify-center gap-6 border-b border-neutral-900/60 relative">
    
    {/* KOMPONEN LOGO DAN TEKS (STACK MODERN) */}
    <div className="flex flex-col items-center justify-center gap-2">
      {/* Gambar Logo Anda dengan Efek Glow Mewah */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-amber-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
        <img 
          src="/logo-boytax.png" 
          alt="Logo Boytax" 
          className="relative w-20 h-20 object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.3)] transition duration-300 group-hover:scale-105" 
        />
      </div>
      
      {/* Teks Nama Barbershop dengan Spasi Elegan */}
      <div className="tracking-[0.25em] font-serif text-2xl font-bold uppercase mt-3 flex items-center justify-center">
        <span className="text-amber-500">BOYTAX</span>
        <span className="text-neutral-100 ml-3 font-light">HAIRSTUDIO</span>
      </div>
    </div>
    
    {/* Tombol Akses Admin Rahasia - Dipindahkan ke bawah logo secara rapi & kecil */}
    <a href="/admin" className="text-[10px] tracking-widest uppercase border border-neutral-800 bg-neutral-900/30 hover:bg-neutral-800 text-neutral-500 hover:text-amber-500 px-3 py-1.5 rounded transition duration-200">
      Admin Area
    </a>
  </nav>


      {/* Hero Section */}
      <header className="relative flex flex-col items-center justify-center text-center px-4 py-32 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-neutral-950 to-neutral-950">
        
        
        <p className="text-amber-500 font-medium tracking-widest text-sm uppercase mb-3">
          Premium Grooming Experience
        </p>
        <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight max-w-3xl leading-none mb-6">
          Gaya Rambut Maksimal, <br/>
          <span className="text-amber-500">Tanpa Antre Panjang.</span>
        </h1>
        <p className="text-neutral-400 max-w-md text-base md:text-lg mb-8">
          Pesan slot kapster terbaikmu secara online. Cepat, praktis, dan sesuai jadwal kesibukanmu.
        </p>
        
        
        <a href="/booking" className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-8 py-4 rounded-md tracking-wide shadow-lg shadow-amber-500/10 transition duration-300">
  BOOK APPOINTMENT NOW
</a>

      </header>

      {/* Services Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-neutral-900">
        <h2 className="text-3xl font-serif font-bold text-center mb-12">Layanan Utama Kami</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-neutral-900/50 p-8 rounded-xl border border-neutral-900 hover:border-amber-500/30 transition duration-300">
            <h3 className="text-xl font-bold text-amber-500 mb-2">Classic Haircut</h3>
            <p className="text-sm text-neutral-400 mb-4">Potongan rambut premium disesuaikan dengan bentuk wajah dan keinginan Anda.</p>
            <span className="text-lg font-bold font-mono">Rp 50.000</span>
          </div>

          <div className="bg-neutral-900/50 p-8 rounded-xl border border-neutral-900 hover:border-amber-500/30 transition duration-300">
            <h3 className="text-xl font-bold text-amber-500 mb-2">Beard Trim & Shave</h3>
            <p className="text-sm text-neutral-400 mb-4">Perawatan jenggot dan kumis lengkap dengan handuk hangat yang merilekskan.</p>
            <span className="text-lg font-bold font-mono">Rp 35.000</span>
          </div>

          <div className="bg-neutral-900/50 p-8 rounded-xl border border-neutral-900 hover:border-amber-500/30 transition duration-300">
            <h3 className="text-xl font-bold text-amber-500 mb-2">Hair Coloring</h3>
            <p className="text-sm text-neutral-400 mb-4">Pewarnaan rambut profesional menggunakan produk aman dan trendi.</p>
            <span className="text-lg font-bold font-mono">Rp 120.000</span>
          </div>
        </div>
      </section>
    </div>
  );
}
