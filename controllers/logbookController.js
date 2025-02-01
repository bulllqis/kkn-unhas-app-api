const WebSocket = require('ws');
const db = require('../config/db');
const { uploadLogbookToCloudinary } = require('./uploadLogbookController');
const cloudinary = require('../config/cloudinary');

let wss;

function initializeWebSocketServer(server) {
    wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws, req) => {
        const params = new URLSearchParams(req.url.split('?')[1]);
        ws.userId = params.get('userId'); // Simpan userId
    });
    
}

function sendNotification(userId, message) {
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client.userId === userId) {
                client.send(JSON.stringify({ message }));
            }
        });
    }
}

async function addNotification(userId, logbookId, message) {
    await db.execute(
        `INSERT INTO webapp_notifikasi (user_id, logbook_id, pesan, status, created_at)
         VALUES (?, ?, ?, 'belum dibaca', NOW(6))`,
        [userId, logbookId, message]
    );
}

const addLogbook = async (request, h) => {
    const { nim, judul, tanggal, jam_mulai, jam_selesai, deskripsi } = request.payload;
    const fotoFile = request.payload.foto; 
  
    try {
        const [result] = await db.execute(
            `INSERT INTO webapp_logbook (nim_id, judul, tanggal, jam_mulai, jam_selesai, deskripsi, komentar, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?,'', 'Pending', NOW(6), NOW(6))`,
            [nim, judul, tanggal, jam_mulai, jam_selesai, deskripsi]
        );


        const logbookId = result.insertId;

        const uploadResult = await uploadLogbookToCloudinary(fotoFile);
        const fotoUrl = uploadResult.secure_url; 

        await db.execute(
            `INSERT INTO webapp_logbookdokumen (logbook_id, foto, created_at, updated_at)
            VALUES (?, ?, NOW(6), NOW(6))`,
            [logbookId, fotoUrl] 
        );
        

        const [dosen] = await db.execute(
            `SELECT dpk_id
            FROM webapp_tematik 
            JOIN webapp_anggotatematik ON webapp_tematik.kode_tematik = webapp_anggotatematik.kode_tematik_id
            WHERE webapp_anggotatematik.nim_id = ?`, [nim]);

        if (dosen.length > 0) {
            const dosenId = dosen[0].dpk_id;
            const message = `Mahasiswa dengan NIM ${nim} menambahkan logbook baru.`;
            await addNotification(dosenId, logbookId, message);
            sendNotification(dosenId, message);
        }

        return h.response({ success: true, logbookId }).code(201);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error'}).code(500);
    }
};

const getLogbooksByNim = async (nim, h) => {
   
    try {
        const [rows] = await db.execute(
            `SELECT logbook.*, 
                    logbookdokumen.foto AS dokumentasi
             FROM webapp_logbook AS logbook
             LEFT JOIN webapp_logbookdokumen AS logbookdokumen 
             ON logbook.id = logbookdokumen.logbook_id
            WHERE logbook.nim_id = ?
            ORDER BY logbook.tanggal DESC`,
            [nim]
        );

        return h.response( rows ).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({message: 'Internal server error'}).code(500);
    }
};

