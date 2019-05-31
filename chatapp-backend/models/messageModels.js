const moongose = require('mongoose');
const MessageSchema = moongose.Schema({
  conversationId: {
    type: moongose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  sender: { type: String },
  receiver: { type: String },
  message: [
    {
      senderId: { type: moongose.Schema.Types.ObjectId, ref: 'User' },
      receiverId: { type: moongose.Schema.Types.ObjectId, ref: 'User' },
      sendername: { type: String },
      receivername: { type: String },
      body: { type: String, default: '' },
      isRead: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now() }
    }
  ]
});
module.exports = moongose.model('Message', MessageSchema);
