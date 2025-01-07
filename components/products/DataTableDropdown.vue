<script setup lang="ts">
import { MoreHorizontal, Trash2 } from 'lucide-vue-next';
import type { ProductSchema } from './columns';

const props = defineProps<{
	product: ProductSchema;
}>();

function copy(price: string) {
	navigator.clipboard.writeText(price);
}

function handleDelete() {
	useFetch(`/api/products/${props.product.id}`, {
		method: 'delete',
	});
	refreshNuxtData('productFetching');
}
</script>

<template>
	<DropdownMenu>
		<AlertDialog>
			<DropdownMenuTrigger as-child>
				<Button
					variant="ghost"
					class="w-8 h-8 p-0"
				>
					<span class="sr-only">Open menu</span>
					<MoreHorizontal class="w-4 h-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuItem @click="copy(String(product.price))">
					Copy product ID
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>View product</DropdownMenuItem>
				<DropdownMenuItem>View product details</DropdownMenuItem>
				<DropdownMenuItem>
					<AlertDialogTrigger class="flex items-center gap-2">
						Delete Product <Trash2 class="w-4 h-4" />
					</AlertDialogTrigger>
				</DropdownMenuItem>
			</DropdownMenuContent>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure you want to delete this product?</AlertDialogTitle>
					<AlertDialogDescription>
						This will delete {{ product.name }}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel> Cancel </AlertDialogCancel>
					<AlertDialogAction @click="handleDelete">
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</DropdownMenu>
</template>
