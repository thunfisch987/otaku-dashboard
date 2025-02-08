import type { InsertProduct } from '../utils/drizzle';
import { tables, useDrizzle } from '../utils/drizzle';

export default defineTask({
	meta: {
		name: 'db:seed',
		description: 'Run database seed task',
	},
	async run() {
		console.log('Running DB seed task...');
		let mockProducts: InsertProduct[] = [
			{
				productname: 'VR Headset',
				price: 399.99,
				supplier: 'Otaku',
				amount: 15,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Laptop Cooling Pad',
				price: 39.99,
				supplier: 'HDJ',
				amount: 100,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Wireless Charger',
				price: 24.99,
				supplier: 'Otaku',
				amount: 150,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Smartphone Stand',
				price: 14.99,
				supplier: 'HDJ',
				amount: 200,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Bluetooth Speaker',
				price: 49.99,
				supplier: 'Otaku',
				amount: 80,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
		await useDrizzle().insert(tables.products).values(mockProducts);

		mockProducts = [
			{
				productname: 'Gaming Mouse',
				price: 29.99,
				supplier: 'HDJ',
				amount: 150,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Mechanical Keyboard',
				price: 89.99,
				supplier: 'Otaku',
				amount: 75,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Wireless Headphones',
				price: 49.99,
				supplier: 'HDJ',
				amount: 200,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: '4K Monitor',
				price: 299.99,
				supplier: 'Otaku',
				amount: 50,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Gaming Chair',
				price: 159.99,
				supplier: 'HDJ',
				amount: 30,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
		await useDrizzle().insert(tables.products).values(mockProducts);
		mockProducts = [
			{
				productname: 'RGB Gaming Mouse Pad',
				price: 19.99,
				supplier: 'Otaku',
				amount: 120,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'USB-C Hub',
				price: 39.99,
				supplier: 'HDJ',
				amount: 80,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Portable SSD',
				price: 99.99,
				supplier: 'Otaku',
				amount: 60,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Gaming Headset',
				price: 79.99,
				supplier: 'HDJ',
				amount: 90,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Webcam 1080p',
				price: 59.99,
				supplier: 'Otaku',
				amount: 40,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
		await useDrizzle().insert(tables.products).values(mockProducts);
		mockProducts = [
			{
				productname: 'Microphone',
				price: 89.99,
				supplier: 'HDJ',
				amount: 70,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Gaming Laptop Stand',
				price: 29.99,
				supplier: 'Otaku',
				amount: 110,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'HDMI Cable',
				price: 9.99,
				supplier: 'HDJ',
				amount: 300,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Graphics Card',
				price: 499.99,
				supplier: 'Otaku',
				amount: 20,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				productname: 'Gaming Desk',
				price: 199.99,
				supplier: 'HDJ',
				amount: 25,
				picture: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];
		await useDrizzle().insert(tables.products).values(mockProducts);
		return { result: 'success' };
	},
});
