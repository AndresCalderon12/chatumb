const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const _ = require('lodash');
//const looger = require('morgan');

const app = express();
app.use(cors());

const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const { User } = require('./Helpers/UserClass');
require('./sockets/streams')(io, User, _);
require('./sockets/private')(io);

const dbconfig = require('./config/secrets');
const auth = require('./routes/authRoutes');
const posts = require('./routes/postRoutes');
const users = require('./routes/userRoutes');
const friends = require('./routes/friendsRoutes');
const message = require('./routes/messageRoutes');
const image = require('./routes/imageRoutes');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
//app.use(logger('dev'));

mongoose.Promise = global.Promise;
mongoose.connect(dbconfig.url, { useNewUrlParser: true });

app.use('/api/chatapp', auth);
app.use('/api/chatapp', posts);
app.use('/api/chatapp', users);
app.use('/api/chatapp', friends);
app.use('/api/chatapp', message);
app.use('/api/chatapp', image);

app.set('port', process.env.PORT || 3000);

server.listen(app.get('port'), () => {
  console.log(`server on port ${app.get('port')}`);
});
