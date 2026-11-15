import { createApp } from '../src/app';
import { connectDB } from '../src/lib/db';

let cachedApp: any = null;

const handler = async (req: any, res: any) => {
  await connectDB();

  if (!cachedApp) {
    cachedApp = await createApp();
  }

  // In Express 5, the app is a function that can be passed to another handler
  return (cachedApp as any)(req, res);
};

export default handler;
