# Gunakan image Node.js versi ringan dan stabil
FROM node:18-alpine

# Set direktori kerja di dalam server Fly.io
WORKDIR /app

# Salin file konfigurasi package.json
COPY package.json ./

# Install semua module (express, socket.io)
RUN npm install

# Salin seluruh sisa file proyek (termasuk folder public dan server.js)
COPY . .

# Beritahu Fly.io bahwa aplikasi kita berjalan di port 3000
EXPOSE 3000

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]