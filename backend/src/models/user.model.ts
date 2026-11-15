import mongoose, { type Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_PERMISSIONS, UserRole } from '../lib/permissions';

export interface IUser {
  email: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  passwordHash?: string | null;
  oauthProvider?: 'google' | 'github' | null;
  oauthId?: string | null;
  emailVerified: boolean;
  emailVerifyToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpiry?: Date | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  timezone: string;
  jobTitle?: string | null;
  deletedAt?: Date | null;

  // Profile
  bio?: string | null;

  // Email verification state
  pendingEmail?: string | null;
  pendingEmailToken?: string | null;
  pendingEmailExpiresAt?: Date | null;

  // Notification preferences
  notificationPrefs: {
    email: {
      ticketConfirmation: boolean;
      eventReminders: boolean;
      ticketAssigned: boolean;
      assignmentRevoked: boolean;
      postEventFollowUp: boolean;
    };
    sms: {
      masterOptOut: boolean;
      eventDayReminders: boolean;
      checkInConfirmation: boolean;
    };
  };

  // Account deletion scheduling
  deletionScheduledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  id: string;
  userId: string;
  permissions: { action: string; level: string }[];
  comparePassword(candidate: string): Promise<boolean>;
}

interface UserJson {
  passwordHash?: string;
  emailVerifyToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  __v?: number;
  [key: string]: unknown;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    phone: { type: String },

    passwordHash: { type: String, select: false },
    oauthProvider: { type: String, enum: ['google', 'github'] },
    oauthId: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    role: { type: String, enum: Object.values(UserRole), default: UserRole.ORGANIZER },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    timezone: { type: String, default: 'UTC' },
    jobTitle: { type: String },
    deletedAt: { type: Date },

    // Profile
    bio: { type: String, maxlength: 300, default: null },

    // Email verification state
    pendingEmail: { type: String, default: null },
    pendingEmailToken: { type: String, select: false, default: null },
    pendingEmailExpiresAt: { type: Date, default: null },

    // Notification preferences
    notificationPrefs: {
      email: {
        ticketConfirmation: { type: Boolean, default: true },
        eventReminders: { type: Boolean, default: true },
        ticketAssigned: { type: Boolean, default: true },
        assignmentRevoked: { type: Boolean, default: true },
        postEventFollowUp: { type: Boolean, default: true },
      },
      sms: {
        masterOptOut: { type: Boolean, default: false },
        eventDayReminders: { type: Boolean, default: true },
        checkInConfirmation: { type: Boolean, default: true },
      },
    },

    // Account deletion scheduling
    deletionScheduledAt: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: IUserDocument, ret: Record<string, any>) => {
        ret.permissions = _doc.permissions;
        delete ret.passwordHash;
        delete ret.emailVerifyToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpiry;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

UserSchema.virtual('userId').get(function (this: IUserDocument) {
  return this._id?.toString();
});

UserSchema.virtual('permissions').get(function (this: IUserDocument) {
  const perms = ROLE_PERMISSIONS[this.role] || {};
  return Object.entries(perms).map(([action, level]) => ({
    action,
    level,
  }));
});

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ oauthProvider: 1, oauthId: 1 }, { unique: true, sparse: true });
UserSchema.index({ deletedAt: 1 }, { sparse: true });

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash as string);
};

UserSchema.pre('save', async function (this: IUserDocument) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash as string, 12);
});

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
