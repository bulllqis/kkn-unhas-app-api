const authController = require('../controllers/authController');
const mahasiswaController = require('../controllers/mahasiswaController');
const logbookController = require('../controllers/logbookController');
const dosenController = require('../controllers/dosenController');
const beritaController = require('../controllers/beritaController');

const authRoutes = [
    {
        method: 'POST',
        path: '/login',
        handler: authController.login,
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

module.exports = [...authRoutes, ...mahasiswaRoutes, ...logbookRoutes, ...dosenRoutes, ...beritaRoutes, ...notificationRoutes];
