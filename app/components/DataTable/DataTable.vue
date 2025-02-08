<template>
	<div class="w-full space-y-4 pb-4 flex flex-col">
		<template v-if="table && table?.tableApi !== undefined">
			<DataTableToolbar :table="table?.tableApi!" />
		</template>
		<UTable
			ref="table"
			v-model:pagination="pagination"
			v-model:column-visibility="columnVisibility"
			:data="parsedAllProducts.data"
			:columns="columns"
			:loading="status === 'pending'"
			:pagination-options="{
				getPaginationRowModel: getPaginationRowModel(),
			}"
			class="flex-1"
		/>
		<template v-if="table && table?.tableApi !== undefined">
			<LazyDataTableSelectedCount :table="table?.tableApi!" />
			<LazyDataTablePagination :table="table?.tableApi!" />
			<LazyDataTableEditProductModal :table="table?.tableApi!" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { productArraySchema } from '~/components/DataTable/types';
import { getPaginationRowModel } from '@tanstack/vue-table';
import { columns } from './columns';

// table stuff
const table = useTemplateRef('table');
const pagination = ref({
	pageIndex: 0,
	pageSize: 5,
});
const columnVisibility = ref({
	id: false,
});

// -------------------fetch Products and parse them with zod-------------------
const { data: allProducts, status } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});
const parsedAllProducts = computed(() =>
	productArraySchema.safeParse(allProducts.value),
);
</script>
