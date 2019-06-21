import express from 'express';
import socketIO from 'socket.io';
import config from './config/main';
import mongoose from 'mongoose';
import models, {connectDb} from './models';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';

const app = express();

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const DEFAULT_AVATAR_URL = "https://i.imgur.com/Dp9Ogph.png";

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

var users = {
  mono: 'wewlad'
};

const server = app.listen(config.port, () => {
  //init socket.io server
  const io = socketIO(server);
  console.log("connected to port: " + config.port);
  //init mongodb
  connectDb().then(async () => {
    console.log('connected to mongodb at: ' + config.database);
    //socket.io event handlers
    io.on('connection', (socket) => {
      console.log('user connected with socket id: ' + socket.id);
      socket.on('login', (socket) => {
        console.log('user tried to log in with id:' + socket.id);
      });
    });
    //http request stuff
    app.get('/startingState', (req, res) => {
      var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      console.log('serving startingState for ' + ip);
      var startingState = {
        allUsers: getUsers(),
        allPostData: getPosts(),
      }
      return res.send(startingState);
    });

    app.get('/userList', (req, res) => {
      console.log('received GET /userList');
      return res.send(userList);
    });

    app.get('/getMessages', (req, res) => {
      console.log('');
    });

    app.post('/newUser', (req, res) => {
      console.log('recieved POST /newUser');
      console.log("/newUser body: " + req.body);
      if (!req.body) {
        return res.sendStatus(400);
      }
      if (!req.body.username || !req.body.password) {
        return res.status(400).send('SERVER: Missing username or password!');
      }
      models.User.countDocuments({username: req.body.username}, (err, count) => {
        if (count > 0) {
          return res.status(409).send('SERVER: A user with this specified username already exists!');
        } else {
          if (req.body.password.length < MIN_PASSWORD_LENGTH || req.body.password.length > MAX_PASSWORD_LENGTH) {
            return res.status(400).send('SERVER: Password must be between ' + MIN_PASSWORD_LENGTH + ' and ' + MAX_PASSWORD_LENGTH + ' characters long!');
          }
          var newUserData = makeNewUserData(req.body.username, req.body.password);
          newUserData.save().then(() => {
            console.log(newUserData);
            return res.status(200).send('SERVER: account successfully created!');
          });
        }
      })
    });

    app.post('/logIn', (req, res) => {
      console.log('received POST /logIn');
      if (!req.body) {
        return res.sendStatus(400);
      }
      if (!req.body.username || !req.body.password) {
        return res.status(400).send('SERVER: Missing username or password!');
      }
      console.log(req.body);
      var request = {
        username: req.body.username,
        password: req.body.password
      };
      var response = {loggedIn: false};
      if (request.username == 'mono') {
        response = {loggedIn: true};
      }
      return res.send(response);
    });

  })

});

function makeNewUserData(username, password) {
  //salt and hash password
  var salt = crypto.randomBytes(16).toString('hex');
  var hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  //insert into db
  var newUserData = new models.User({
    number: 42,
    username: username,
    handle: username,
    avatar: DEFAULT_AVATAR_URL,
    hash: hash,
    salt: salt,
  });
  return newUserData;
}

function getPosts() {
  const mockUser = {
    name:'name',
    handle:'@name0',
    avatar:'https://i.imgur.com/Dp9Ogph.png',
    id:'1',
  };
  const mockPost1 = {
    id:1,
    time:'Today at 11:53 PM',
    user:mockUser,
    postText:"Praesent sodales arcu sit amet nulla ullamcorper ornare.",
  };
  const mockPost2 = {
    id:2,
    time:'Today at 11:54 PM',
    user:mockUser,
    postText:"this is a short post"
  };
  const mockPost3 = {
    id:3,
    time:'Today at 11:55 PM',
    user:mockUser,
    postText:"this is a long post Lorem ipsum dolor sit amet",
  };
  var messages = [mockPost1, mockPost2, mockPost3];
  return messages;
}

function getUsers() {
  var users = [
  {name:'name0',handle:'@name0',avatar:'https://i.imgur.com/Dp9Ogph.png'},
  {name:'name1',handle:'@name1',avatar:'https://i.imgur.com/Dp9Ogph.png'},
  {name:'name2',handle:'@name2',avatar:'https://i.imgur.com/Dp9Ogph.png'},
];
  return users;
}
