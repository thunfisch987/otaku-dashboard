<template>
	<div class="flex flex-wrap">
		<Toaster />
		<Dialog v-model:open="createProductDialogOpen">
			<DialogTrigger as-child>
				<Button>
					Create new Product
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Product</DialogTitle>
				</DialogHeader>
				<AutoForm
					:schema="insertProductSchema"
					@submit="(data) => submit(data)"
				>
					<Button type="submit">
						Create Product
					</Button>
				</AutoForm>
			</DialogContent>
		</Dialog>
		<div
			v-if="parsedAllProducts.data"
			class="flex-auto container py-10 mx-auto"
		>
			<ProductsDataTable
				:columns="columns"
				:data="parsedAllProducts.data"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { z } from 'zod';

import { insertProductSchema, productArraySchema, columns } from '~/components/products/columns';
import { useToast } from '~/components/ui/toast/use-toast';

const { data: allProducts, refresh: refreshProducts } = await useFetch('/api/products', {
	key: 'productFetching',
	lazy: true,
});

const createProductDialogOpen = useState<boolean>('createProductDialogState', () => false);

const { toast } = useToast();

const parsedAllProducts = computed(() => productArraySchema.safeParse(allProducts.value));

async function submit(formData: z.infer<typeof insertProductSchema>) {
	createProductDialogOpen.value = false;
	const { error, status } = await useFetch('/api/products', {
		method: 'post',
		body: formData,
	});
	if (status.value === 'error' && error.value && error.value.statusCode === 409) {
		toast({
			title: `Ein Produkt mit dem Namen "${formData.name}" existiert bereits schon!`,
			description: 'Bitte wähle einen anderen Namen.',
			variant: 'destructive',
		});
		return;
	}
	refreshProducts();
}
</script>
