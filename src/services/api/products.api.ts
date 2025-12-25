// src/services/api/products.api.ts
// API de productos conectada con Django backend

import apiClient from './client';
import type { 
  Producto, 
  ProductoConStock, 
  CrearProductoPayload,
  FiltroProductos,
  PaginatedResponse,
  InventarioSucursal,
  ActualizarStockPayload
} from '../../types/backend.types';

// 📦 PRODUCTOS

// Listar productos con paginación
// Listar productos
export async function getProducts(filters: FiltroProductos = {}): Promise<Producto[]> {
  try {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.activo !== undefined) params.append('activo', filters.activo.toString());

    const response = await apiClient.get<Producto[]>(
      `/inventario/productos/?${params.toString()}`
    );

    return response.data; // 👈 ahora es un array simple
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener productos');
  }
}

// Obtener producto por ID
export async function getProductById(id: number): Promise<ProductoConStock> {
  try {
    const response = await apiClient.get<ProductoConStock>(`/inventario/productos/${id}/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener producto');
  }
}

// Crear producto
export async function createProduct(productData: CrearProductoPayload): Promise<Producto> {
  try {
    const response = await apiClient.post<Producto>('/inventario/productos/', productData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.codigo_barras?.[0] ||
                        error.response?.data?.nombre?.[0] ||
                        'Error al crear producto';
    throw new Error(errorMessage);
  }
}

// Actualizar producto
export async function updateProduct(id: number, productData: Partial<Producto>): Promise<Producto> {
  try {
    const response = await apiClient.put<Producto>(`/inventario/productos/${id}/`, productData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.codigo_barras?.[0] ||
                        error.response?.data?.nombre?.[0] ||
                        'Error al actualizar producto';
    throw new Error(errorMessage);
  }
}

// Eliminar producto (definitivamente)
export async function deleteProduct(id: number) {
  try {
    await apiClient.delete(`/inventario/productos/${id}/`);
    return { message: 'Producto eliminado definitivamente' };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al eliminar producto');
  }
}

// Buscar productos (para autocompletado en ventas)
export async function searchProducts(query: string, limit: number = 10): Promise<ProductoConStock[]> {
  try {
    const params = new URLSearchParams({
      search: query,
      page_size: limit.toString()
    });

    const response = await apiClient.get<PaginatedResponse<ProductoConStock>>(
      `/inventario/productos/?${params.toString()}`
    );

    return response.data.results;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al buscar productos');
  }
}

// 🏪 INVENTARIO

// Obtener stock por sucursal
export async function getStockBySucursal(sucursalId: number): Promise<InventarioSucursal[]> {
  try {
    const response = await apiClient.get<any[]>(
      `/inventario/inventarios/?sucursal=${sucursalId}`
    );

    return response.data.map(item => ({
      ...item,
      stock_actual: parseFloat(item.stock_actual),
      stock_minimo: parseFloat(item.stock_minimo)
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener inventario');
  }
}

// Actualizar stock
export async function updateStock(
  sucursalId: number,
  productoId: number,
  stockData: ActualizarStockPayload
): Promise<InventarioSucursal> {
  // Buscar inventario existente
  const inventarioResponse = await apiClient.get<InventarioSucursal[]>(
    `/inventario/inventarios/?sucursal=${sucursalId}&producto=${productoId}`
  );

  const payload = {
    sucursal: sucursalId,
    producto: productoId, // 👈 solo el id
    stock_actual: Number(stockData.stock_actual), // 👈 aseguramos número
    stock_minimo: Number(stockData.stock_minimo), // 👈 aseguramos número
  };

  if (inventarioResponse.data.length === 0) {
    // Crear inventario
    const response = await apiClient.post<InventarioSucursal>(
      '/inventario/inventarios/',
      payload
    );
    return response.data;
  } else {
    // Actualizar inventario existente
    const inventario = inventarioResponse.data[0];
    const response = await apiClient.put<InventarioSucursal>(
      `/inventario/inventarios/${inventario.id}/`,
      payload
    );
    return response.data;
  }
}

// Obtener productos con stock bajo
export async function getLowStockProducts(sucursalId?: number): Promise<ProductoConStock[]> {
  try {
    const params = new URLSearchParams();
    if (sucursalId) params.append('sucursal', sucursalId.toString());

    // Obtener el inventario desde la API
    const response = await apiClient.get<PaginatedResponse<InventarioSucursal>>(
      `/inventario/inventarios/?${params.toString()}`
    );

    // Verifica la respuesta
    console.log("Respuesta de inventario:", response.data);

    // Asegúrate de que la respuesta siempre sea un array
    const lowStockInventory = Array.isArray(response.data.results) ? response.data.results.filter(
      (item) => item.stock_actual <= item.stock_minimo
    ) : [];

    if (lowStockInventory.length === 0) {
      return [];  // Devuelve una lista vacía si no hay productos con stock bajo
    }

    const productPromises = lowStockInventory.map(async (item) => {
      const productResponse = await apiClient.get<Producto>(`/inventario/productos/${item.producto}/`);
      return {
        ...productResponse.data,
        stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo
      } as ProductoConStock;
    });

    return Promise.all(productPromises);
  } catch (error: any) {
    console.error("Error al obtener productos con stock bajo:", error);
    throw new Error(error.response?.data?.message || 'Error al obtener productos con stock bajo');
  }
}

// 📊 MOVIMIENTOS DE INVENTARIO

// Obtener movimientos de inventario
export async function getInventoryMovements(filters: {
  sucursal?: number;
  producto?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_movimiento?: 'Entrada' | 'Salida';
  page?: number;
  limit?: number;
} = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.sucursal) params.append('sucursal', filters.sucursal.toString());
    if (filters.producto) params.append('producto', filters.producto.toString());
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.tipo_movimiento) params.append('tipo_movimiento', filters.tipo_movimiento);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('page_size', filters.limit.toString());

    const response = await apiClient.get(`/inventario/movimientos/?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener movimientos de inventario');
  }
}


