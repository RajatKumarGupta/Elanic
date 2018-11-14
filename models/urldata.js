const mongoose = require('mongoose');

const details = mongoose.Schema({
  url: { type: String },
  responses: {
    type: Array,
  },
  method: {
    type: String,
  },
  header: {
    type: Object,
  },
  data: {
    type: Object,
  },
}, {
  collection: 'urldetails',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('UrlDetail', details);
