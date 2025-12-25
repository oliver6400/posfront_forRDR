// src/router/routes.ts
// Centralización de rutas de la aplicación

export const ROUTES = {
	// Autenticación
	LOGIN: '/login',
	FORGOT_PASSWORD: '/forgot-password',
	RESET_PASSWORD: '/reset-password/:token',
  
	// Dashboard
	DASHBOARD: '/dashboard',
  






	// 🚧 [BACKEND ALGUNOS PENDIENTE] 
    MENU: '/menu',

	SALES: '/sales',
	NEW_SALE: '/sales/new',
	SALE_DETAILS: '/sales/:id',
  
	PRODUCTS: '/products',
	NEW_PRODUCT: '/products/new',
	PRODUCT_DETAILS: '/products/:id',
  
	ADMIN: '/admin',
	USER_MANAGEMENT: '/admin/users',
	REPORTS: '/admin/reports',
} as const;
