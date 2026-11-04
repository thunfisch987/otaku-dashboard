import { createApi } from '@convex-dev/better-auth';
import schema from './schema';
import { createAuthOptions } from '../auth';

export const {
	create,
	consumeOne,
	findOne,
	findMany,
	incrementOne,
	updateOne,
	updateMany,
	deleteOne,
	deleteMany,
} = createApi(schema, createAuthOptions);
