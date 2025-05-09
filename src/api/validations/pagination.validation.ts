import { NumberUtils } from 'server/shared/utils/number';
import { z } from 'zod';

export class PaginationValidation {

	public static paginationQuery = z.object({
		page: NumberUtils.validateNumber("page", true).innerType().optional().default("1"),
		pageSize: NumberUtils.validateNumber("limit", true).innerType().optional().default("10"),
		search: z.string().max(200, {
			message: 'Search query too long'
		}).optional(),
		/**
		 *  Search fields with format: `field1:value1,field2:value2`.
		 *  Example: `name:john,email:john@example.com`
		 */
		searchFields: z
			.string()
			.optional()
			.refine((search) => {
				if (!search) return true; // Allow optional

				return search.split(',').every((pair) => {
					const [field, value] = pair.split(':');
					return /^\w+$/.test(field) && /^\w+$/.test(value);
				});
			}, {
				message:
					'Invalid search fields format. Expected format: field1:value1,field2:value2 (alphanumeric characters only)',
			})
			.innerType(),
		/**
		 * Order by fields with format: `field:asc|desc,field2:asc|desc`.
		 * Example: `created_at:desc,name:asc`
		 */
		orderBy: z
			.string()
			.optional()
			.refine((orders) => {
				if (!orders) return true; // Allow optional

				return orders.split(',').every((order) => {
					const [field, direction] = order.split(':');
					return /^[a-zA-Z0-9_]+$/.test(field) && ['asc', 'desc'].includes(direction?.toLowerCase() || '');
				});
			}, {
				message:
					'Invalid order value provided. Expected format: field:asc|desc,field2:asc|desc (alphanumeric and underscore for field)',
			})
			.innerType(),
		/**
		 * Filter by fields with format: `field1:value1,field2:value2`.
		 * Example: `status:1,is_active:true`
		 */
		filterBy: z
			.string()
			.optional()
			.refine((filters) => {
				if (!filters) return true; // Allow optional

				return filters.split(',').every((pair) => {
					const [field, value] = pair.split(':');
					return /^\w+$/.test(field) && /^\w+$/.test(value);
				});
			}, {
				message:
					'Invalid filter fields format. Expected format: field1:value1,field2:value2 (alphanumeric characters only)',
			})
			.innerType(),
	});
}

export type PaginationQuery = z.infer<typeof PaginationValidation.paginationQuery>;