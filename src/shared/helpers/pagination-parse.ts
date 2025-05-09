import { PrismaClient } from '@prisma/client';
import BadRequest from 'server/responses/client-errors/bad-request';

export interface ExpressPaginationParams {
	searchFields?: string; // field1:value1,field2:value2
	orderBy?: string; // field:asc|desc,field2:asc|desc
	filterBy?: string; // field1:value1,field2:value2
	page?: string;
	pageSize?: string;
}

export type PrismaModel = keyof PrismaClient;
export type PrismaModelFields<T extends PrismaModel> = keyof PrismaClient[T];
export type PrismaWhereInput<T extends PrismaModel> = PrismaClient[T] extends {
	findMany: (args: infer Args) => any;
}
	? Args extends { where?: infer W }
	? W
	: never
	: never;
export type PrismaOrderByInput<T extends PrismaModel> = PrismaClient[T] extends {
	findMany: (args: infer Args) => any;
}
	? Args extends { orderBy?: infer O }
	? O
	: never
	: never;

export interface PrismaPaginationOptions<T extends PrismaModel> {
	skip?: number;
	take?: number;
	where?: PrismaWhereInput<T>;
	orderBy?: PrismaOrderByInput<T>;
}

export const transformExpressParamsForPrisma = <T extends PrismaModel>(
	modelName: T,
	query: ExpressPaginationParams,
	prisma: PrismaClient
): PrismaPaginationOptions<T> => {
	const prismaOptions: PrismaPaginationOptions<T> = {};
	const model = prisma[modelName];

	if (!model) {
		throw new Error(`Model '${String(modelName)}' not found in PrismaClient.`);
	}

	const modelFields = Object.keys((model as any).fields) as Array<PrismaModelFields<T>>;

	// Handle pagination
	const page = parseInt(query.page || '1', 10);
	const pageSize = parseInt(query.pageSize || '10', 10);
	prismaOptions.skip = (page - 1) * pageSize;
	prismaOptions.take = pageSize;

	// Handle searchFields
	if (query.searchFields) {
		prismaOptions.where = (prismaOptions.where || {}) as PrismaWhereInput<T>;
		query.searchFields.split(',').forEach((pair) => {
			const [field, value] = pair.trim().split(':');
			if (field && value) {
				if (!modelFields.includes(field as PrismaModelFields<T>)) {
					throw new BadRequest("invalid_query", `Check searchFields again.`, "Invalid query.");
				}
				(prismaOptions.where as any)[field] = {
					contains: value,
					mode: 'insensitive'
				};
			}
		});
	}

	// Handle filterBy
	if (query.filterBy) {
		prismaOptions.where = (prismaOptions.where || {}) as PrismaWhereInput<T>;
		query.filterBy.split(',').forEach((pair) => {
			const [field, value] = pair.trim().split(':');
			if (field && value) {
				if (!modelFields.includes(field as PrismaModelFields<T>)) {
					throw new BadRequest("invalid_query", `Check filterBy again.`, "Invalid query.");
				}
				(prismaOptions.where as any)[field] =
					value === 'true'
						? true
						: value === 'false'
							? false
							: /^\d+$/.test(value)
								? parseInt(value, 10)
								: value;
			}
		});
	}

	// Handle orderBy
	if (query.orderBy) {
		prismaOptions.orderBy = [] as PrismaOrderByInput<T>;
		query.orderBy.split(',').forEach((order) => {
			const [field, direction] = order.trim().split(':');
			if (field && direction) {
				if (!modelFields.includes(field as PrismaModelFields<T>)) {
					throw new BadRequest("invalid_query", `Check orderBy again.`, "Invalid query.");
				}
				if (!['asc', 'desc'].includes(direction.toLowerCase())) {
					throw new BadRequest("invalid_query", `Check orderBy sort order again.`, "Invalid query.");
				}
				(prismaOptions.orderBy as any).push({
					[field]: direction.toLowerCase(),
				});
			}
		});
	}

	return prismaOptions;
};

