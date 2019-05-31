const moongose = require('mongoose');
const ConversationSchema = moongose.Schema({
  participants: [
    {
      senderId: { type: moongose.Schema.Types.ObjectId, ref: 'User' },
      receiverId: { type: moongose.Schema.Types.ObjectId, ref: 'User' }
    }
  ]
});

module.exports = moongose.model('Conversation', ConversationSchema);
