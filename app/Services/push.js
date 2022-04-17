const PushController = require('../Controllers/Http/PushController');
const PushControllerInstance = new PushController;

module.exports = {
    push: async (title, options) => {
        return await PushControllerInstance.sendPush(title, options);
    }
}