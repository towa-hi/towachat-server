import mongoose from 'mongoose';

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
