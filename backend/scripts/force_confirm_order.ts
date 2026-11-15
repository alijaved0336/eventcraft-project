import mongoose from 'mongoose';
import { OrderService } from '../src/services/order.service';
import { OrderModel } from '../src/models/order.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev') });

async function confirm() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not found in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const orderId = '69c67ba3f6704e2660628077';
  const order = await OrderModel.findById(orderId);
  
  if (!order) {
    console.error(`Order ${orderId} not found`);
    process.exit(1);
  }

  if (order.status === 'confirmed') {
    console.log('Order is already confirmed');
    process.exit(0);
  }

  console.log(`Manually confirming order: ${orderId} (Status: ${order.status})`);
  
  const orderService = new OrderService();
  const updatedOrder = await orderService.confirmOrder(orderId);

  console.log(`Order status updated to: ${updatedOrder?.status}`);
  console.log('Tickets should have been generated.');

  await mongoose.disconnect();
}

confirm().catch(err => {
  console.error('Confirmation failed:', err);
  process.exit(1);
});
