const navigationLinks = [
  {
    name: "Dashboard",
    path: "/",
    icon: "mdi-home",
  },
  {
    name: "Data karyawan",
    path: "/users",
    icon: "mdi-account-group",
  },
 
  {
    name: "Absensi Histori",
    path: "/absensi",
    icon: "mdi-calendar-clock",
  },
  {
    name: "Kelola Cuti & Off",
    path: "/offday",
    icon: "mdi-bed",
  },
  {
    name: "Kelola Bonus/Punishment",
    path: "/bonus",
    icon: "mdi-store-alert",
  },
  {
    name: "Kelola Gaji Karyawan",
    path: "/salary",
    icon: "mdi-wallet",
  },
  {
    name: "Retail/Toko",
    path: "/retails",
    icon: "mdi-store-outline",
  },
  {
    name: "Shift",
    path: "/shifting",
    icon: "mdi-briefcase-arrow-left-right",
  },
  {
    name: "Kategori Absen",
    path: "/typeabsen",
    icon: "mdi-palette-swatch-variant",
  },
  {
    name: "Management User",
    path: null,
    icon: "mdi-palette-swatch-variant",
    submenuId: "manage-user",
    submenu : [
      { name: "Role dan Kategori User", path: "/management-user" },

    ]
  },
  
];

export default navigationLinks;
// userRole
