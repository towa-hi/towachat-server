import express from 'express';
import socketIO from 'socket.io';
import config from './config/main';
import mongoose from 'mongoose';
import models, {connectDb} from './models';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

const server = app.listen(config.port, () => {
  //init socket.io server
  const io = socketIO(server);
  console.log("connected to port: " + config.port);
  //init mongodb
  connectDb().then(async () => {
    console.log('connected to mongodb at: ' + config.database);
  })
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

  app.post('/logIn', (req, res) => {
    console.log('received POST /logIn');
    console.log(req.body);
    return res.send({'loginRecieved': true});
  });

  app.post('/makeAccount', (req, res) => {

  });
});

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
