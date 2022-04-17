const Server = use('Server')
const Env = use('Env');
const appURL = Env.get('APP_URL', 'http://127.0.0.1:3333');
const axios = require('axios');
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
const Helpers = use('Helpers');
let io;

const getVersion = () => {
    let version = 'None';
    const Helpers = use('Helpers');
    const versionPath = Helpers.appRoot('version.txt');
    const Config = use('Config');
    const fs = require('fs')
    try {
        if (fs.existsSync(versionPath)) {
            version = fs.readFileSync(versionPath,'utf8');
        }
    } catch (error) {
        // do nothing. we're assuming that there's nothing to show    
    }
    return version;
}

if (typeof(process.send) === undefined || !Helpers.isAceCommand()) {
    io = use('socket.io')(Server.getInstance())
    io.use( async (socket, next) => {
        try {
            const {data} = await axios({
                url: `${appURL}/api/v1/middleware`,
                method: 'get',
                headers: Object.assign({}, axios.defaults.headers.common, socket.handshake.headers),
            });
            if (false === data.body.requires_mfa && true === data.body.logged_in) {
                socket.user = data.body.user;
                return next();
            }
            return next(new Error('Not Logged In'));
        } catch (error) {
            return next(new Error('Not Logged In'));
        }
    });
    
    io.on('connection', function (socket) {
        //console.log(`${socket.user.username} has connected via socket ${socket.id}`);
        require('./ListController')(socket);
        socket.emit('version', getVersion());
    });
} else {
    io = {
        emit: (event, data) => {
            process.send({
                event,
                data
            });
        }
    }
}

module.exports = io;