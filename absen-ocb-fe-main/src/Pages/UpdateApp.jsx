const APK_VIEW_URL =
  "https://drive.google.com/file/d/1w1_7LBSObTb4R64xt0uR0gXyVIrzATkZ/view?usp=sharing";
const APK_DOWNLOAD_URL =
  "https://drive.google.com/uc?export=download&id=1w1_7LBSObTb4R64xt0uR0gXyVIrzATkZ";

const steps = [
  {
    title: "Hapus aplikasi Absensi OCB yang lama",
    body: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          Tekan lama ikon <b>Absensi OCB</b> di layar HP, lalu pilih{" "}
          <b>Uninstall</b> / <b>Copot pemasangan</b>.
        </p>
        <p style={{ margin: 0 }}>
          Data absensi Anda <b>tidak hilang</b> karena tersimpan di server. Setelah
          aplikasi baru terpasang, Anda cukup login kembali.
        </p>
      </>
    ),
  },
  {
    title: "Unduh file aplikasi",
    body: (
      <>
        <p style={{ margin: "0 0 10px" }}>
          Tekan tombol di bawah. File akan terunduh dari Google Drive (ukuran
          sekitar 8 MB).
        </p>
        <a
          href={APK_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            padding: "14px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            textAlign: "center",
            textDecoration: "none",
            boxSizing: "border-box",
          }}
        >
          Unduh Aplikasi
        </a>
        <p style={{ margin: "10px 0 0", fontSize: "14px", color: "#666" }}>
          Jika tombol tidak berfungsi,{" "}
          <a
            href={APK_VIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#e74c3c", display: "inline-block", padding: "6px 0" }}
          >
            buka lewat Google Drive
          </a>{" "}
          lalu tekan ikon unduh di pojok kanan atas.
        </p>
      </>
    ),
  },
  {
    title: "Izinkan pemasangan",
    body: (
      <>
        <p style={{ margin: "0 0 8px" }}>
          Saat file dibuka, HP mungkin menampilkan peringatan{" "}
          <i>&ldquo;Demi keamanan, ponsel tidak diizinkan memasang aplikasi dari sumber ini&rdquo;</i>.
        </p>
        <p style={{ margin: 0 }}>
          Tekan <b>Setelan</b> pada peringatan itu, lalu aktifkan{" "}
          <b>Izinkan dari sumber ini</b>. Tekan tombol kembali untuk melanjutkan.
        </p>
      </>
    ),
  },
  {
    title: "Pasang aplikasi",
    body: (
      <p style={{ margin: 0 }}>
        Buka file yang sudah diunduh (cek notifikasi atau folder <b>Download</b>),
        lalu tekan <b>Install</b> / <b>Pasang</b>. Tunggu sampai selesai.
      </p>
    ),
  },
  {
    title: "Login kembali",
    body: (
      <p style={{ margin: 0 }}>
        Buka aplikasi, masuk dengan username dan password Anda seperti biasa.
        Aplikasi siap dipakai untuk absen.
      </p>
    ),
  },
];

const absenPoints = [
  {
    icon: "mdi-arrow-right-bold-circle",
    title: "Satu arah dalam satu waktu",
    body: "Aplikasi hanya menampilkan tipe absen yang boleh dilakukan sekarang. Belum absen masuk, yang muncul hanya MASUK. Sudah masuk, yang muncul hanya KELUAR untuk shift yang sama.",
  },
  {
    icon: "mdi-clock-outline",
    title: "Masuk dibuka 1 jam sebelum shift",
    body: "Absen masuk baru bisa dilakukan mulai 1 jam sebelum jam shift dimulai. Datang lebih awal dari itu, tipe absen belum muncul.",
  },
  {
    icon: "mdi-map-marker-radius",
    title: "Harus di dalam radius toko",
    body: "Absen hanya bisa dilakukan di dalam radius OC/Store yang dipilih. Di luar radius, absen ditolak — termasuk saat lembur, karena OC tempat lembur sudah Anda pilih sendiri. Pastikan GPS aktif dan Anda benar-benar berada di lokasi.",
  },
  {
    icon: "mdi-weather-night",
    title: "Shift lintas hari",
    body: "Shift yang masuk malam dan keluar besok pagi (mis. SUBUH) tetap dikenali. Tipe KELUAR-nya muncul keesokan harinya sampai lewat batas jam keluar.",
  },
  {
    icon: "mdi-clock-alert-outline",
    title: "Batas waktu absen keluar",
    body: "Shift biasa: absen keluar paling lambat di hari yang sama dengan absen masuk (sebelum tengah malam). Shift lintas hari (mis. SUBUH, SORE 9 JAM): paling lambat 3 jam setelah jam pulang terjadwal — contoh jam pulang 01.00, absen keluar masih diterima sampai 04.00. Lewat batas, absen masuk dianggap belum lengkap (lupa keluar) dan tidak dihitung hadir.",
  },
  {
    icon: "mdi-calendar-edit",
    title: "Tukar shift diajukan H-1",
    body: "Perubahan jadwal yang sudah ditetapkan harus diajukan ke admin paling lambat H-1 (sehari sebelumnya). Pengajuan di hari-H tidak dilayani — jadwal yang berlaku tetap yang tercatat di sistem.",
  },
];

