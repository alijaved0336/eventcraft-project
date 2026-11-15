import mongoose from 'mongoose';
import { RefreshTokenModel } from '../src/models/refresh-token.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

const tokens = [
  '64cd0e0eb089fdad5cd3727f16a8f81bf1130a700070a67fb3b81f08dc104bd8678f36d272863d2d12365c41cab15e6c297fd5faa2cccd412fc7cb57f66c618e',
  '47066e054eac552d199242d920db8d833bd029f154e2f90af1afce101af10fa6caa5c90b3421582eded9701086ce40038840644d9a674581fc6c707d768eff89'
];

async function check() {
  await mongoose.connect(process.env.MONGO_URI!);
  
  for (const token of tokens) {
    const t = await RefreshTokenModel.findOne({ token });
    if (t) {
      console.log(`Token ${token.substring(0, 10)}...: Status=${t.isRevoked ? 'REVOKED' : 'ACTIVE'}, Family=${t.family}`);
    } else {
      console.log(`Token ${token.substring(0, 10)}...: NOT FOUND`);
    }
  }
  
  await mongoose.disconnect();
}

check();
