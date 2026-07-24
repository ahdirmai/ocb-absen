import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const initialLocation = { latitude: null, longitude: null };
const buildAuthKey = (token, userId) => `${userId || ""}:${token || ""}`;

const absenDirectionLabels = {
  masuk: "Absen Masuk",
  keluar: "Absen Keluar",
};

// Shift window per kategori_absen (bukan window absen sempit).
const SHIFT_WINDOWS = {
  pagi: { start: "06:00", end: "16:00" },
  sore: { start: "14:00", end: "23:59" },
  malam: { start: "22:00", end: "08:00" },
};

const isWithinShiftWindow = (kategoriAbsen) => {
  const k = String(kategoriAbsen || "").toLowerCase();
  const win = SHIFT_WINDOWS[k];
  if (!win) return true; // unknown kategori → tampilkan saja
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  if (win.start <= win.end) {
    return hhmm >= win.start && hhmm <= win.end;
  }
  // Cross-midnight (malam 22:00 - 08:00)
  return hhmm >= win.start || hhmm <= win.end;
};

const getAbsenDirection = (item) => {
  const description = String(item?.description || "").toLowerCase();

  if (description.includes("keluar") || description.includes("pulang")) {
    return "keluar";
  }

  if (description.includes("masuk")) {
    return "masuk";
  }

  return "";
};

const isSameLocalDate = (dateValue, compareDate = new Date()) => {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
};

const isRejectedAttendance = (item) => {
  const approvalStatus = String(item?.status_approval || "").toLowerCase();
  return (
    item?.status_approval === 3 ||
    approvalStatus === "3" ||
    approvalStatus.includes("tolak") ||
    approvalStatus.includes("reject")
  );
};

const buildTodayAttendanceStatus = (rows = []) => {
  const status = { masuk: null, keluar: null };

  rows.forEach((item) => {
    const direction = getAbsenDirection(item);

    if (!direction || !isSameLocalDate(item.absen_time)) {
      return;
    }

    const current = status[direction];
    const currentTime = current?.absen_time ? new Date(current.absen_time).getTime() : 0;
    const itemTime = item.absen_time ? new Date(item.absen_time).getTime() : 0;

    if (!current || itemTime > currentTime) {
      status[direction] = item;
    }
  });

  return status;
};

const hasCompletedRegularAttendanceStatus = (status) =>
  Boolean(
    status.masuk &&
      status.keluar &&
      !isRejectedAttendance(status.masuk) &&
      !isRejectedAttendance(status.keluar)
  );

const isOvertimeAttendance = (item) =>
  String(item?.reason || "").toLowerCase().includes("lembur");

const getTodayDirectionItems = (rows = [], direction) =>
  rows
    .filter(
      (item) =>
        getAbsenDirection(item) === direction && isSameLocalDate(item.absen_time)
    )
    .sort((a, b) => new Date(a.absen_time).getTime() - new Date(b.absen_time).getTime());

const buildTimeCategoryKey = (item) => {
  const kategoriAbsen = String(item?.kategori_absen || "").trim().toLowerCase();

  if (kategoriAbsen) {
    return `kategori:${kategoriAbsen}`;
  }

  const startTime = String(item?.start_time || "").trim();
  const endTime = String(item?.end_time || "").trim();

  if (startTime || endTime) {
    return `time:${startTime}-${endTime}`;
  }

  return `type:${item?.absen_id || item?.absen_type_id || ""}`;
};

const hasTodayAttendanceForTimeCategory = (rows = [], type) =>
  rows.some(
    (item) => {
      if (!isSameLocalDate(item.absen_time) || isRejectedAttendance(item)) {
        return false;
      }

      if (String(item.absen_type_id) === String(type.absen_id)) {
        return true;
      }

      return (
        getAbsenDirection(item) === getAbsenDirection(type) &&
        buildTimeCategoryKey(item) === buildTimeCategoryKey(type)
      );
    }
  );

const buildTodayOvertimeItems = (rows = []) => {
  if (!hasCompletedRegularAttendanceStatus(buildTodayAttendanceStatus(rows))) {
    return [];
  }

  const overtimeItems = [];
  const seenIds = new Set();

  ["masuk", "keluar"].forEach((direction) => {
    const directionItems = getTodayDirectionItems(rows, direction);

    directionItems.forEach((item, index) => {
      if (index === 0 && !isOvertimeAttendance(item)) {
        return;
      }

      const key = item.absensi_id || `${direction}-${item.absen_time}`;

      if (!seenIds.has(key)) {
        seenIds.add(key);
        overtimeItems.push(item);
      }
    });
  });

  return overtimeItems.sort(
    (a, b) => new Date(b.absen_time).getTime() - new Date(a.absen_time).getTime()
  );
};

const getNextOvertimeDirection = (rows = []) => {
  const overtimeItems = buildTodayOvertimeItems(rows);
  const hasOvertimeMasuk = overtimeItems.some(
    (item) => getAbsenDirection(item) === "masuk" && !isRejectedAttendance(item)
  );
  const hasOvertimeKeluar = overtimeItems.some(
    (item) => getAbsenDirection(item) === "keluar" && !isRejectedAttendance(item)
  );

  if (!hasOvertimeMasuk) {
    return "masuk";
  }

  if (!hasOvertimeKeluar) {
    return "keluar";
  }

  return "masuk";
};

