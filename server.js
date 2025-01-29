const Hapi = require('@hapi/hapi');
const routes = require('./routes/routes');
require('dotenv').config();
const { initializeWebSocketServer } = require('../controllers/logbookController');


const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0',
        routes: {
            payload: {
                maxBytes: 10485760, 
            },
        },
    });

    server.route(routes);
    initializeWebSocketServer(server.listener);
    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

init();
