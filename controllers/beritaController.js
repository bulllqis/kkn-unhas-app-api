const db = require('../config/db');

const getBerita = async (request, h) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, created_at, judul, slug, isi, foto, \`show\`, created_by 
             FROM webapp_berita 
             ORDER BY created_at DESC`
        );

        return h.response({ berita: rows }).code(200);
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

        return h.response({ berita: rows[0] }).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

module.exports = { getBerita, getBeritaById };
