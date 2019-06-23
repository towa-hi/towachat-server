import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
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
},
{
  toObject: {
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
    }
  },
  toJSON: {
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
    }
  }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
