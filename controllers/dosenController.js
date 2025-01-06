const db = require('../config/db');
const {uploadProfileToCloudinary} = require('./uploadProfileController');
const cloudinary = require('../config/cloudinary'); 


const getDosenByNip = async (request, h) => {
    const { nip } = request.params;

    try {
        const [rows] = await db.execute(
            `SELECT
                id, nip, nama, foto, alamat, no_wa, jenis_kelamin, 
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
    const { email, no_wa } = request.payload;
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
            `UPDATE webapp_dosen
            SET email = ?, no_wa = ?, foto = ?
            WHERE id = ?`,
            [email, no_wa, newFotoUrl, id]
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
