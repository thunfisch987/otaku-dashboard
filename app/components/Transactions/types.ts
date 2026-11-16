export type SaleItem = {
	productName: string;
	unitPrice: number;
	quantity: number;
	lineTotal: number;
};

export type SaleWithItems = {
	_id: string;
	_creationTime: number;
	timestamp: number;
	operatorName: string;
	total: number;
	isHelper?: boolean;
	items: SaleItem[];
};
