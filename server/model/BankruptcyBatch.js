// models/BankruptcyBatch.js
import mongoose from 'mongoose';

const BatchSchema = new mongoose.Schema({
  from       : { type: String, required: true },  // YYYY-MM-DD
  to         : { type: String, required: true },
  grabbedAt  : { type: Date,   default: Date.now },
  countDistinct: Number,
  countRaw     : Number,
  pages      : [{
    page  : Number,
    count : Number,
    list  : [String]
  }]
});

export default mongoose.model('BankruptcyBatch', BatchSchema);
