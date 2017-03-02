const Router = require('express').Router;
const ensureLogin = require('connect-ensure-login');

const protRoutes = Router();

protRoutes.get('/secret', ensureLogin.ensureLoggedIn(), (req, res, next) => {
  res.send('Shhh, it\'s a secret');
});

protRoutes.get('/kgb-files', ensureLogin.ensureLoggedIn(), (req, res, next) => {
  res.send('In Soviet Russia, files store you');
});

module.exports = protRoutes;
