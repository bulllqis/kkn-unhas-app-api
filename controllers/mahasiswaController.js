const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const getMahasiswaByParameter = async (request, h) => {
    const { parameter } = request.params;

    if (isNaN(parameter)) {
        return getMahasiswaByNim(parameter, h);
    } else {
        return getMahasiswaByUserId(parameter, h);
    }
};
const getMahasiswaByUserId = async (id, h) => {

    try {
        const [mahasiswa] = await db.execute(
            `SELECT
                webapp_mahasiswa.nim, 
                webapp_mahasiswa.nama, 
                webapp_mahasiswa.foto, 
                webapp_mahasiswa.alamat, 
                webapp_mahasiswa.no_wa, 
                webapp_mahasiswa.jenis_kelamin, 
                webapp_mahasiswa.ttl, 
                webapp_mahasiswa.kelompok, 
                webapp_mahasiswa.ket, 
                webapp_mahasiswa.lokasi_umum, 
                webapp_mahasiswa.no_regist, 
                webapp_mahasiswa.wa_ortu, 
                webapp_mahasiswa.email, 
                webapp_mahasiswa.lokasi_kkn,
                webapp_kabupaten.nama_kabupaten AS kabupaten,
                webapp_provinsi.nama_provinsi AS provinsi,
                webapp_kecamatan.nama_kecamatan AS kecamatan,
                webapp_prodi.nama_prodi AS program_studi,
                webapp_fakultas.nama_fakultas AS fakultas,
                webapp_gelombangkkn.nomor_gel AS gelombangkkn,
                webapp_tematik.dpk_id AS nip_dpk,
                webapp_dosen.nama AS dpk
            FROM webapp_mahasiswa
            LEFT JOIN webapp_kabupaten 
                ON webapp_mahasiswa.kabupaten_id = webapp_kabupaten.kode_kabupaten
            LEFT JOIN webapp_prodi 
                ON webapp_mahasiswa.prodi_id = webapp_prodi.kode_prodi
            LEFT JOIN webapp_kecamatan 
                ON webapp_mahasiswa.kecamatan_id = webapp_kecamatan.kode_kecamatan
            LEFT JOIN webapp_fakultas 
                ON webapp_mahasiswa.fakultas_id = webapp_fakultas.kode_fakultas
            LEFT JOIN webapp_provinsi 
                ON webapp_mahasiswa.provinsi_id = webapp_provinsi.id
            LEFT JOIN auth_user 
                ON webapp_mahasiswa.user_id_id = auth_user.id
            LEFT JOIN webapp_gelombangkkn 
                ON webapp_mahasiswa.kode_angkatan_id = webapp_gelombangkkn.id
            LEFT JOIN webapp_anggotatematik 
               ON webapp_mahasiswa.nim = webapp_anggotatematik.nim_id
            LEFT JOIN webapp_tematik 
                ON webapp_anggotatematik.kode_tematik_id = webapp_tematik.kode_tematik
            LEFT JOIN webapp_dosen 
                ON webapp_tematik.dpk_id = webapp_dosen.nip
            WHERE webapp_mahasiswa.user_id_id = ?`,
            [id]
        );

        if (!mahasiswa || mahasiswa.length === 0) {
            return h.response({ message: 'Mahasiswa tidak ditemukan' }).code(404);
        }

        return h.response({ mahasiswa: mahasiswa[0] }).code(200);

    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};
const getMahasiswaByNim = async (nim, h) => {

    try {
        const [mahasiswa] = await db.execute(
            `SELECT
                webapp_mahasiswa.nim, 
                webapp_mahasiswa.nama, 
                webapp_mahasiswa.foto, 
                webapp_mahasiswa.alamat, 
                webapp_mahasiswa.no_wa, 
                webapp_mahasiswa.jenis_kelamin, 
                webapp_mahasiswa.ttl, 
                webapp_mahasiswa.kelompok, 
                webapp_mahasiswa.ket, 
                webapp_mahasiswa.lokasi_umum, 
                webapp_mahasiswa.no_regist, 
                webapp_mahasiswa.wa_ortu, 
                webapp_mahasiswa.email, 
                webapp_mahasiswa.lokasi_kkn,
                webapp_kabupaten.nama_kabupaten AS kabupaten,
                webapp_provinsi.nama_provinsi AS provinsi,
                webapp_kecamatan.nama_kecamatan AS kecamatan,
                webapp_prodi.nama_prodi AS program_studi,
                webapp_fakultas.nama_fakultas AS fakultas,
                webapp_gelombangkkn.nomor_gel AS gelombangkkn,
                webapp_tematik.dpk_id AS nip_dpk,
                webapp_dosen.nama AS dpk
            FROM webapp_mahasiswa
            LEFT JOIN webapp_kabupaten 
                ON webapp_mahasiswa.kabupaten_id = webapp_kabupaten.kode_kabupaten
            LEFT JOIN webapp_prodi 
                ON webapp_mahasiswa.prodi_id = webapp_prodi.kode_prodi
            LEFT JOIN webapp_kecamatan 
                ON webapp_mahasiswa.kecamatan_id = webapp_kecamatan.kode_kecamatan
            LEFT JOIN webapp_fakultas 
                ON webapp_mahasiswa.fakultas_id = webapp_fakultas.kode_fakultas
            LEFT JOIN webapp_provinsi 
                ON webapp_mahasiswa.provinsi_id = webapp_provinsi.id
            LEFT JOIN auth_user 
                ON webapp_mahasiswa.user_id_id = auth_user.id
            LEFT JOIN webapp_gelombangkkn 
                ON webapp_mahasiswa.kode_angkatan_id = webapp_gelombangkkn.id
            LEFT JOIN webapp_anggotatematik 
               ON webapp_mahasiswa.nim = webapp_anggotatematik.nim_id
            LEFT JOIN webapp_tematik 
                ON webapp_anggotatematik.kode_tematik_id = webapp_tematik.kode_tematik
            LEFT JOIN webapp_dosen 
                ON webapp_tematik.dpk_id = webapp_dosen.nip
            WHERE webapp_mahasiswa.nim = ?`,
            [nim]
        );

        if (!mahasiswa || mahasiswa.length === 0) {
            return h.response({ message: 'Mahasiswa tidak ditemukan' }).code(404);
        }

        return h.response({ mahasiswa: mahasiswa[0] }).code(200);

    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};


const updateMahasiswa = async (request, h) => {
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
            `UPDATE webapp_mahasiswa
            SET email = ?, no_wa = ?, foto = ?
            WHERE user_id_id = ?`,
            [email, no_wa, fotoPath, id]
        );

        if (result.affectedRows === 0) {
            return h.response({ message: 'Mahasiswa tidak ditemukan atau tidak ada perubahan' }).code(404);
        }

        return h.response({success:true}).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({message: 'Internal server error'}).code(500);
    }
};

