const mongoose = require('mongoose');
const {Schema} = mongoose;

const ChannelSchema = new Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true,
  },
  time: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  public: {
    type: Boolean,
    required: true,
  },
  members: {
    type: [mongoose.Schema.Types.ObjectId], ref: 'User',
  },
  banned: {
    type: [mongoose.Schema.Types.ObjectId], ref: 'User',
  },
  officers: {
    type: [mongoose.Schema.Types.Objectid], ref: 'User',
  },
});

mongoose.model('Channel', ChannelSchema);