const getAttendanceStatusLabel = (item) => {
  if (!item) {
    return "Belum absen";
  }

  const approvalStatus = String(item.status_approval || "").toLowerCase();

  if (isRejectedAttendance(item)) {
    return "Ditolak";
  }

  if (
    item.is_valid === 0 ||
    item.is_valid === "0" ||
    item.status_approval === 1 ||
    item.status_approval === "1" ||
    approvalStatus.includes("menunggu") ||
    approvalStatus.includes("pending")
  ) {
    return "Menunggu approval";
  }

  return "Sudah absen";
};

const AbsenKaryawan = () => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(initialLocation);
  const [locationError, setLocationError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [note, setNote] = useState("");
  const [absenTypes, setAbsenTypes] = useState([]);
  const [selectedAbsenType, setSelectedAbsenType] = useState("");
  const [lemburTypes, setLemburTypes] = useState([]);
  const [isLemburMode, setIsLemburMode] = useState(false);
  const [lemburRetails, setLemburRetails] = useState([]);
  const [selectedLemburRetail, setSelectedLemburRetail] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isRequestingLocationRef = useRef(false);
  const activeAuthKeyRef = useRef("");

  const hasLocation = location.latitude !== null && location.longitude !== null;

  const hitungJarak = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const todayAttendanceStatus = useMemo(
    () => buildTodayAttendanceStatus(history),
    [history]
  );

  const hasCompletedRegularAttendance = hasCompletedRegularAttendanceStatus(
    todayAttendanceStatus
  );

  const todayOvertimeItems = useMemo(
    () => buildTodayOvertimeItems(history),
    [history]
  );

  // Ada absen pending (menunggu approval) hari ini → blokir attempt baru.
  const todayHasPending = useMemo(() => {
    return history.some((item) => {
      if (!isSameLocalDate(item.absen_time)) return false;
      if (isRejectedAttendance(item)) return false;
      const approvalStr = String(item.status_approval || "").toLowerCase();
      return (
        item.status_approval === "1" ||
        item.status_approval === 1 ||
        approvalStr.includes("waiting") ||
        approvalStr.includes("menunggu") ||
        approvalStr.includes("pending")
      );
    });
  }, [history]);

  // Lock mode: jika sudah ada absen hari ini → mode terkunci (lembur/regular).
  const attendanceMode = useMemo(() => {
    const todayItems = history.filter(
      (item) => isSameLocalDate(item.absen_time) && !isRejectedAttendance(item)
    );
    const hasLembur = todayItems.some((item) => item.is_lembur === 1 || item.is_lembur === "1");
    const hasRegular = todayItems.some((item) => item.is_lembur !== 1 && item.is_lembur !== "1");
    if (hasLembur && !hasRegular) return "lembur";
    if (hasRegular && !hasLembur) return "regular";
    if (hasRegular && hasLembur) return "mixed";
    return null;
  }, [history]);

  // Mode terkunci: jika sudah ada absen hari ini, mode tak bisa diganti.
  const effectiveLemburMode = attendanceMode === "lembur" || (attendanceMode === null && isLemburMode);

  // Lembur: filter tipe sesuai attempt. Jika belum ada lembur masuk → tampilkan masuk. Jika sudah → tampilkan keluar.
  const lemburDirection = useMemo(() => {
    if (!effectiveLemburMode) return "";
    const todayLembur = history.filter(
      (item) => (item.is_lembur === 1 || item.is_lembur === "1") && isSameLocalDate(item.absen_time)
    );
    const lemburMasukDone = todayLembur.some(
      (item) => getAbsenDirection(item) === "masuk" && !isRejectedAttendance(item)
    );
    const lemburKeluarDone = todayLembur.some(
      (item) => getAbsenDirection(item) === "keluar" && !isRejectedAttendance(item)
    );
    if (!lemburMasukDone) return "masuk";
    if (!lemburKeluarDone) return "keluar";
    return "";
  }, [effectiveLemburMode, history]);

  const filteredLemburTypes = useMemo(() => {
    if (!effectiveLemburMode) return lemburTypes;
    return lemburTypes.filter((t) => {
      if (lemburDirection && getAbsenDirection(t) !== lemburDirection) return false;
      if (!isWithinShiftWindow(t.kategori_absen)) return false;
      // Lembur keluar: match name dengan lembur masuk dari history.
      if (lemburDirection === "keluar") {
        const lemburMasuk = history.find(
          (item) =>
            (item.is_lembur === 1 || item.is_lembur === "1") &&
            isSameLocalDate(item.absen_time) &&
            getAbsenDirection(item) === "masuk" &&
            !isRejectedAttendance(item)
        );
        if (lemburMasuk && t.name !== lemburMasuk.category_absen) return false;
      }
      return true;
    });
  }, [effectiveLemburMode, lemburDirection, lemburTypes, history]);

  const activeTypes = effectiveLemburMode ? filteredLemburTypes : absenTypes;

  const selectedTypeDetail = useMemo(
    () =>
      activeTypes.find(
        (type) => String(type.absen_id) === String(selectedAbsenType)
      ) || null,
    [activeTypes, selectedAbsenType]
  );

  const locationStatus = useMemo(() => {
    const retailSource = effectiveLemburMode && selectedLemburRetail
      ? selectedLemburRetail
      : selectedTypeDetail;
    if (!hasLocation || !retailSource) return null;
    const { latitude: retLat, longitude: retLon, radius, name: retailName, retail_name } = retailSource;
    if (!retLat || !retLon || !radius) return null;
    const jarak = hitungJarak(location.latitude, location.longitude, Number(retLat), Number(retLon));
    const dalamRadius = jarak <= Number(radius);
    return { dalamRadius, jarak: Math.round(jarak), radius: Number(radius), retail_name: retailName || retail_name };
  }, [hasLocation, location, selectedTypeDetail, effectiveLemburMode, selectedLemburRetail]);

  // Auto-select tipe lembur pertama saat direction berubah (masuk → keluar)
  useEffect(() => {
    if (effectiveLemburMode && filteredLemburTypes.length > 0) {
      const currentStillValid = filteredLemburTypes.some(
        (t) => String(t.absen_id) === String(selectedAbsenType)
      );
      if (!currentStillValid) {
        setSelectedAbsenType(String(filteredLemburTypes[0].absen_id));
      }
    }
  }, [effectiveLemburMode, filteredLemburTypes, selectedAbsenType]);

  // Auto-select OC dari lembur masuk di history untuk lembur keluar.
  useEffect(() => {
    if (!effectiveLemburMode || selectedLemburRetail) return;
    const todayLemburMasuk = history.find(
      (item) =>
        (item.is_lembur === 1 || item.is_lembur === "1") &&
        isSameLocalDate(item.absen_time) &&
        getAbsenDirection(item) === "masuk" &&
        !isRejectedAttendance(item)
    );
    if (todayLemburMasuk?.retail_id) {
      const retail = lemburRetails.find(
        (r) => String(r.retail_id) === String(todayLemburMasuk.retail_id)
      );
      if (retail) setSelectedLemburRetail(retail);
    }
  }, [effectiveLemburMode, history, lemburRetails, selectedLemburRetail]);

  // Fetch lembur types when user has an assigned shift (jadwal)
  useEffect(() => {
    if (!isLoggedIn) {
      setLemburTypes([]);
      setIsLemburMode(false);
      return;
    }

    const userId = userProfile?.user_id || localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!userId || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const [lemburRes, retailRes] = await Promise.all([
          axios.get(`${VITE_API_URL}/absen-management/lembur-types/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${VITE_API_URL}/retail`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (cancelled) return;
        if (lemburRes.data.status === "success") {
          setLemburTypes(lemburRes.data.data || []);
        }
        if (retailRes.data.data) {
          const ocFilter = (name) => {
            const m = String(name).trim().match(/^OC\s*0*(\d{1,2})$/i);
            if (!m) return false;
            const n = Number(m[1]);
            return n >= 1 && n <= 40;
          };
          const ocSort = (a, b) => {
            const na = Number(String(a.name).trim().match(/^OC\s*0*(\d{1,2})$/i)[1]);
            const nb = Number(String(b.name).trim().match(/^OC\s*0*(\d{1,2})$/i)[1]);
            return na - nb;
          };
          setLemburRetails(
            (retailRes.data.data || [])
              .filter((r) => ocFilter(r.name))
              .sort(ocSort)
          );
        }
      } catch (err) {
        console.error("Error fetching lembur/retail:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const currentAttemptDirection = getAbsenDirection(selectedTypeDetail);
  const currentAttemptBaseAttendance = currentAttemptDirection
    ? todayAttendanceStatus[currentAttemptDirection]
    : null;
  const isOvertimeAttempt = Boolean(
    effectiveLemburMode ||
    (hasCompletedRegularAttendance &&
    currentAttemptDirection &&
      currentAttemptBaseAttendance &&
      !isRejectedAttendance(currentAttemptBaseAttendance))
  );
  const currentAttemptLabel = currentAttemptDirection
    ? absenDirectionLabels[currentAttemptDirection]
    : "Tipe absen belum dikenali";

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const resetUserScopedState = () => {
    setUserProfile(null);
    setAbsenTypes([]);
    setSelectedAbsenType("");
    setPhoto(null);
    setPhotoPreview(null);
    setLocation(initialLocation);
    setLocationError("");
    setHistory([]);
    stopCamera();
  };

  const fetchHistory = async (token, userId) => {
    setHistoryLoading(true);
    try {
      const response = await axios.post(
        `${VITE_API_URL}/absensi/history-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === "success") {
        const historyData = Array.isArray(response.data.data) ? response.data.data : [];
        setHistory(historyData);
        return historyData;
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }

    return [];
  };

  const resetSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("userProfile");
    activeAuthKeyRef.current = "";
    setIsLoggedIn(false);
    resetUserScopedState();
    setUsername("");
    setPassword("");
  };

  const applyAuthSession = (token, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    activeAuthKeyRef.current = buildAuthKey(token, userId);
  };

  const getAuthData = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return null;
    }

    return { token, userId };
  };

  const requestLocation = (options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }) => {
    if (isRequestingLocationRef.current) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationError("Browser tidak support GPS.");
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setLocationError("Lokasi hanya bisa diakses di HTTPS atau localhost.");
      return;
    }

    isRequestingLocationRef.current = true;
    setLocationError("Mengambil lokasi...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        isRequestingLocationRef.current = false;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError("");
      },
      (error) => {
        isRequestingLocationRef.current = false;
        console.error("Location error:", error);
        setLocation(initialLocation);

        let message = "Gagal ambil lokasi. Tap untuk coba lagi.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Izin lokasi ditolak. Izinkan akses lokasi di browser lalu coba lagi.";
        } else if (error.code === error.TIMEOUT) {
          message =
            "Pengambilan lokasi timeout. Coba lagi di area dengan sinyal GPS lebih baik.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          if (options.enableHighAccuracy) {
            requestLocation({
              enableHighAccuracy: false,
              timeout: 20000,
              maximumAge: 60000,
            });
            return;
          }

          message =
            "Lokasi belum tersedia. Pastikan GPS perangkat aktif lalu coba lagi.";
        }

        setLocationError(message);
      },
      options
    );
  };

  const fetchAbsenTypes = async (token, userId, historyRows = history) => {
    const authKey = buildAuthKey(token, userId);

    try {
      const response = await axios.post(
        `${VITE_API_URL}/absen-management/shift-user/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (activeAuthKeyRef.current !== authKey) {
        return;
      }

      if (response.data.status === "success") {
        const rawTypes = Array.isArray(response.data.data) ? response.data.data : [];

        const todayStatus = buildTodayAttendanceStatus(historyRows);
        const hasCompletedRegularDay = hasCompletedRegularAttendanceStatus(todayStatus);
        const doneDirections = new Set(
          Object.entries(todayStatus)
            .filter(([, item]) => item && !isRejectedAttendance(item))
            .map(([direction]) => direction)
        );

        // Fallback untuk response lama: jika backend hanya memberi is_absen_today,
        // artikan absen masuk sudah tercatat sehingga user diarahkan ke absen keluar.
        if (doneDirections.size === 0 && Number(response.data.is_absen_today) === 1) {
          doneDirections.add("masuk");
        }

        const nextRegularDirection = !doneDirections.has("masuk")
          ? "masuk"
          : !doneDirections.has("keluar")
            ? "keluar"
            : "";
        const nextOvertimeDirection = hasCompletedRegularDay
          ? getNextOvertimeDirection(historyRows)
          : "";

        const filteredTypes = rawTypes
          .filter((type) => {
            const direction = getAbsenDirection(type);

            if (!direction) {
              return false;
            }

            if (hasTodayAttendanceForTimeCategory(historyRows, type)) {
              return false;
            }

            return direction === (hasCompletedRegularDay ? nextOvertimeDirection : nextRegularDirection);
          })
          .sort((a, b) => {
            const directionA = getAbsenDirection(a);
            const directionB = getAbsenDirection(b);
            const priorityDirection = hasCompletedRegularDay
              ? nextOvertimeDirection
              : nextRegularDirection;

            if (directionA === priorityDirection && directionB !== priorityDirection) {
              return -1;
            }

            if (directionB === priorityDirection && directionA !== priorityDirection) {
              return 1;
            }

            return 0;
          });

        setAbsenTypes(filteredTypes);

        // Auto-select tipe absen pertama hasil filter
        if (filteredTypes.length > 0) {
          setSelectedAbsenType(String(filteredTypes[0].absen_id));
        } else {
          setSelectedAbsenType("");
        }

      }
    } catch (error) {
      console.error("Error fetching absen types:", error);

      if (error.response?.status === 401) {
        resetSession();
      }
    }
  };

  const fetchProfile = async (token, userId) => {
    const authKey = buildAuthKey(token, userId);

    try {
      const response = await axios.post(
        `${VITE_API_URL}/users/profile/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (activeAuthKeyRef.current !== authKey) {
        return;
      }

      // Backend mengirim data dalam array [data], ambil index ke-0
      const profileData = Array.isArray(response.data.data)
        ? response.data.data[0]
        : response.data.data;

      setUserProfile(profileData || null);
      sessionStorage.setItem(
        "userProfile",
        JSON.stringify(profileData || null)
      );

      const historyData = await fetchHistory(token, userId);
      await fetchAbsenTypes(token, userId, historyData);
    } catch (error) {
      console.error("Error fetching profile:", error);

      if (error.response?.status === 401) {
        resetSession();
        return;
      }

      Swal.fire(
        "Error",
        error.response?.data?.message || "Gagal memuat data profil.",
        "error"
      );
    }
  };

  useEffect(() => {
    const authData = getAuthData();

    if (!authData) {
      return;
    }

    try {
      jwtDecode(authData.token);
      activeAuthKeyRef.current = buildAuthKey(authData.token, authData.userId);
      setIsLoggedIn(true);
      fetchProfile(authData.token, authData.userId);
    } catch (error) {
      console.error("Invalid token:", error);
      resetSession();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      requestLocation();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (cameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [cameraActive, stream]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [photoPreview, stream]);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      Swal.fire("Error", "Username dan password wajib diisi.", "error");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await axios.post(`${VITE_API_URL}/users/login-dashboard`, {
        username: trimmedUsername,
        password: trimmedPassword,
      });

      if (response.data.status === "success") {
        const token = response.data.token;
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        resetUserScopedState();
        applyAuthSession(token, userId);
        setIsLoggedIn(true);
        await fetchProfile(token, userId);
      } else {
        Swal.fire("Gagal", response.data.message || "Login gagal", "error");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Username atau password salah.",
        "error"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      stopCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);
      Swal.fire(
        "Error",
        "Tidak bisa akses kamera. Pastikan izin kamera sudah diaktifkan.",
        "error"
      );
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      Swal.fire(
        "Error",
        "Kamera belum siap. Tunggu sebentar lalu coba lagi.",
        "error"
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          Swal.fire("Error", "Gagal mengambil foto. Coba lagi.", "error");
          return;
        }

        const file = new File([blob], `absen_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(blob);

        if (photoPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhoto(file);
        setPhotoPreview(previewUrl);
        stopCamera();
      },
      "image/jpeg",
      0.8
    );
  };

  const resetPhoto = () => {
    if (photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(null);
    setPhotoPreview(null);
    startCamera();
  };

  const handleSubmit = async () => {
    if (!photo) {
      Swal.fire("Error", "Wajib ambil foto selfie.", "error");
      return;
    }

    if (!hasLocation) {
      Swal.fire("Error", "Wajib aktifkan lokasi GPS.", "error");
      requestLocation();
      return;
    }

    if (!selectedAbsenType || !selectedTypeDetail) {
      Swal.fire("Error", "Wajib pilih tipe absen yang valid.", "error");
      return;
    }

    const authData = getAuthData();

    if (!authData) {
      Swal.fire("Error", "Sesi login tidak ditemukan. Silakan login ulang.", "error");
      resetSession();
      return;
    }

    if (isOvertimeAttempt) {
      const lemburTypeName = selectedTypeDetail?.name || currentAttemptDirection;
      const confirmation = await Swal.fire({
        title: "Konfirmasi Lembur",
        text: effectiveLemburMode
          ? `Absen lembur dengan tipe "${lemburTypeName}". Absen ini perlu approval atasan. Lanjutkan?`
          : `${currentAttemptLabel} lembur akan memakai tipe absen dengan deskripsi ${currentAttemptDirection}. Absen ini perlu approval atasan. Lanjutkan?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, submit lembur",
        cancelButtonText: "Batal",
        confirmButtonColor: "#f39c12",
      });

      if (!confirmation.isConfirmed) {
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", authData.userId);
      const submitRetailId = effectiveLemburMode && selectedLemburRetail
        ? selectedLemburRetail.retail_id
        : selectedTypeDetail.retail_id;
      formData.append("retail_id", submitRetailId);
      formData.append("absen_type_id", selectedAbsenType);
      formData.append("latitude", String(location.latitude));
      formData.append("longitude", String(location.longitude));
      const isOutsideRadius = locationStatus ? !locationStatus.dalamRadius : false;
      const reasonParts = [];

      if (isOutsideRadius) {
        reasonParts.push("Absen di luar radius");
      }

      if (isOvertimeAttempt) {
        reasonParts.push(`Lembur - sudah ada ${currentAttemptLabel} hari ini`);
      }

      const trimmedNote = note.trim();
      if (trimmedNote) {
        reasonParts.push(`Catatan: ${trimmedNote}`);
      }

      formData.append("reason", reasonParts.join("; "));
      formData.append("is_approval", isOutsideRadius || isOvertimeAttempt ? 1 : 0);
      if (effectiveLemburMode) {
        formData.append("is_lembur", "1");
      }
      formData.append("photo_url", photo);

      const response = await axios.post(`${VITE_API_URL}/absensi/`, formData, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        Swal.fire(
          "Berhasil!",
          isOvertimeAttempt
            ? "Absen lembur berhasil dikirim dan menunggu approval."
            : "Absen berhasil disimpan.",
          "success"
        );

        if (photoPreview?.startsWith("blob:")) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhoto(null);
        setPhotoPreview(null);
        setNote("");
        setIsLemburMode(false);
        setSelectedLemburRetail(null);
        const historyData = await fetchHistory(authData.token, authData.userId);
        await fetchAbsenTypes(authData.token, authData.userId, historyData);
        requestLocation();
      } else {
        Swal.fire("Gagal", response.data.message || "Absen gagal.", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);

      if (error.response?.status === 401) {
        Swal.fire("Error", "Sesi habis. Silakan login ulang.", "error");
        resetSession();
        return;
      }

      Swal.fire(
        "Error",
        error.response?.data?.message || "Terjadi kesalahan saat submit.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    resetSession();
  };

  const canSubmit =
    Boolean(photo) &&
    hasLocation &&
    Boolean(selectedAbsenType) &&
    (!effectiveLemburMode || Boolean(selectedLemburRetail)) &&
    !todayHasPending &&
    !loading &&
    !loginLoading;

  if (!isLoggedIn) {
    return (
      <div
        style={{
          padding: "20px",
          maxWidth: "400px",
          margin: "50px auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1 style={{ color: "#e74c3c", margin: 0 }}>OCB Absensi</h1>
          <p style={{ color: "#666" }}>Login untuk absen</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px", position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                paddingRight: "44px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "#888",
                fontSize: "18px",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
              }}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? (
                // Eye-slash icon (hide)
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                // Eye icon (show)
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: "100%",
              padding: "12px",
              background: loginLoading ? "#bdc3c7" : "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              cursor: loginLoading ? "not-allowed" : "pointer",
            }}
          >
            {loginLoading ? "Loading..." : "LOGIN"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "500px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ color: "#e74c3c", margin: 0 }}>Absen Karyawan</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            background: "#95a5a6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {userProfile && (
        <div
          style={{
            background: "#f0f0f0",
            padding: "15px",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: "5px 0" }}>
            <strong>Nama:</strong> {userProfile.name || userProfile.nama || userProfile.full_name || "-"}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Username:</strong> {userProfile.username || userProfile.user_name || "-"}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Retail Shift:</strong> {selectedTypeDetail?.retail_name || userProfile.retail_name || "-"}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        {["masuk", "keluar"].map((direction) => {
          const item = todayAttendanceStatus[direction];
          const statusLabel = getAttendanceStatusLabel(item);
          const isRejected = item && isRejectedAttendance(item);
          const isPending = statusLabel === "Menunggu approval";
          const hasOvertime = todayOvertimeItems.some(
            (overtimeItem) => getAbsenDirection(overtimeItem) === direction
          );
          const statusColor = !item
            ? "#c0392b"
            : isRejected
              ? "#e74c3c"
              : isPending
                ? "#f39c12"
                : "#27ae60";

          return (
            <div
              key={direction}
              style={{
                background: item ? "#f8fffb" : "#fff7f7",
                border: `1px solid ${statusColor}`,
                borderRadius: "12px",
                padding: "12px",
              }}
            >
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#555" }}>
                Status Hari Ini
              </p>
              <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "#2c3e50" }}>
                {absenDirectionLabels[direction]}
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: statusColor,
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {statusLabel}
              </span>
              {item?.absen_time && (
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#555" }}>
                  {format(new Date(item.absen_time), "HH:mm", { locale: localeId })}
                </p>
              )}
              {hasOvertime && (
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#d35400", fontWeight: "bold" }}>
                  Ada data lembur
                </p>
              )}
            </div>
          );
        })}
      </div>

      {todayOvertimeItems.length > 0 && (
        <div
          style={{
            background: "#fff4e5",
            border: "1px solid #f39c12",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "15px",
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: "bold", color: "#d35400" }}>
            Sedang Lembur
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#7f4f00" }}>
            Ada {todayOvertimeItems.length} data lembur hari ini. Status terbaru: {getAttendanceStatusLabel(todayOvertimeItems[0])}
            {todayOvertimeItems[0]?.absen_time
              ? ` pukul ${format(new Date(todayOvertimeItems[0].absen_time), "HH:mm", { locale: localeId })}`
              : ""}
            .
          </p>
        </div>
      )}

      {filteredLemburTypes.length > 0 && !effectiveLemburMode && !attendanceMode && (
        <button
          onClick={() => {
            setIsLemburMode(true);
            setSelectedAbsenType(String(lemburTypes[0].absen_id));
          }}
          style={{
            width: "100%",
            padding: "12px",
            background: "#f39c12",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
            marginBottom: "15px",
          }}
        >
          Mulai Lembur
        </button>
      )}

      {effectiveLemburMode && (
        <div
          style={{
            background: "#fff4e5",
            border: "1px solid #f39c12",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "15px",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "#d35400" }}>
            Mode Lembur Aktif
          </p>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#7f4f00" }}>
            Pilih tipe absen dari shift lain. Absen lembur perlu approval atasan.
          </p>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold", color: "#7f4f00" }}>
              Lokasi Lembur (OC/Store):{lemburDirection === "keluar" ? " (terkunci)" : ""}
            </label>
            <select
              value={selectedLemburRetail?.retail_id || ""}
              disabled={lemburDirection === "keluar"}
              onChange={(e) => {
                const retail = lemburRetails.find((r) => String(r.retail_id) === e.target.value);
                setSelectedLemburRetail(retail || null);
              }}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontSize: "14px",
                background: lemburDirection === "keluar" ? "#f0f0f0" : "#fff",
                cursor: lemburDirection === "keluar" ? "not-allowed" : "pointer",
              }}
            >
              <option value="" disabled>-- Pilih OC/Store --</option>
              {lemburRetails.map((r) => (
                <option key={r.retail_id} value={r.retail_id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setIsLemburMode(false);
              setSelectedLemburRetail(null);
              if (absenTypes.length > 0) {
                setSelectedAbsenType(String(absenTypes[0].absen_id));
              }
            }}
            style={{
              padding: "6px 12px",
              background: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Batal Lembur
          </button>
        </div>
      )}

      <div
        style={{
          background: isOvertimeAttempt ? "#fff4e5" : currentAttemptDirection ? "#eef7ff" : "#f7f7f7",
          border: isOvertimeAttempt
            ? "1px solid #f39c12"
            : currentAttemptDirection
              ? "1px solid #3498db"
              : "1px solid #ddd",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "20px",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold", color: isOvertimeAttempt ? "#d35400" : currentAttemptDirection ? "#2471a3" : "#777" }}>
          {effectiveLemburMode ? "Mode Lembur" : isOvertimeAttempt ? "Attempt Lembur" : "Attempt Aktif"}: {selectedTypeDetail ? currentAttemptLabel : "Belum ada tipe absen yang dipilih"}
        </p>
        {isOvertimeAttempt && (
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#d35400", fontWeight: "bold" }}>
            {effectiveLemburMode && selectedTypeDetail
              ? `Tipe: ${selectedTypeDetail.name}${selectedLemburRetail ? ` — ${selectedLemburRetail.name}` : ""} — perlu approval atasan.`
              : "Akan dihitung lembur dan perlu approval atasan."}
          </p>
        )}
      </div>

      <div
        style={{
          background: "#fff3cd",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
          border: "1px solid #ffc107",
        }}
      >
        <p style={{ margin: "5px 0", fontWeight: "bold" }}>Checklist Absen:</p>
        <p style={{ margin: "5px 0", color: hasLocation ? "green" : "red" }}>
          {hasLocation ? "Siap" : "Belum"} Lokasi GPS{" "}
          {hasLocation
            ? `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
            : "(Belum aktif)"}
        </p>
        {effectiveLemburMode && (
          <p style={{ margin: "5px 0", color: selectedLemburRetail ? "green" : "red" }}>
            {selectedLemburRetail ? "Siap" : "Belum"} Lokasi Lembur{" "}
            {selectedLemburRetail ? `(${selectedLemburRetail.name})` : "(Belum dipilih)"}
          </p>
        )}
        {locationStatus && (
          <p style={{ margin: "5px 0", color: locationStatus.dalamRadius ? "green" : "#f39c12", fontWeight: "bold" }}>
            {locationStatus.dalamRadius
              ? `Dalam radius ${locationStatus.retail_name} (${locationStatus.jarak}m / maks ${locationStatus.radius}m)`
              : `Di luar radius ${locationStatus.retail_name} (${locationStatus.jarak}m / maks ${locationStatus.radius}m) — absen akan menunggu approval atasan`}
          </p>
        )}
        <p style={{ margin: "5px 0", color: photo ? "green" : "red" }}>
          {photo ? "Siap" : "Belum"} Foto Selfie{" "}
          {photo ? "(Sudah diambil)" : "(Belum diambil)"}
        </p>
        <p
          style={{
            margin: "5px 0",
            color: effectiveLemburMode ? "#d35400" : isOvertimeAttempt ? "#d35400" : selectedAbsenType ? "green" : "red",
          }}
        >
          {selectedAbsenType ? "Siap" : "Belum"} Tipe Absen{" "}
          {effectiveLemburMode
            ? "(Lembur, perlu approval)"
            : isOvertimeAttempt
              ? "(Lembur, perlu approval)"
              : selectedAbsenType
                ? "(Sudah dipilih)"
                : "(Belum dipilih)"}
        </p>
        {locationError && (
          <p style={{ margin: "8px 0 0", color: "#c0392b" }}>{locationError}</p>
        )}
      </div>

      {!hasLocation && (
        <button
          onClick={requestLocation}
          style={{
            width: "100%",
            padding: "15px",
            background: "#f39c12",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            marginBottom: "15px",
          }}
        >
          Aktifkan Lokasi GPS
        </button>
      )}

      <div style={{ marginBottom: "15px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
        >
          Tipe Absen:
        </label>
        <select
          value={selectedAbsenType}
          onChange={(e) => setSelectedAbsenType(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            fontSize: "16px",
          }}
        >
          <option value="" disabled>-- Pilih Tipe Absen --</option>
          {activeTypes.map((type) => {
            const direction = getAbsenDirection(type);
            const isOvertimeOption = Boolean(
              hasCompletedRegularAttendance &&
              direction &&
                todayAttendanceStatus[direction] &&
                !isRejectedAttendance(todayAttendanceStatus[direction])
            );

            return (
              <option key={type.absen_id} value={type.absen_id}>
                {type.name}
                {!effectiveLemburMode && type.retail_name ? ` - ${type.retail_name}` : ""}
                {isOvertimeOption ? " (Lembur)" : ""}
              </option>
            );
          })}
        </select>
        {activeTypes.length === 0 && (
          <p style={{ marginTop: "8px", color: "#c0392b", fontSize: "14px" }}>
            {effectiveLemburMode
              ? "Tidak ada tipe absen lembur yang tersedia."
              : "Tipe absen untuk shift ini belum ditemukan."}
          </p>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        {!cameraActive && !photoPreview && (
          <button
            onClick={startCamera}
            style={{
              width: "100%",
              padding: "15px",
              background: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Buka Kamera
          </button>
        )}

        {cameraActive && (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                borderRadius: "10px",
                marginBottom: "10px",
                background: "#000",
              }}
            />
            <button
              onClick={takePhoto}
              style={{
                width: "100%",
                padding: "15px",
                background: "#27ae60",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              Ambil Foto
            </button>
          </div>
        )}

        {photoPreview && (
          <div>
            <img
              src={photoPreview}
              alt="Preview Foto"
              style={{
                width: "100%",
                borderRadius: "10px",
                marginBottom: "10px",
                border: "3px solid #27ae60",
              }}
            />
            <button
              onClick={resetPhoto}
              style={{
                width: "100%",
                padding: "12px",
                background: "#95a5a6",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Ulangi Foto
            </button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}
        >
          Catatan (opsional):
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tulis catatan untuk absen ini..."
          rows={3}
          maxLength={255}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            fontSize: "16px",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p style={{ margin: "4px 0 0", textAlign: "right", color: "#888", fontSize: "12px" }}>
          {note.length}/255
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          padding: "18px",
          background: canSubmit ? "#e74c3c" : "#bdc3c7",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: canSubmit ? "pointer" : "not-allowed",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        {loading ? "Menyimpan..." : "SUBMIT ABSEN"}
      </button>

      {!canSubmit && (
        <p
          style={{
            textAlign: "center",
            color: todayHasPending ? "#f39c12" : "#e74c3c",
            marginTop: "10px",
            fontSize: "14px",
            fontWeight: todayHasPending ? "bold" : "normal",
          }}
        >
          {todayHasPending
            ? "Ada absen yang masih menunggu approval. Tidak bisa absen lagi sampai di-approve atau di-reject."
            : "Lengkapi semua checklist di atas untuk submit absen."}
        </p>
      )}

      {/* Riwayat Absen Bulan Ini */}
      <div style={{ marginTop: "30px" }}>
        <h3 style={{ color: "#e74c3c", marginBottom: "12px", fontSize: "16px" }}>
          Riwayat Absen Bulan Ini
        </h3>

        {historyLoading ? (
          <p style={{ textAlign: "center", color: "#888" }}>Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", fontSize: "14px" }}>
            Belum ada data absen bulan ini.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.map((item) => {
              const isValid = item.is_valid === 1 || item.is_valid === "1";
              const approvalStr = String(item.status_approval || "").toLowerCase();
              const isRejected = isRejectedAttendance(item);
              const isPending =
                !isRejected &&
                (item.status_approval === "1" ||
                  item.status_approval === 1 ||
                  approvalStr.includes("waiting") ||
                  approvalStr.includes("menunggu") ||
                  approvalStr.includes("pending"));
              const isOntime = item.status === "Ontime" || item.status_absen === 1 || item.status_absen === "1";

              let statusLabel = "";
              let statusColor = "";
              if (isRejected) {
                statusLabel = "Ditolak";
                statusColor = "#e74c3c";
              } else if (isPending) {
                statusLabel = "Menunggu Approval";
                statusColor = "#f39c12";
              } else if (isValid) {
                statusLabel = "Valid";
                statusColor = "#27ae60";
              } else {
                statusLabel = "Belum Divalidasi";
                statusColor = "#95a5a6";
              }

              return (
                <div
                  key={item.absensi_id}
                  style={{
                    background: "#f9f9f9",
                    border: "1px solid #eee",
                    borderLeft: `4px solid ${statusColor}`,
                    borderRadius: "8px",
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "14px" }}>
                      {item.description || item.category_absen || "-"}
                    </p>
                    <p style={{ margin: "0 0 2px", fontSize: "13px", color: "#555" }}>
                      {item.absen_time
                        ? format(new Date(item.absen_time), "dd MMM yyyy, HH:mm", { locale: localeId })
                        : "-"}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: isOntime ? "#27ae60" : "#e74c3c" }}>
                      {item.status || (isOntime ? "Ontime" : "Terlambat")}
                    </p>
                    {item.reason ? (
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#888" }}>
                        Catatan: {item.reason}
                      </p>
                    ) : null}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        background: statusColor,
                        color: "#fff",
                      }}
                    >
                      {statusLabel}
                    </span>
                    {(item.is_lembur === 1 || item.is_lembur === "1") && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          background: "#f39c12",
                          color: "#fff",
                          marginLeft: "4px",
                        }}
                      >
                        Lembur
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AbsenKaryawan;
