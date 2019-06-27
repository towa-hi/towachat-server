const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const config = require('./config/main');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: config.SECRET, cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

require('./models/user');
require('./models/message');
require('./config/passport');
app.use(require('./routes'));

mongoose.connect(config.DATABASE_URL, {useNewUrlParser: true, autoIndex: false}, () => {
  console.log('Mongoose connected.');

  const server = app.listen(config.PORT, () => {
    console.log('Server running on port ' + config.PORT);
    const io = socketIO(server);
    io.on('connection', (socket) => {
      console.log('Socket.io: User connected with socket id: ' + socket.id);
      //more socket stuff goes here
    });

  });
});
mongoose.set('debug', true);

//Models & routes
