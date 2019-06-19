import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true,
  },
  time: {
    type: Number,
    required: true,
  },
  postText: {
    type: String,
    required: true,
  },

});

const Message = mongoose.model('Message', messageSchema);

export default Message;
