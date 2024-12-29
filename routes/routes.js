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
    path: '/mahasiswa/{parameter}',
    handler: mahasiswaController.getMahasiswaByParameter,
  },
  {
      method: 'GET',
      path: '/mahasiswa/dpk/{nip}', // Beri prefiks "dpk"
      handler: mahasiswaController.getMahasiswaByDpkNip,
  },
  {
    method: 'PATCH', // Menggunakan PATCH untuk operasi update parsial
    path: '/mahasiswa/{id}',
    handler: mahasiswaController.updateMahasiswa, // Handler untuk update data
    options: {
      payload: {
          allow: 'multipart/form-data',
          multipart: true,
          output: 'stream', // Untuk mendukung file unggahan
          parse: true,
      },
   },
 }

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
          allow: 'multipart/form-data'
      }
  }
  },
  {
      method: 'GET',
      path: '/logbook/{parameter}',
      handler: logbookController.getLogbookByParameter,
  },
  {
    method: 'PUT',
    path: '/logbook/{id}',
    handler: logbookController.editLogbook,
    options: {
      payload: {
          output: 'stream',
          multipart: true,
          parse: true,
          allow: 'multipart/form-data'
      }
    } 
  },
  {
    method: 'DELETE',
    path: '/logbook/{id}',
    handler: logbookController.deleteLogbook,
},
{
  method: 'PUT',
  path: '/logbook/dosen/{id}',
  handler: logbookController.editLogbookByDosen,
}
  
];

const dosenRoutes = [
  {
    method: 'GET',
    path: '/dosen/{parameter}',
    handler: dosenController.getDosenByParameter,
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
 }

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
];
module.exports = [ ...authRoutes, ...mahasiswaRoutes, ...logbookRoutes, ...dosenRoutes, ...beritaRoutes ];