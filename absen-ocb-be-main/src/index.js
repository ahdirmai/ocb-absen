require('dotenv').config();
const PORT = process.env.PORT || 4000;
const express = require('express');
const usersRoutes = require('./routes/users');
const retailRoutes = require('./routes/retailManagement');
const absenManagementRoutes = require('./routes/absenManagement');
const shiftManagementRoutes = require('./routes/shift');
const absensiRoutes = require('./routes/absensi');
const summaryRoutes = require('./routes/summary');
const feeRoutes = require('./routes/feeManagement');
const morgan = require('morgan');
const managementUser = require('./routes/managementUser');
const menuRoutes = require('./routes/menu');
const versionRoute = require('./routes/version');
const laporanRoute = require('./routes/laporan')
// const midllewareLogRequest = require('./middleware/logs');
const createError = require('http-errors');
const cors = require('cors');
const app = express();
app.use(cors({
    origin: true //allow semua origin
}));
app.use(morgan('dev'))
// app.use(midllewareLogRequest)
app.use(express.json())
// app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static('public/images'));
app.use('/assets/profile', express.static('public/profile'));
app.use('/assets/laporan', express.static('public/laporan'));
// app.get('/', async (req, res, next)=>{
//     res.send("hello Home")
// })
app.use('/api/users', usersRoutes);
app.use('/api/retail', retailRoutes);
app.use('/api/absen-management', absenManagementRoutes);
app.use('/api/shift-management', shiftManagementRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/management', feeRoutes);
app.use('/api/user-management', managementUser);
app.use('/api/menu', menuRoutes);
app.use('/api/version', versionRoute);
app.use('/api/file', laporanRoute)
app.use(async (req, res, next) => {
    next(createError.NotFound())
})
app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})
app.listen(PORT, () => {
    console.log(`Success runing on Port ${PORT}`)
})