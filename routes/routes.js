const authController = require('../controllers/authController');
const mahasiswaController = require('../controllers/mahasiswaController');
const logbookController = require('../controllers/logbookController');
const dosenController = require('../controllers/dosenController');
const beritaController = require('../controllers/beritaController');
const db = require('../config/db');

const authRoutes = [
    {
        method: 'POST',
        path: '/login',
        handler: authController.login,
    },
    {
        method: 'PATCH',
        path: '/update-password/{userId}',
        handler: authController.updatePassword,
    },
];

const mahasiswaRoutes = [
    {
        method: 'GET',
        path: '/mahasiswa/{nim}',
        handler: mahasiswaController.getMahasiswaByNim,
    },
    {
        method: 'GET',
        path: '/mahasiswa/dpk/{nip}',
        handler: mahasiswaController.getMahasiswaByDpkNip,
    },
    {
        method: 'PATCH',
        path: '/mahasiswa/{id}',
        handler: mahasiswaController.updateMahasiswa,
        options: {
            payload: {
                allow: 'multipart/form-data',
                multipart: true,
                output: 'stream',
                parse: true,
            },
        },
    },
];

const logbookRoutes = [
    {
      method: 'POST',
      path: '/logbook',
      handler: logbookController.addLogbook,
      options: {
          payload: {
              output: 'stream',
              multipart: true,
              parse: true,
              allow: 'multipart/form-data',
          },
      },
    },
    {
        method: 'GET',
        path: '/logbook/{parameter}',
        handler: logbookController.getLogbookByParameter,
    },
    {
        method: 'PATCH',
        path: '/logbook/{id}',
        handler: logbookController.editLogbook,
        options: {
            payload: {
                output: 'stream',
                multipart: true,
                parse: true,
                allow: 'multipart/form-data',
            },
        },
    },
    {
        method: 'DELETE',
        path: '/logbook/{id}',
        handler: logbookController.deleteLogbook,
    },
    {
        method: 'PATCH',
        path: '/logbook/dosen/{id}',
        handler: logbookController.editLogbookByDosen,
    },
];

const dosenRoutes = [
    {
        method: 'GET',
        path: '/dosen/{nip}',
        handler: dosenController.getDosenByNip,
    },
    {
        method: 'PATCH',
        path: '/dosen/{id}',
        handler: dosenController.updateDosen,
        options: {
            payload: {
                allow: 'multipart/form-data',
                multipart: true,
                output: 'stream',
                parse: true,
            },
        },
    },
];

const beritaRoutes = [
    {
        method: 'GET',
        path: '/berita',
        handler: beritaController.getBerita,
    },
    {
        method: 'GET',
        path: '/berita/{id}',
        handler: beritaController.getBeritaById,
    },
    {
        method: 'POST',
        path: '/berita', 
        handler: beritaController.addBerita,
        options: {
            payload: {
                output: 'stream',
                multipart: true,
                parse: true,
                allow: 'multipart/form-data',
            },
        },
    }
    
];

const notificationRoutes = [
    {
        method: 'GET',
        path: '/notifikasi/{userId}',
        handler: logbookController.getNotificationsByUserId, 
    },
    {
        method: 'PATCH',
        path: '/notifikasi/{id}',
        handler: logbookController.markNotificationAsRead,
    },
];

const locationRoutes = [
    {
        method: 'GET',
        path: '/provinsi',
        handler: async (request, h) => {
            try {
                const [rows] = await db.query("SELECT id , nama_provinsi as nama FROM webapp_provinsi");
                return h.response(rows).code(200);
            } catch (err) {
                console.error(err);
                return h.response({ error: "Gagal mengambil data" }).code(500);
            }
        }
    },
    
    {
        method: 'GET',
        path: '/kabupaten/{provId}',
        handler: async (request, h) => {
            const { provId } = request.params;
            try {
                const [rows] = await db.query("SELECT kode_kabupaten as kode, nama_kabupaten as nama FROM webapp_kabupaten WHERE kode_provinsi_id = ?", [provId]);
                return h.response(rows).code(200);
            } catch (err) {
                console.error(err);
                return h.response({ error: "Gagal mengambil data" }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/kecamatan/{kabId}',
        handler: async (request, h) => {
            const { kabId } = request.params;
            try {
                const [rows] = await db.query("SELECT kode_kecamatan as kode, nama_kecamatan as nama FROM webapp_kecamatan WHERE kode_kabupaten_id = ?", [kabId]);
                return h.response(rows).code(200);
            } catch (err) {
                console.error(err);
                return h.response({ error: "Gagal mengambil data" }).code(500);
            }
        }
    },
    {
        method: 'GET',
        path: '/desa/{kecId}',
        handler: async (request, h) => {
            const { kecId } = request.params;
            try {
                const [rows] = await db.query("SELECT kode_desa as kode, nama_desa as nama FROM webapp_desa WHERE kode_kecamatan_id = ?", [kecId]);
                return h.response(rows).code(200);
            } catch (err) {
                console.error(err);
                return h.response({ error: "Gagal mengambil data" }).code(500);
            }
        }
    },
    
];

module.exports = [...authRoutes, ...mahasiswaRoutes, ...logbookRoutes, ...dosenRoutes, ...beritaRoutes, ...notificationRoutes, ...locationRoutes];
