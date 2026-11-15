import mongoose from 'mongoose';
import { UserModel } from './src/models/user.model';
import { UserRole } from './src/lib/permissions';
import dotenv from 'dotenv';
import path from 'path';

// Force dev environment for test script
dotenv.config({ path: path.resolve(process.cwd(), '.env.dev') });

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to DB');

    const user = await UserModel.findOne({ role: UserRole.ADMIN });
    if (!user) {
      console.log('No admin user found to test with');
    } else {
      console.log('User found:', user.email);
      console.log('User JSON:', JSON.stringify(user.toJSON(), null, 2));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