const getMahasiswaByDpkNip = async (request, h) => {
    const { nip } = request.params;

    try {
        const [mahasiswa] = await db.execute(
            `SELECT
                webapp_mahasiswa.nim, 
                webapp_mahasiswa.nama, 
                webapp_mahasiswa.foto, 
                webapp_prodi.nama_prodi AS program_studi,
                webapp_fakultas.nama_fakultas AS fakultas
            FROM webapp_mahasiswa
            LEFT JOIN webapp_prodi 
                ON webapp_mahasiswa.prodi_id = webapp_prodi.kode_prodi
            LEFT JOIN webapp_fakultas 
                ON webapp_mahasiswa.fakultas_id = webapp_fakultas.kode_fakultas
            LEFT JOIN webapp_anggotatematik 
               ON webapp_mahasiswa.nim = webapp_anggotatematik.nim_id
            LEFT JOIN webapp_tematik 
                ON webapp_anggotatematik.kode_tematik_id = webapp_tematik.kode_tematik
            WHERE webapp_tematik.dpk_id = ?`,
            [nip]
        );

        if (!mahasiswa || mahasiswa.length === 0) {
            return h.response({ message: 'Tidak ada mahasiswa yang diawasi oleh DPK dengan NIP ini' }).code(404);
        }

        return h.response({ mahasiswa }).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

module.exports = { updateMahasiswa, getMahasiswaByDpkNip, getMahasiswaByParameter };