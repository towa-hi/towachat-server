import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    unique: false,
    required: true,
  },
  handle: {
    type: String,
    unique: true,
    required: true,
  },
  avatar: {
    type: String,
    unique: false,
    required: true,
  },
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