const getLogbookById = async (id, h) => {
    try {
        const [rows] = await db.execute(
            `SELECT logbook.*, 
                    logbookdokumen.foto AS dokumentasi
             FROM webapp_logbook AS logbook
             LEFT JOIN webapp_logbookdokumen AS logbookdokumen 
             ON logbook.id = logbookdokumen.logbook_id
             WHERE logbook.id = ?
             ORDER BY logbook.tanggal DESC`,
            [id]
        );

        if (rows.length === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        const logbook = rows[0];
        return h.response(logbook).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({message: 'Internal server error'}).code(500);
    }
};

const getLogbookByParameter = async (request, h) => {
    const { parameter } = request.params;

    if (isNaN(parameter)) {
        return getLogbooksByNim(parameter, h);
    } else {
        return getLogbookById(parameter, h);
    }
};

const editLogbook = async (request, h) => {
    const { id } = request.params;
    const { judul, tanggal, jam_mulai, jam_selesai, deskripsi, foto } = request.payload;

    try {
        // Dapatkan data logbook lama termasuk foto
        const [existingLogbookData] = await db.execute(
            `SELECT logbookdokumen.foto 
             FROM webapp_logbook AS logbook
             LEFT JOIN webapp_logbookdokumen AS logbookdokumen 
             ON logbook.id = logbookdokumen.logbook_id
             WHERE logbook.id = ?`,
            [id]
        );

        if (existingLogbookData.length === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        const oldFotoUrl = existingLogbookData[0].foto;

        // Update logbook tanpa menyentuh dokumen terlebih dahulu
        const [updateLogbook] = await db.execute(
            `UPDATE webapp_logbook
             SET judul = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ?, deskripsi = ?, updated_at = NOW(6)
             WHERE id = ?`,
            [judul, tanggal, jam_mulai, jam_selesai, deskripsi, id]
        );

        if (updateLogbook.affectedRows === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        if (foto) {
            // Hapus foto lama dari Cloudinary jika ada
            if (oldFotoUrl) {
                const publicIdMatch = oldFotoUrl.match(/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
                const publicId = publicIdMatch ? publicIdMatch[1] : null;

                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            // Unggah foto baru ke Cloudinary
            const uploadResult = await uploadLogbookToCloudinary(foto);
            const newFotoUrl = uploadResult.secure_url;

            // Update URL foto baru ke database
            await db.execute(
                `UPDATE webapp_logbookdokumen
                 SET foto = ?, updated_at = NOW(6)
                 WHERE logbook_id = ?`,
                [newFotoUrl, id]
            );
        }

        return h.response({ success: true }).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};


const deleteLogbook = async (request, h) => {
    const { id } = request.params;

    try {
        const [logbookData] = await db.execute(
            `SELECT logbookdokumen.foto 
             FROM webapp_logbook AS logbook
             LEFT JOIN webapp_logbookdokumen AS logbookdokumen 
             ON logbook.id = logbookdokumen.logbook_id
             WHERE logbook.id = ?`,
            [id]
        );

        if (logbookData.length === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        const fotoUrl = logbookData[0].foto;

        if (fotoUrl) {
            // Ekstrak `public_id` dari URL menggunakan regex
            const publicIdMatch = fotoUrl.match(/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
            const publicId = publicIdMatch ? publicIdMatch[1] : null;

            if (!publicId) {
                console.error('Gagal mengekstrak publicId:', fotoUrl);
            }

            // Hapus dari Cloudinary
            const result = await cloudinary.uploader.destroy(publicId);
        }

        // Hapus data dari database
        await db.execute(`DELETE FROM webapp_logbookdokumen WHERE logbook_id = ?`, [id]);
        await db.execute(`DELETE FROM webapp_logbook WHERE id = ?`, [id]);

        return h.response({ success: true }).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};


const editLogbookByDosen = async (request, h) => {
    const { id } = request.params; 
    const { komentar, status } = request.payload; 

    try {
        const [result] = await db.execute(
            `UPDATE webapp_logbook
             SET komentar = ?, status = ?
             WHERE id = ?`,
            [komentar, status, id]
        );

        
        const [logbookData] = await db.execute(
            `SELECT nim_id FROM webapp_logbook WHERE id = ?`,
            [id]
        );

        if (logbookData.length > 0) {
            const nim = logbookData[0].nim_id;
            const message = `Logbook Anda telah disetujui`;
            await addNotification(nim, id, message);
            sendNotification(nim, message);
        }

        if (result.affectedRows === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        return h.response({success:true}).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({message: 'Internal server error'}).code(500);
    }
};

const getNotificationsByUserId = async (request, h) => {
    const { userId } = request.params;

    try {
        const [notifications] = await db.execute(
            `SELECT * FROM webapp_notifikasi WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        return h.response(notifications).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

const markNotificationAsRead = async (request, h) => {
    const { id } = request.params;

    try {
        await db.execute(`UPDATE webapp_notifikasi SET status = 'dibaca' WHERE id = ?`, [id]);
        return h.response({ success: true }).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

module.exports = { addLogbook, getLogbookByParameter, editLogbook, deleteLogbook, editLogbookByDosen,
                    getNotificationsByUserId, markNotificationAsRead, initializeWebSocketServer, };