'use strict';

const monitoringController = require('./controllers/monitoring');

module.exports.initRoutes = function(router) {
    router.route('/').post(monitoringController.saveDetails);
    router.route('/ping/:id').post(monitoringController.trackResponseTime);
    router.route('/:id?').get(monitoringController.getDetails);
    router.route('/:id').put(monitoringController.updateDetails);
    router.route('/:id').delete(monitoringController.deleteDetails);
};
