const db = require('../config/db');
const { uploadBeritaToCloudinary } = require('./uploadBeritaController');

const getBerita = async (request, h) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, created_at, judul, slug, isi, foto, \`show\`, created_by 
             FROM webapp_berita 
             ORDER BY created_at DESC`
        );

        return h.response(rows).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

const getBeritaById = async (request, h) => {
    const { id } = request.params;

    try {
        const [rows] = await db.execute(
            `SELECT id, created_at, judul, slug, isi, foto, \`show\`, created_by 
             FROM webapp_berita 
             WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return h.response({ message: 'Berita tidak ditemukan' }).code(404);
        }

        return h.response(rows[0]).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

const addBerita = async (request, h) => {
    const { judul, slug, isi, show, created_by } = request.payload;
    const fotoFile = request.payload.foto;

    try {
        // Mengunggah foto ke Cloudinary
        const uploadResult = await uploadBeritaToCloudinary(fotoFile);
        const fotoUrl = uploadResult.secure_url;

        const [result] = await db.execute(
            `INSERT INTO webapp_berita (judul, slug, isi, foto, \`show\`, created_by, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW(6))`,
            [judul, slug, isi, fotoUrl, show, created_by]
        );

        return h.response({ success: true, beritaId: result.insertId }).code(201);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

module.exports = { getBerita, getBeritaById, addBerita };
