// src/services/api/sales.api.ts
// API de ventas conectada con Django backend

import apiClient from './client';
import type { 
  Venta,
  VentaConDetalles,
  CrearVentaPayload,
  FiltroVentas,
  PaginatedResponse,
  FacturaSimulada,
  MetodoPago,
  EstadoVenta,
  Cliente,
  Sucursal,
  ArqueoCaja,
} from '../../types/backend.types';

// 💰 VENTAS

// Listar ventas con filtros
export async function getSales(filters: FiltroVentas = {}): Promise<PaginatedResponse<VentaConDetalles>> {
  try {
    const params = new URLSearchParams();
    
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.sucursal) params.append('sucursal', filters.sucursal.toString());
    if (filters.estado) params.append('estado_venta', filters.estado.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('page_size', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<VentaConDetalles>>(
      `/ventas/ventas/?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener ventas');
  }
}

// Obtener venta por ID
export async function getSaleById(id: number): Promise<VentaConDetalles> {
  try {
    const response = await apiClient.get<VentaConDetalles>(`/ventas/ventas/${id}/`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener venta');
  }
}

export async function getPuntoVentaSucursal(sucursalId: number): Promise<number[]> {
  try {
    const response = await apiClient.get(`/negocio/sucursales/${sucursalId}/puntos-venta/`);
    const puntosVenta = response.data as { id: number }[];
    return puntosVenta.map(pv => pv.id);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener puntos de venta');
  }
}

export async function abrirCaja(punto_venta: number, monto_inicial: number): Promise<ArqueoCaja> {
  const response = await apiClient.post("/reportes/arqueocaja/abrir/", {
    punto_venta,
    monto_inicial,
  });
  return response.data;
}

export async function cerrarCaja(arqueo_id: number, monto_final_real: number, monto_final_sistema: number): Promise<ArqueoCaja> {
  const response = await apiClient.post("/reportes/arqueocaja/${id}/cerrar/", {
    arqueo_id,
    monto_final_real,
    monto_final_sistema,
  });
  return response.data;
}

export async function estadoCaja(punto_venta: number): Promise<ArqueoCaja | null> {
  const response = await apiClient.get(`/reportes/arqueocaja/abierta/?punto_venta=${punto_venta}`);
  return response.data;
}

// Crear nueva venta
export async function createSale(saleData: CrearVentaPayload): Promise<VentaConDetalles> {
  try {
    const ventaPayload: any = {
      sucursal: saleData.sucursal,
      punto_venta: saleData.punto_venta,
      cliente: saleData.cliente || null,
      estado_venta: saleData.estado_venta,
      total_descuento: saleData.total_descuento || 0,
      detalles: saleData.detalles.map(detalle => ({
        producto: detalle.producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento || 0
      })),
    };

    // 👇 Solo añadir "pagos" si existen
    if (saleData.pagos && saleData.pagos.length > 0) {
      ventaPayload.pagos = saleData.pagos.map(pago => ({
        metodo_pago: pago.metodo_pago,
        monto: pago.monto,
        referencia: pago.referencia || ''
      }));
    }

    console.log('Datos enviados al backend:', JSON.stringify(ventaPayload, null, 2));

    const response = await apiClient.post<VentaConDetalles>('/ventas/ventas/', ventaPayload);

    // 👇 Solo crear pagos extra si quieres manejarlos fuera del payload
    if (saleData.pagos && saleData.pagos.length > 0) {
      for (const pago of saleData.pagos) {
        await createPayment(response.data.id, pago);
      }
    }

    return response.data;
  } catch (error: any) {
    console.error('Error completo:', error);
    console.error('Error en createPayment:', error.response?.status, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Error al crear venta');
  }
}

// Anular venta
export async function cancelSale(id: number): Promise<{ message: string }> {
  try {
    // Cambiar estado de la venta a cancelada
    // Primero obtener el ID del estado "cancelada"
    const estadosResponse = await getVentaStates();
    const estadoCancelada = estadosResponse.find(estado => 
      estado.nombre.toLowerCase().includes('cancel')
    );

    if (!estadoCancelada) {
      throw new Error('Estado de venta cancelada no encontrado');
    }

    const response = await apiClient.patch(`/ventas/ventas/${id}/`, {
      estado_venta: estadoCancelada.id
    });

    return { message: 'Venta cancelada exitosamente' };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al cancelar venta');
  }
}

// Crear pago para una venta
export async function createPayment(ventaId: number, pagoData: {
  metodo_pago: number;
  monto: number;
  referencia?: string;
}) {
  try {
    const response = await apiClient.post('/ventas/pagos/', {
      venta_id: ventaId,
      metodo_pago_id: pagoData.metodo_pago,
      monto: pagoData.monto,
      referencia: pagoData.referencia || ''
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al registrar pago');
  }
}

// 📄 FACTURACIÓN

// Generar factura simulada
export async function generateInvoice(ventaId: number, facturaData: {
  nit_ci: string;
  razon_social: string;
}): Promise<FacturaSimulada> {
  try {
    const response = await apiClient.post<FacturaSimulada>('/ventas/facturas/generar/', facturaData);

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al generar factura');
  }
}

// Obtener facturas por venta
export async function getInvoicesBySale(ventaId: number): Promise<FacturaSimulada[]> {
  try {
    const response = await apiClient.get<FacturaSimulada[]>(`/ventas/facturas/?venta=${ventaId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener facturas');
  }
}

// 🏗️ CONFIGURACIÓN Y DATOS MAESTROS

// Obtener métodos de pago
export async function getPaymentMethods(): Promise<MetodoPago[]> {
  try {
    const response = await apiClient.get<PaginatedResponse<MetodoPago> | MetodoPago[]>('/ventas/metodos-pago/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results ?? [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener métodos de pago');
  }
}

// Obtener estados de venta
export async function getVentaStates(): Promise<EstadoVenta[]> {
  try {
    const response = await apiClient.get<PaginatedResponse<EstadoVenta> | EstadoVenta[]>('/negocio/estados-venta/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results ?? [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener estados de venta');
  }
}

// Obtener sucursales
export async function getSucursales(): Promise<Sucursal[]> {
  try {
    const response = await apiClient.get<PaginatedResponse<Sucursal> | Sucursal[]>('/negocio/sucursales/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results ?? [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener sucursales');
  }
}

// 🏢 CLIENTES

// Listar clientes
export async function getClients(filters: {
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PaginatedResponse<Cliente>> {
  try {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('page_size', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<Cliente>>(
      `/negocio/clientes/?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener clientes');
  }
}

// Buscar cliente por NIT
export async function searchClientByNit(nit: string): Promise<Cliente | null> {
  try {
    const response = await apiClient.get<PaginatedResponse<Cliente>>(
      `/negocio/clientes/?search=${nit}`
    );
    
    // Manejar si no hay resultados o estructura diferente
    const results = response.data.results || response.data;
    if (!Array.isArray(results)) {
      return null;
    }
    
    // Buscar cliente que coincida exactamente con el NIT
    const cliente = results.find(c => c.nit === nit);
    return cliente || null;
  } catch (error: any) {
    console.error('Error en searchClientByNit:', error);
    throw new Error(error.response?.data?.message || error.message || 'Error al buscar cliente');
  }
}

// Crear cliente
export async function createClient(clientData: {
  nit: string;
  nombre: string;
  razon_social: string;
  email: string;
}): Promise<Cliente> {
  try {
    const response = await apiClient.post<Cliente>('/negocio/clientes/', clientData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.nit?.[0] ||
                        error.response?.data?.email?.[0] ||
                        error.response?.data?.razon_social?.[0] ||
                        'Error al crear cliente';
    throw new Error(errorMessage);
  }
}

// Actualizar cliente
export async function updateClient(id: number, clientData: Partial<Cliente>): Promise<Cliente> {
  try {
    const response = await apiClient.put<Cliente>(`/negocio/clientes/${id}/`, clientData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.nit?.[0] ||
                        error.response?.data?.email?.[0] ||
                        error.response?.data?.razon_social?.[0] ||
                        'Error al actualizar cliente';
    throw new Error(errorMessage);
  }
}

// 📊 REPORTES Y ANÁLISIS

// Resumen de ventas por período
export async function getSalesSummary(filters: {
  fecha_desde?: string;
  fecha_hasta?: string;
  sucursal?: number;
}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.sucursal) params.append('sucursal', filters.sucursal.toString());

    const response = await apiClient.get(`/reports/sales-summary/?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener resumen de ventas');
  }
}

// Productos más vendidos
export async function getTopProducts(filters: {
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/reports/top-products/?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al obtener productos más vendidos');
  }
}

export async function searchProducts(query: string, limit: number = 10) {
  try {
    const params = new URLSearchParams({
      search: query,
      page_size: limit.toString()
    });

    const response = await apiClient.get(
      `/inventario/productos/?${params.toString()}`
    );

    // Modificación: verificar si la respuesta tiene el formato paginado
    if (response.data.results) {
      return response.data.results;
    }
    
    // Si no es paginado, retornar los datos directamente
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error('Error en searchProducts:', error);
    throw new Error(error.response?.data?.message || 'Error al buscar productos');
  }
}


export async function deleteClient(id: number): Promise<{ message: string }> {
  try {
    await apiClient.delete(`/negocio/clientes/${id}/`);
    return { message: 'Cliente eliminado exitosamente' };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al eliminar cliente');
  }
}

