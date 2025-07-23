// models/BilanFiling.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const BilanFilingSchema = new Schema({
  cbe             : { type: String, required: true },          // 10 digits
  referenceNumber : { type: String, required: true },

  // Métadonnées principales (optionnelles mais utiles)
  depositDate     : Date,
  exerciseStart   : Date,
  exerciseEnd     : Date,
  currency        : String,
  modelType       : String,
  language        : String,
  dataVersion     : String,

  // Indique si on a pu récupérer un JSON XBRL structuré
  structured      : { type: Boolean, default: false },

  // Données comptables brutes (XBRL converti → objet)
  accountingData  : Schema.Types.Mixed,

  // Texte brut de l’analyse IA (pas de parsing ici)
  aiAnalysis      : { type: String },

}, { timestamps: true });

// Unicité sur (cbe, referenceNumber)
BilanFilingSchema.index({ cbe: 1, referenceNumber: 1 }, { unique: true });

export default mongoose.model('BilanFiling', BilanFilingSchema);
