import mongoose from 'mongoose';
import User from './user';
import Message from './message';
import config from '../config/main';

const connectDb = () => {
  mongoose.set('useNewUrlParser', true);
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  return mongoose.connect(config.database);
};

const models = {User, Message};

export {connectDb};
export default models;
