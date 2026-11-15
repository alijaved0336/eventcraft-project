import mongoose from 'mongoose';
import { UserModel } from './src/models/user.model';

async function test() {
  const invalidId = '69c8688f092mc5e08729b34ba';
  try {
    console.log('Testing invalid ID:', invalidId);
    await UserModel.findById(invalidId);
  } catch (error) {
    console.error('Caught error:', error);
  }
}

test();
