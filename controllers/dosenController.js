const db = require('../config/db');
const {uploadProfileToCloudinary} = require('./uploadProfileController');
const cloudinary = require('../config/cloudinary'); 


const getDosenByNip = async (request, h) => {
    const { nip } = request.params;

    try {
        const [rows] = await db.execute(
            `SELECT
                webapp_dosen.id, nip, nik, nama, foto, alamat, no_wa, jenis_kelamin, riwayat_penyakit, kegiatan_sementara,
                webapp_dosen.email,
                kabupaten_domisili.nama_kabupaten AS kabupaten,
                webapp_provinsi.nama_provinsi AS provinsi,
                kecamatan_domisili.nama_kecamatan AS kecamatan,
                desa_domisili.nama_desa AS desa,
                webapp_prodi.nama_prodi as program_studi,
                webapp_fakultas.nama_fakultas as fakultas,
                webapp_tematik.nama_tematik AS tematik,
                kabupaten_kkn.nama_kabupaten AS kabupaten_tematik,
                kecamatan_kkn.nama_kecamatan AS kecamatan_tematik,
                desa_kkn.nama_desa AS desa_tematik
            FROM webapp_dosen
            LEFT JOIN webapp_kabupaten AS kabupaten_domisili 
                ON webapp_dosen.kabupaten_id = kabupaten_domisili.kode_kabupaten 
            LEFT JOIN webapp_prodi 
                ON webapp_dosen.prodi_id = webapp_prodi.kode_prodi
            LEFT JOIN webapp_fakultas 
                ON webapp_dosen.fakultas_id = webapp_fakultas.kode_fakultas
            LEFT JOIN webapp_tematik 
                ON webapp_dosen.nip = webapp_tematik.dpk_id
            LEFT JOIN webapp_provinsi 
                ON webapp_dosen.provinsi_id = webapp_provinsi.id
            LEFT JOIN webapp_kecamatan AS kecamatan_domisili 
                ON webapp_dosen.kecamatan_id = kecamatan_domisili.kode_kecamatan
            LEFT JOIN webapp_desa AS desa_domisili 
                ON webapp_dosen.desa_id = desa_domisili.kode_desa
            LEFT JOIN webapp_kabupaten AS kabupaten_kkn
                ON webapp_tematik.kabupaten_id = kabupaten_kkn.kode_kabupaten
            LEFT JOIN webapp_kecamatan AS kecamatan_kkn
                ON webapp_tematik.kecamatan_id = kecamatan_kkn.kode_kecamatan
            LEFT JOIN webapp_desa AS desa_kkn
                ON webapp_tematik.desa_id = desa_kkn.kode_desa
            WHERE webapp_dosen.nip = ?`,
            [nip]
        );

        if (rows.length === 0) {
            return h.response({ message: 'Dosen tidak ditemukan' }).code(404);
        }

        return h.response(rows[0]).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};


const updateDosen = async (request, h) => {
    const { id } = request.params;
    const { 
        nik, email, no_wa, alamat, riwayat_penyakit, kegiatan_sementara, 
        kabupaten_id, kecamatan_id, desa_id, provinsi_id 
    } = request.payload;

    const fotoFile = request.payload.foto;

    try {

        const [existingDosenData] = await db.execute(
            `SELECT foto 
             FROM webapp_dosen 
             WHERE id = ?`,
            [id]
        );

        if (existingDosenData.length === 0) {
            return h.response({ message: 'Dosen tidak ditemukan' }).code(404);
        }

        const oldFotoUrl = existingDosenData[0].foto;

        let newFotoUrl = oldFotoUrl;
        if (fotoFile && fotoFile._data) {
                    // Hapus foto lama dari Cloudinary jika ada
            if (oldFotoUrl) {
                const publicIdMatch = oldFotoUrl.match(/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
                const publicId = publicIdMatch ? publicIdMatch[1] : null;

                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, (error) => {
                        if (error) {
                            console.error('Error deleting photo from Cloudinary:', error);
                        }
                    });
                }
            }
        
            // Upload foto baru ke Cloudinary
            const uploadResult = await uploadProfileToCloudinary(fotoFile);
            newFotoUrl = uploadResult.secure_url; 
        }

        const [result] = await db.execute(
            `UPDATE webapp_dosen SET
            nik = ?, alamat = ?, no_wa = ?, email = ?, riwayat_penyakit = ?, kegiatan_sementara = ?,
            kabupaten_id = ?, kecamatan_id = ?, desa_id = ?, provinsi_id = ?, foto = ?
            WHERE id = ?`,
            [
                nik, alamat, no_wa, email, riwayat_penyakit, kegiatan_sementara,
                kabupaten_id, kecamatan_id, desa_id, provinsi_id, newFotoUrl, id
            ]
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

module.exports = { getDosenByNip, updateDosen };