const lemburSteps = [
  {
    title: "Selesaikan absen reguler dulu",
    body: "Tombol Mulai Lembur baru muncul setelah absen masuk dan keluar shift reguler hari ini selesai. Bila Anda pakai jadwal harian, lembur bisa dimulai kapan saja asalkan tidak sedang di tengah shift.",
  },
  {
    title: "Tekan Mulai Lembur, pilih OC",
    body: "Pilih OC/Store tempat Anda lembur. Bisa berbeda dari toko Anda sendiri, karena lembur biasanya menggantikan karyawan toko lain.",
  },
  {
    title: "Absen masuk lembur",
    body: "Pilih tipe absen masuk dari shift yang Anda gantikan, ambil foto, lalu kirim. Absen lembur selalu menunggu approval atasan. Anda harus berada di dalam radius OC yang dipilih — absen di luar radius OC tersebut ditolak, sama seperti absen biasa.",
  },
  {
    title: "Absen keluar lembur",
    body: "Saat lembur selesai, buka aplikasi lagi. Mode lembur menyala otomatis dan tipe KELUAR pasangannya langsung muncul — tak perlu tekan Mulai Lembur lagi. OC sudah terkunci ke tempat Anda masuk tadi, dan absen keluar pun harus di dalam radius OC itu. Lembur hanya dihitung bila masuk dan keluar keduanya tercatat.",
  },
];