export const transformExpressParamsForPrismaWithTimeRangeBase = <T extends PrismaModel>(
	modelName: T,
	query: ExpressPaginationParams,
	prisma: PrismaClient
): PrismaPaginationOptions<T> => {
	const prismaOptions: PrismaPaginationOptions<T> = {};
	const model = prisma[modelName];

	if (!model) {
		throw new Error(`Model '${String(modelName)}' not found in PrismaClient.`);
	}

	const modelFields = Object.keys((model as any).fields) as Array<PrismaModelFields<T>>;

	// Handle pagination
	const page = parseInt(query.page || '1', 10);
	const pageSize = parseInt(query.pageSize || '10', 10);
	prismaOptions.skip = (page - 1) * pageSize;
	prismaOptions.take = pageSize;

	// Handle searchFields
	if (query.searchFields) {
		prismaOptions.where = (prismaOptions.where || {}) as PrismaWhereInput<T>;
		query.searchFields.split(',').forEach((pair) => {
			const [field, value] = pair.trim().split(':');
			if (field && value) {
				if (!modelFields.includes(field as PrismaModelFields<T>)) {
					throw new BadRequest("invalid_query", `Check searchFields again.`, "Invalid query.");
				}
				(prismaOptions.where as any)[field] = {
					contains: value,
					mode: 'insensitive'
				};
			}
		});
	}

	// Handle filterBy
	if (query.filterBy) {
		prismaOptions.where = (prismaOptions.where || {}) as PrismaWhereInput<T>;
		query.filterBy.split(',').forEach((pair) => {
			const [field, value] = pair.trim().split(':');
			const dateMatch = value?.match(/\[(.*?)\]/g);

			if (field && dateMatch && dateMatch.length > 0) {
				// Handle date range filter
				const [start, end] = dateMatch.map(match => match.slice(1, -1));
				const dateFilter: any = {};

				console.log("start", start);
				console.log("end", end);

				if (start) {
					try {
						const startDate = new Date(Number(start));
						if (isNaN(startDate.getTime())) {
							throw new BadRequest("invalid_query", `Invalid start date format in ${field} filter`, "Invalid query.");
						}
						dateFilter.gte = startDate;
					} catch (error) {
						throw new BadRequest("invalid_query", `Invalid start date format in ${field} filter`, "Invalid query.");
					}
				}

				if (end) {
					try {
						const endDate = new Date(Number(end));
						if (isNaN(endDate.getTime())) {
							throw new BadRequest("invalid_query", `Invalid end date format in ${field} filter`, "Invalid query.");
						}
						dateFilter.lte = endDate;
					} catch (error) {
						throw new BadRequest("invalid_query", `Invalid end date format in ${field} filter`, "Invalid query.");
					}
				}
				if (Object.keys(dateFilter).length > 0) {
					(prismaOptions.where as any)[field] = dateFilter;
				}
			} else if (field && value) {
				// Handle other filters
				if (!modelFields.includes(field as PrismaModelFields<T>)) {
					throw new BadRequest("invalid_query", `Check filterBy again.`, "Invalid query.");
				}
				(prismaOptions.where as any)[field] =
					value === 'true'
						? true
						: value === 'false'
							? false
							: /^\d+$/.test(value)
								? parseInt(value, 10)
								: value;
			}
		});
	}

	// Handle orderBy
	if (query.orderBy) {
		prismaOptions.orderBy = [] as PrismaOrderByInput<T>;
		query.orderBy.split(',').forEach((order) => {
			const [field, direction] = order.trim().split(':');
			if (field && direction) {
				if (!modelFields.includes(field as PrismaModelFields<T>)) {
					throw new BadRequest("invalid_query", `Check orderBy again.`, "Invalid query.");
				}
				if (!['asc', 'desc'].includes(direction.toLowerCase())) {
					throw new BadRequest("invalid_query", `Check orderBy sort order again.`, "Invalid query.");
				}
				(prismaOptions.orderBy as any).push({
					[field]: direction.toLowerCase(),
				});
			}
		});
	}

	return prismaOptions;
};