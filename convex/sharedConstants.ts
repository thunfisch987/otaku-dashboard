// Constants shared between the Convex backend and the client pages so the UI
// always reflects what the backend actually enforces.
// Submission bounds used by convex/preorders.ts and the public preorder page.
export const MAX_QUANTITY_PER_LINE = 20;
export const MAX_ORDER_LINES = 100;
export const MAX_TOTAL_QUANTITY = 300;

// The documented default for the shared Onigiri regular price when an
// operator leaves the field empty (AGENTS.md: "defaults to €3").
export const ONIGIRI_DEFAULT_PRICE = 3;