const UpdateApp = () => {
  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ color: "#e74c3c", margin: "0 0 6px", fontSize: "24px" }}>
          Update Aplikasi Absensi
        </h1>
        <p style={{ color: "#666", margin: 0, fontSize: "14px" }}>
          Panduan pemasangan, cara absen, dan lembur
        </p>
      </div>

      {/* Pilih sesuai jenis HP */}
      <div
        style={{
          background: "#eef4fb",
          border: "1px solid #2471a3",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "20px",
        }}
      >
        <p style={{ margin: "0 0 10px", fontWeight: "bold", color: "#1a5276", fontSize: "15px" }}>
          Pilih sesuai jenis HP Anda
        </p>
        <div style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
          <div style={{ fontSize: "22px", flexShrink: 0, color: "#2471a3" }}>
            <i className="mdi mdi-android"></i>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#1a5276", lineHeight: 1.6 }}>
            <b>HP Android</b> — pasang aplikasi Absensi OCB. Ikuti langkah pemasangan di bawah.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ fontSize: "22px", flexShrink: 0, color: "#2471a3" }}>
            <i className="mdi mdi-apple"></i>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#1a5276", lineHeight: 1.6 }}>
            <b>HP iPhone (iOS)</b> — tidak perlu pasang aplikasi. Absen lewat website:
            buka{" "}
            <a href="/absen" style={{ color: "#2471a3", fontWeight: "bold" }}>
              halaman absen
            </a>{" "}
            di browser (Safari/Chrome), lalu login. Cara absen &amp; lembur sama seperti di bawah.
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#fdecea",
          border: "1px solid #e74c3c",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "20px",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: "bold", color: "#c0392b" }}>
          Baca dulu sebelum mulai (Android)
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#7b241c", lineHeight: 1.6 }}>
          Hapus dulu aplikasi lama sebelum memasang yang baru. Data absensi Anda{" "}
          <b>tidak hilang</b> karena tersimpan di server — cukup login kembali
          setelah selesai. <i>(Pengguna iPhone lewati langkah pemasangan ini.)</i>
        </p>
      </div>

      {steps.map((step, i) => (
        <div
          key={step.title}
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#e74c3c",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "3px 0 6px", fontWeight: "bold", fontSize: "15px" }}>
              {step.title}
            </p>
            <div style={{ fontSize: "14px", color: "#444", lineHeight: 1.6 }}>
              {step.body}
            </div>
          </div>
        </div>
      ))}

      <div
        style={{
          background: "#f8f9fa",
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "14px",
          marginTop: "24px",
        }}
      >
        <p style={{ margin: "0 0 8px", fontWeight: "bold", fontSize: "14px" }}>
          Kendala yang sering terjadi
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#555", lineHeight: 1.6 }}>
          <b>&ldquo;Aplikasi tidak terpasang&rdquo;</b> — pastikan aplikasi lama sudah
          benar-benar terhapus, lalu pasang ulang.
        </p>
        <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#555", lineHeight: 1.6 }}>
          <b>File tidak bisa dibuka</b> — unduhan belum selesai. Hapus file lalu unduh ulang.
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#555", lineHeight: 1.6 }}>
          <b>Tidak bisa absen setelah update</b> — pastikan GPS aktif dan izin
          lokasi serta kamera sudah diberikan ke aplikasi.
        </p>
      </div>

      <hr style={{ margin: "32px 0 24px", border: 0, borderTop: "1px solid #e0e0e0" }} />

      <h2
        style={{
          color: "#e74c3c",
          fontSize: "19px",
          margin: "0 0 4px",
          textAlign: "center",
        }}
      >
        Cara Absen
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "14px",
          margin: "0 0 18px",
        }}
      >
        Hal penting yang perlu diketahui
      </p>

      <div
        style={{
          background: "#fdecea",
          border: "1px solid #e74c3c",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "20px",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: "bold", color: "#c0392b", fontSize: "15px" }}>
          Wajib absen masuk DAN keluar
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#7b241c", lineHeight: 1.6 }}>
          Kehadiran hanya dihitung bila absen masuk dan absen keluar keduanya
          tercatat. Absen masuk saja, atau keluar saja, <b>tidak dihitung hadir
          dengan alasan apa pun</b>. Pastikan Anda absen keluar sebelum pulang.
        </p>
      </div>

      {absenPoints.map((p) => (
        <div key={p.title} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <i
            className={`mdi ${p.icon}`}
            style={{ color: "#e74c3c", fontSize: "22px", lineHeight: 1.3, flexShrink: 0 }}
          />
          <div>
            <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "15px" }}>
              {p.title}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#444", lineHeight: 1.6 }}>
              {p.body}
            </p>
          </div>
        </div>
      ))}

      <h2
        style={{
          color: "#e74c3c",
          fontSize: "19px",
          margin: "28px 0 4px",
          textAlign: "center",
        }}
      >
        Cara Lembur
      </h2>
      <p
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "14px",
          margin: "0 0 18px",
        }}
      >
        Menggantikan shift di OC lain
      </p>

      {lemburSteps.map((step, i) => (
        <div key={step.title} style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
          <div
            style={{
              flexShrink: 0,
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "#f39c12",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "3px 0 6px", fontWeight: "bold", fontSize: "15px" }}>
              {step.title}
            </p>
            <p style={{ margin: 0, fontSize: "14px", color: "#444", lineHeight: 1.6 }}>
              {step.body}
            </p>
          </div>
        </div>
      ))}

      <div
        style={{
          background: "#fff4e5",
          border: "1px solid #f39c12",
          borderRadius: "12px",
          padding: "14px",
          marginTop: "20px",
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: "bold", color: "#d35400", fontSize: "15px" }}>
          Tipe absen tidak muncul?
        </p>
        <p style={{ margin: 0, fontSize: "14px", color: "#7b4f00", lineHeight: 1.6 }}>
          Biasanya karena belum waktunya (masuk dibuka 1 jam sebelum shift), arah
          absen tidak sesuai (masuk belum dilakukan), atau jadwal hari ini belum
          ditetapkan admin. Bila sesi lembur Anda masih terbuka, yang muncul hanya
          tipe keluar pasangannya.
        </p>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "13px",
          color: "#888",
          marginTop: "24px",
        }}
      >
        Butuh bantuan? Hubungi admin atau atasan Anda.
      </p>
    </div>
  );
};

export default UpdateApp;
