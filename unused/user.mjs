import mongoose from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  handle: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    unique: true,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
},
{
  toObject: {
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.hash;
      delete ret.salt;
    }
  },
  toJSON: {
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.hash;
      delete ret.salt;
    }
  }

});

userSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

userSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.hash === hash;
};

userSchema.methods.generateJWT = function() {
  const today = new Date();
  const exiprationDate = new Date(today);
  expirationDate.setDate(today.getDate() + 60);
  token = new jwt.sign({
    id: this._id,
    exp: parseInt(expirationDate.getTime() / 1000, 10)}, 'secret');
}

userSchema.methods.toAuthoJSON = function() {
  return {
    _id: this._id,
    token: this.generateJWT()
  };
};

userSchema.statics.findByLogin = async function (login) {
  let user = await this.findOne({
    username: login,
  });
  if (!user) {
    user = await this.findOne({ email: login});
  }
  return user;
};

userSchema.pre('remove', function(next) {
  this.model('Message').deleteMany({user: this._id}, next);
});

const User = mongoose.model('User', userSchema);

export default User;
