import mongoose, { type Document, Schema } from 'mongoose';

export interface IDataExport {
  userId: mongoose.Types.ObjectId;
  data: string;          // full JSON string
  status: 'queued' | 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
  downloadedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface IDataExportDocument extends IDataExport, Document {}

const DataExportSchema = new Schema<IDataExportDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    data: { type: String, required: true },
    status: { type: String, enum: ['queued', 'processing', 'ready', 'expired'], default: 'ready' },
    downloadUrl: { type: String },
    downloadedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index to automatically delete expired exports
DataExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
DataExportSchema.index({ userId: 1 });

export const DataExportModel = mongoose.model<IDataExportDocument>(
  'DataExport',
  DataExportSchema
);
