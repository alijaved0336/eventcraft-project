import { UserModel, type IUserDocument } from '../models/user.model';

export class UserRepository {
  static async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ _id: id, deletedAt: null }).lean() as Promise<IUserDocument | null>;
  }

  static async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    }).lean() as Promise<IUserDocument | null>;
  }

  static async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase(), deletedAt: null })
      .select('+passwordHash')
      .lean() as Promise<IUserDocument | null>;
  }

  static async findByOAuth(
    provider: 'google' | 'github',
    oauthId: string,
  ): Promise<IUserDocument | null> {
    return UserModel.findOne({
      oauthProvider: provider,
      oauthId,
      deletedAt: null,
    }).lean() as Promise<IUserDocument | null>;
  }

  static async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    return UserModel.create(data) as Promise<IUserDocument>;
  }

  static async updateById(
    id: string,
    update: Partial<IUserDocument>,
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, update, { new: true }) as Promise<IUserDocument | null>;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  static async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({
      email: email.toLowerCase(),
      deletedAt: null,
    });
    return count > 0;
  }

  static async softDelete(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { deletedAt: new Date() });
  }
}
