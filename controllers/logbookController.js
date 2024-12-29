const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const formatTimestamp = () => {
    const now = new Date();
    const pad = (num, size) => num.toString().padStart(size, '0');

    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`;
    const time = `${pad(now.getHours(), 2)}:${pad(now.getMinutes(), 2)}:${pad(now.getSeconds(), 2)}`;

    const microseconds = pad(now.getMilliseconds() * 1000, 6);

    return `${date} ${time}.${microseconds}`;
};

const addLogbook = async (request, h) => {
    const { nim, judul, tanggal, jam_mulai, jam_selesai, deskripsi } = request.payload;
    const fotoFile = request.payload.foto; 

    const timestamp = formatTimestamp();
    try {
        const [result] = await db.execute(
            `INSERT INTO webapp_logbook (nim_id, judul, tanggal, jam_mulai, jam_selesai, deskripsi, komentar, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?,'', 'belum ditinjau', ?, ?)`,
            [nim, judul, tanggal, jam_mulai, jam_selesai, deskripsi, timestamp, timestamp]
        );

        const logbookId = result.insertId;

        const fileName = `${Date.now()}_${fotoFile.hapi.filename}`;
        const filePath = `foto/logbook/${fileName}`;

        const fileStream = fs.createWriteStream(filePath);
        await fotoFile.pipe(fileStream);

        await db.execute(
            `INSERT INTO webapp_logbookdokumen (logbook_id, foto, created_at, updated_at)
            VALUES (?, ?, NOW(),NOW())`,
            [logbookId, filePath]
        );
        

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

        return h.response({ logbooks: rows }).code(200);
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

        return h.response({ logbook: rows[0] }).code(200);
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

    const timestamp = formatTimestamp();

    try {
        const [existingLogbookData] = await db.execute(
            `SELECT foto FROM webapp_logbookdokumen WHERE logbook_id = ?`,
            [id]
        );

        if (existingLogbookData.length === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        const oldFotoFilePath = existingLogbookData[0].foto;

        const [result] = await db.execute(
            `UPDATE webapp_logbook
             SET judul = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ?, deskripsi = ?, updated_at = ?
             WHERE id = ?`,
            [judul, tanggal, jam_mulai, jam_selesai, deskripsi, timestamp, id]
        );

        if (result.affectedRows === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        if (foto) {
            if (oldFotoFilePath) {
                const oldFilePath = path.join(__dirname, `../${oldFotoFilePath}`);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); 
                }
            }

            const fileName = `${Date.now()}_${foto.hapi.filename}`;
            const filePath = `foto/logbook/${fileName}`;
            
            const fileStream = fs.createWriteStream(filePath);
            await foto.pipe(fileStream);

            await db.execute(
                `UPDATE webapp_logbookdokumen
                 SET foto = ?, updated_at = ?
                 WHERE logbook_id = ?`,
                [filePath, timestamp, id]
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

        const fotoFilePath = logbookData[0].foto;

        if (fotoFilePath) {
            const filePath = path.join(__dirname, `../${fotoFilePath}`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath); 
            }
        }

        await db.execute(
            `DELETE FROM webapp_logbookdokumen WHERE logbook_id = ?`,
            [id]
        );

        await db.execute(
            `DELETE FROM webapp_logbook WHERE id = ?`,
            [id]
        );

        return h.response({success:true}).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({message: 'Internal server error'}).code(500);
    }
};

const editLogbookByDosen = async (request, h) => {
    const { id } = request.params; 
    const { komentar, status } = request.payload; 

    
    const timestamp = formatTimestamp();
    try {
        const [result] = await db.execute(
            `UPDATE webapp_logbook
             SET komentar = ?, status = ?, updated_at = ?
             WHERE id = ?`,
            [komentar, status, timestamp, id]
        );

        if (result.affectedRows === 0) {
            return h.response({ message: 'Logbook tidak ditemukan' }).code(404);
        }

        return h.response({success:true}).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({message: 'Internal server error'}).code(500);
    }
};


module.exports = { addLogbook, getLogbookByParameter, editLogbook, deleteLogbook, editLogbookByDosen };