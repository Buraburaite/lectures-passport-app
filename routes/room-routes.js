const Router = require('express').Router;
const ensure = require('connect-ensure-login');
const multer = require('multer');
const Room = require('../models/room-model.js');

const roomRoutes = Router();
const uploads = multer({ dest: __dirname + '/../public/uploads/' });

roomRoutes.get('/rooms/new', (req, res, next) => {
  res.render('rooms/new', {
    message: req.flash('success')
  });
});

roomRoutes.post('/rooms',
ensure.ensureLoggedIn(),
uploads.single('picture'),
(req, res, next) => {
  const filename = req.file.filename;

  const newRoom = new Room ({
    name:     req.body.name,
    desc:     req.body.desc,
    picture: `/uploads/${filename}`,
    owner:    req.user._id   // <-- we add the user ID
  });

  newRoom.save ((err) => {
    if (err) {
      next(err);
      return;
    }
    else {
      req.flash('success', 'Your room has been created.');
      res.redirect('/rooms/new');
    }
  });
});

roomRoutes.get('/my-rooms', ensure.ensureLoggedIn(), (req, res, next) => {
  Room.find({ owner: req.user._id }, (err, myRooms) => {
    if (err) {
      next(err);
      return;
    }

    res.render('rooms/index', { rooms : myRooms });
  });
});

module.exports = roomRoutes;
