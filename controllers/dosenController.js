const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const getDosenByParameter = async (request, h) => {
    const { parameter } = request.params;

    if (/^\d{18,}$/.test(parameter)) {  
        return getDosenByNip(parameter, h);
    } else {
        return getDosenByUserId(parameter, h);
    }
};

const getDosenByUserId = async (id, h) => {

    try {
        const [dosen] = await db.execute(
            `SELECT
                nip, nama, foto, alamat, no_wa, jenis_kelamin, kelompok, 
                webapp_dosen.email,
                webapp_kabupaten.nama_kabupaten as kabupaten,
                webapp_provinsi.nama_provinsi as provinsi,
                webapp_kecamatan.nama_kecamatan as kecamatan,
                webapp_prodi.nama_prodi as program_studi,
                webapp_fakultas.nama_fakultas as fakultas
            FROM webapp_dosen
            LEFT JOIN webapp_kabupaten ON webapp_dosen.kabupaten_id = webapp_kabupaten.kode_kabupaten
            LEFT JOIN webapp_prodi ON webapp_dosen.prodi_id = webapp_prodi.kode_prodi
            LEFT JOIN webapp_fakultas ON webapp_dosen.fakultas_id = webapp_fakultas.kode_fakultas
            LEFT JOIN webapp_provinsi ON webapp_dosen.provinsi_id = webapp_provinsi.id
            LEFT JOIN webapp_kecamatan ON webapp_dosen.kecamatan_id = webapp_kecamatan.kode_kecamatan
            LEFT JOIN auth_user ON webapp_dosen.user_id_id = auth_user.id
            WHERE webapp_dosen.user_id_id = ?`,
            [id]
        );

        if (!dosen) {
            return h.response({ message: 'Dosen tidak ditemukan' }).code(404);
        }

        return h.response({ dosen }).code(200);

    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};
const getDosenByNip = async (nip, h) => {

    try {
        const [dosen] = await db.execute(
            `SELECT
                nip, nama, foto, alamat, no_wa, jenis_kelamin, kelompok, 
                webapp_dosen.email,
                webapp_kabupaten.nama_kabupaten as kabupaten,
                webapp_provinsi.nama_provinsi as provinsi,
                webapp_kecamatan.nama_kecamatan as kecamatan,
                webapp_prodi.nama_prodi as program_studi,
                webapp_fakultas.nama_fakultas as fakultas
            FROM webapp_dosen
            LEFT JOIN webapp_kabupaten ON webapp_dosen.kabupaten_id = webapp_kabupaten.kode_kabupaten
            LEFT JOIN webapp_prodi ON webapp_dosen.prodi_id = webapp_prodi.kode_prodi
            LEFT JOIN webapp_fakultas ON webapp_dosen.fakultas_id = webapp_fakultas.kode_fakultas
            LEFT JOIN webapp_provinsi ON webapp_dosen.provinsi_id = webapp_provinsi.id
            LEFT JOIN webapp_kecamatan ON webapp_dosen.kecamatan_id = webapp_kecamatan.kode_kecamatan
            LEFT JOIN auth_user ON webapp_dosen.user_id_id = auth_user.id
            WHERE webapp_dosen.nip = ?`,
            [nip]
        );

        if (!dosen) {
            return h.response({ message: 'Dosen tidak ditemukan' }).code(404);
        }

        return h.response({ dosen }).code(200);

    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

const updateDosen = async (request, h) => {
    const { id } = request.params;
    const { email, no_wa } = request.payload;
    const fotoFile = request.payload.foto;

    if (!fotoFile || !fotoFile.hapi || !fotoFile.hapi.filename) {
        return h.response({ message: 'File foto tidak valid atau tidak ditemukan' }).code(400);
    }

    const fotoPath = `foto/profil/${fotoFile.hapi.filename}`;

    try {
        const fileStream = fs.createWriteStream(fotoPath);
        fotoFile.pipe(fileStream);

        await new Promise((resolve, reject) => {
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
        });

        const [result] = await db.execute(
            `UPDATE webapp_dosen
            SET email = ?, no_wa = ?, foto = ?
            WHERE user_id_id = ?`,
            [email, no_wa, fotoPath, id]
        );

        if (result.affectedRows === 0) {
            return h.response({ message: 'Dosen tidak ditemukan atau tidak ada perubahan' }).code(404);
        }

        return h.response({ success: true}).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error'}).code(500);
    }
};

module.exports = { getDosenByParameter, updateDosen };
