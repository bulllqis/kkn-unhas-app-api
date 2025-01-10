const db = require('../config/db');
const {uploadProfileToCloudinary} = require('./uploadProfileController');
const cloudinary = require('../config/cloudinary'); 

const getMahasiswaByNim = async (request, h) => {

    const { nim } = request.params;

    try {
        const [rows] = await db.execute(
            `SELECT
                webapp_mahasiswa.id, 
                webapp_mahasiswa.nim, 
                webapp_mahasiswa.nama, 
                webapp_mahasiswa.foto, 
                webapp_mahasiswa.alamat, 
                webapp_mahasiswa.no_wa, 
                webapp_mahasiswa.jenis_kelamin, 
                webapp_mahasiswa.ttl,
                webapp_mahasiswa.wa_ortu, 
                webapp_mahasiswa.email, 
                webapp_mahasiswa.lokasi_kkn,
                webapp_gelombangkkn.nomor_gel AS gelombangkkn,
                webapp_kabupaten.nama_kabupaten AS kabupaten,
                webapp_provinsi.nama_provinsi AS provinsi,
                webapp_kecamatan.nama_kecamatan AS kecamatan,
                webapp_prodi.nama_prodi AS program_studi,
                webapp_fakultas.nama_fakultas AS fakultas,
                webapp_tematik.dpk_id AS nip_dpk,
                webapp_dosen.nama AS dpk
            FROM webapp_mahasiswa
            LEFT JOIN webapp_gelombangkkn
                ON webapp_mahasiswa.kode_angkatan_id = webapp_gelombangkkn.id
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
            LEFT JOIN webapp_anggotatematik 
               ON webapp_mahasiswa.nim = webapp_anggotatematik.nim_id
            LEFT JOIN webapp_tematik 
                ON webapp_anggotatematik.kode_tematik_id = webapp_tematik.kode_tematik
            LEFT JOIN webapp_dosen 
                ON webapp_tematik.dpk_id = webapp_dosen.nip
            WHERE webapp_mahasiswa.nim = ?`,
            [nim]
        );

        if (!rows || rows.length === 0) {
            return h.response({ message: 'Mahasiswa tidak ditemukan' }).code(404);
        }

        return h.response(rows[0]).code(200);

    } catch (error) {
        console.error(error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};


const updateMahasiswa = async (request, h) => {
    const { id } = request.params;
    const { email, no_wa, alamat } = request.payload;
    const fotoFile = request.payload.foto;

    try {
        // Ambil data mahasiswa lama, termasuk URL foto
        const [existingMahasiswaData] = await db.execute(
            `SELECT foto 
             FROM webapp_mahasiswa 
             WHERE id = ?`,
            [id]
        );

        if (existingMahasiswaData.length === 0) {
            return h.response({ message: 'Mahasiswa tidak ditemukan' }).code(404);
        }

        const oldFotoUrl = existingMahasiswaData[0].foto;

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
            newFotoUrl = uploadResult.secure_url; // URL foto yang berhasil diunggah
        }

        // Update data mahasiswa di database
        const [result] = await db.execute(
            `UPDATE webapp_mahasiswa
             SET email = ?, no_wa = ?, alamat = ?, foto = ?
             WHERE id = ?`,
            [email, no_wa, alamat, newFotoUrl, id]
        );

        if (result.affectedRows === 0) {
            return h.response({ message: 'Mahasiswa tidak ditemukan atau tidak ada perubahan' }).code(404);
        }

        return h.response({ success: true }).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

const getMahasiswaByDpkNip = async (request, h) => {
    const { nip } = request.params;

    try {
        const [rows] = await db.execute(
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

        if (!rows || rows.length === 0) {
            return h.response({ message: 'Tidak ada mahasiswa yang diawasi oleh DPK dengan NIP ini' }).code(404);
        }

        return h.response(rows).code(200);
    } catch (error) {
        console.error('Error:', error);
        return h.response({ message: 'Internal server error' }).code(500);
    }
};

module.exports = { updateMahasiswa, getMahasiswaByDpkNip, getMahasiswaByNim };