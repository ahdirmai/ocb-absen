const { get } = require("../routes/users");
const usersModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { invalidTokens } = require("./storeTokenInvalid");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const getAllUsers = async (req, res) => {
  try {
    const [data] = await usersModel.getAllUsers();
    res.json({
      message: "Get All User Success",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const getUserUpline = async (req, res) => {
  const { idUser } = req.params;
  try {
    const [data] = await usersModel.getUserUpline(idUser);
    res.json({
      message: "Get User Under Upline Success",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const getRoles = async (req, res) => {
  try {
    const [data] = await usersModel.getRoles();
    res.json({
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const [data] = await usersModel.getAllCategories();
    res.json({
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const getCategories = async (req, res) => {
  const { idRole } = req.params;
  try {
    const [data] = await usersModel.getCategories(idRole);
    res.json({
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const getRolesWithCategories = async (req, res) => {
  try {
    // Ambil data dari database
    const data = await usersModel.getRolesWithCategories();

    // Proses data menjadi struktur yang diinginkan
    const roles = data.reduce((acc, curr) => {
      const roleIndex = acc.findIndex((role) => role.role_id === curr.role_id);

      if (roleIndex === -1) {
        // Tambahkan role baru jika belum ada
        acc.push({
          role_id: curr.role_id,
          name_role: curr.name_role,
          categories: curr.id_category
            ? [
                {
                  id_category: curr.id_category,
                  category_user: curr.category_user,
                },
              ]
            : [],
        });
      } else if (curr.id_category) {
        // Tambahkan kategori jika role sudah ada
        acc[roleIndex].categories.push({
          id_category: curr.id_category,
          category_user: curr.category_user,
        });
      }

      return acc;
    }, []);

    // Kirim response
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles with categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await usersModel.findUserByUsername(username);
    if (!user)
      return res.status(404).json({
        message: "User not found!",
        status: "failed",
        status_code: "404",
      });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({
        message: "Invalid password!",
        status: "failed",
        status_code: "400",
      });

    const token = jwt.sign(
      { id: user.user_id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "365d",
      }
    );
    // Decode token
    const decoded = jwt.decode(token);

    // Cek waktu expired
    console.log("Waktu Expired (timestamp):", decoded.exp);
    console.log("Waktu Expired (format waktu):", new Date(decoded.exp * 1000));
    res.json({
      message: "Token generated successfully",
      status: "success",
      status_code: "200",
      user_id: user.user_id,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const loginUserDashboard = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await usersModel.findUserByUsername(username);
    if (!user)
      return res.status(404).json({
        message: "User not found!",
        status: "failed",
        status_code: "404",
      });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({
        message: "Invalid password!",
        status: "failed",
        status_code: "400",
      });

    const token = jwt.sign(
      { id: user.user_id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "365d",
      }
    );
    // Decode token
    const decoded = jwt.decode(token);

    // Cek waktu expired
    console.log("Waktu Expired (timestamp):", decoded.exp);
    console.log("Waktu Expired (format waktu):", new Date(decoded.exp * 1000));
    res.json({
      message: "Token generated successfully",
      status: "success",
      status_code: "200",
      token,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createNewUsers = async (req, res) => {
  // console.log(req.body)
  const { body } = req;
  try {
    const imageUrl = req.file ? `/assets/profile/${req.file.filename}` : null;

    // Periksa apakah username/email sudah ada di database
    const existingUser = await usersModel.findUserByUsername(body.username);
    if (existingUser) {
      return res.status(400).json({
        message:
          "The username is already taken. Please choose a different username.",
        status: "failed",
        status_code: "400",
      });
    }
    const passwordGenerate = "Ocb2024";
    // Hash password sebelum menyimpannya
    const hashedPassword = await bcrypt.hash(passwordGenerate, 10);

    // Simpan user baru ke database
    const result = await usersModel.createNewUsers(
      body,
      hashedPassword,
      imageUrl
    );
    res.json({
      message: "User registered successfully!",
      status: "success",
      status_code: "200",
      data: {
        user_id: result.insertId,
        ...body,
        photo_url: imageUrl,
      },
    });
    // SET rror jika gagal simpan ke DB
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
  }
};

const updateUsers = async (req, res) => {
  const { idUser } = req.params;
  const { body } = req;
  let imageUrl;
  console.log("Request Body:", body);
  console.log("Request Params:", idUser);
  // console.log("Request File:", req.file);
  try {
    //Cek jika ada file baru
    if (req.file) {
      imageUrl = `/assets/profile/${req.file.filename}`;

      // Cari pengguna berdasarkan idUser
      const existingUser = await usersModel.findUserByUserId(idUser);

      if (existingUser.photo_url) {
        // Ekstrak nama file dari path URL di database
        const fileName = path.basename(existingUser.photo_url);
        // console.log(fileName);
        const oldImagePath = path.resolve(
          __dirname,
          "../../public/profile",
          fileName
        );
        console.log("Path file yang akan dihapus:", oldImagePath);
        // Hapus file lama jika ada
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    } else {
      // Jika tidak ada file baru, gunakan yang lama
      const existingUser = await usersModel.findUserByUserId(idUser);
      imageUrl = existingUser.photo_url;
    }

    // Lakukan update
    //   await usersModel.updateUsers(body, idUser, imageUrl);
    await usersModel.updateUsers(body, idUser, imageUrl);

    res.json({
      message: "Update user success",
      status: "success",
      status_code: "200",
      data: {
        user_id: idUser,
        ...body,
        photo_url: imageUrl, // Sertakan URL gambar baru/lama dalam respons
      },
    });
  } catch (error) {
    console.error("Error in updateUsers:", {
      idUser,
      body,
      file: req.file,
      error,
    });

    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message,
    });
  }
};

const deleteUsers = async (req, res) => {
  const { idUser } = req.params;
  const { body } = req;
  try {
    await usersModel.deleteUsers(body, idUser);
    res.json({
      message: "Delete user Success",
      status: "success",
      status_code: "200",
      data: {
        id_user: idUser,
        ...body,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error,
    });
    console.log(error);
  }
};

const profileUsers = async (req, res) => {
  const { idUser } = req.params;
  try {
    // Ambil data profil pengguna
    const [data] = await usersModel.profileUsers(idUser);
    const idPotongan = 2;

    if (!data) {
      return res.status(404).json({
        message: "User not found",
        status: "failed",
        status_code: "404",
      });
    }

    // Query tambahan untuk estimasi fee
    const getPotonganMangkir = await usersModel.getPotonganMangkir(idPotongan);
    const PotonganMangkir = getPotonganMangkir.value;
    const [feeData] = await usersModel.getFeePerUser(idUser, PotonganMangkir);
    console.log("Fee Data (Full):", JSON.stringify(feeData, null, 2)); // Debugging

    // Tangani feeData yang kosong

    const estimasiGaji = feeData.total_gaji_akhir;

    console.log("Estimasi Gaji:", estimasiGaji); // Debugging

    // Tambahkan estimasi fee ke dalam data profil
    const enrichedData = {
      ...data,
      estimasi_gaji: feeData,
    };

    res.json({
      message: "Get User Profiles Success",
      status: "success",
      status_code: "200",
      data: data,
      fee: feeData,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const profileUsersWeb = async (req, res) => {
  const { idUser } = req.params;
  try {
    // Ambil data profil pengguna
    const [data] = await usersModel.profileUsersWeb(idUser);

    if (!data) {
      return res.status(404).json({
        message: "User not found",
        status: "failed",
        status_code: "404",
      });
    }

    res.json({
      message: "Get User Profiles Success",
      status: "success",
      status_code: "200",
      data: data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      status: "failed",
      status_code: "500",
      serverMessage: error.message || error,
    });
  }
};

const logoutUser = (req, res) => {
  // Tidak ada logika khusus untuk logout karena klien akan menghapus token
  const authHeader = req.headers["authorization"];
  console.log("ini dia" + authHeader);
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(400).send({ message: "No token provided" });
  }

  // Tambahkan token ke daftar token yang sudah tidak valid
  invalidTokens.push(token);
  // console.log("Daftar token invalid:", invalidTokens);

  return res.status(200).send({
    message: "Logged out successfully",
    status: "success",
    status_code: "200",
  });
};

// Ubah Password
const changePassword = async (req, res) => {
  const { user_id, passwordOld, passwordNew } = req.body;

  if (!user_id || !passwordOld || !passwordNew) {
    return res.status(400).json({
      message: "Semua field harus diisi!",
      status: "Failed",
      status_code: "400",
    });
  }

  try {
    // Ambil user dari database
    const user = await usersModel.getUserById(user_id);
    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan!",
        status: "Failed",
        status_code: "404",
      });
      console.log("user gak temu");
    }

    // Cek apakah password lama sesuai
    const isMatch = await bcrypt.compare(passwordOld, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Password lama salah!",
        status: "Failed",
        status_code: "401",
      });
    }

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordNew, salt);

    // Update password di database
    await usersModel.changePassword(user_id, hashedPassword);

    res.json({
      message: "Password berhasil diubah!",
      status: "Success",
      status_code: "200",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Terjadi kesalahan server!",
      status: "Failed",
      status_code: "500",
    });
  }
};

module.exports = {
  getAllUsers,
  createNewUsers,
  updateUsers,
  deleteUsers,
  loginUser,
  logoutUser,
  profileUsers,
  loginUserDashboard,
  getRolesWithCategories,
  getRoles,
  getCategories,
  getAllCategories,
  getUserUpline,
  changePassword,
  profileUsersWeb,
};
