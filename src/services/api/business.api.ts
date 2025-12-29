// src/services/api/business.api.ts
// API de negocio conectada con Django backend

import apiClient from './client';
import type { 
  Cliente,
  Sucursal,
  Ciudad,
  PuntoVenta,
  EstadoVenta,
  CrearClientePayload
} from '../../types/backend.types';

function normalizeApiResponse<T>(data: any): T[] {
    return Array.isArray(data) ? data : (data.results || []);
}
// 🏢 CLIENTES

// Listar clientes
export async function getClients(filters: {
    search?: string;
    page?: number;
    limit?: number;
} = {}): Promise<Cliente[]> {
    try {
        const params = new URLSearchParams();
        
        if (filters.search) params.append('search', filters.search);
        // Si el backend usa paginación, 'page' y 'page_size' son los parámetros correctos.
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('page_size', filters.limit.toString());

        const response = await apiClient.get(
            `/negocio/clientes/?${params.toString()}`
        );

        return normalizeApiResponse<Cliente>(response.data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener clientes');
    }
}

// Obtener cliente por ID
export async function getClientById(id: number): Promise<Cliente> {
    try {
        const response = await apiClient.get<Cliente>(`/negocio/clientes/${id}/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener cliente');
    }
}

// Buscar cliente por NIT
export async function searchClientByNit(nit: string): Promise<Cliente | null> {
    try {
        const response = await apiClient.get(
            `/negocio/clientes/?search=${nit}`
        );
        
        const clientes = normalizeApiResponse<Cliente>(response.data);
        // Buscar cliente que coincida exactamente con el NIT
        const cliente = clientes.find(c => c.nit === nit);
        return cliente || null;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al buscar cliente');
    }
}

// Crear cliente
export async function createClient(clientData: CrearClientePayload): Promise<Cliente> {
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

// Eliminar cliente
export async function deleteClient(id: number): Promise<{ message: string }> {
    try {
        await apiClient.delete(`/negocio/clientes/${id}/`);
        return { message: 'Cliente eliminado exitosamente' };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al eliminar cliente');
    }
}

// 🏪 SUCURSALES

// Listar sucursales
export async function getSucursales(): Promise<Sucursal[]> {
    try {
        const response = await apiClient.get('/negocio/sucursales/');
        return normalizeApiResponse<Sucursal>(response.data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener sucursales');
    }
}

// Obtener sucursal por ID
export async function getSucursalById(id: number): Promise<Sucursal> {
    try {
        const response = await apiClient.get<Sucursal>(`/negocio/sucursales/${id}/`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener sucursal');
    }
}

// Crear sucursal
export async function createSucursal(sucursalData: {
    ciudad: number;
    nombre: string;
    direccion: string;
    activo?: boolean;
}): Promise<Sucursal> {
    try {
        const response = await apiClient.post<Sucursal>('/negocio/sucursales/', sucursalData);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                             error.response?.data?.nombre?.[0] ||
                             error.response?.data?.direccion?.[0] ||
                             'Error al crear sucursal';
        throw new Error(errorMessage);
    }
}

// 🏙️ CIUDADES

// Listar ciudades
export async function getCiudades(): Promise<Ciudad[]> {
    try {
        const response = await apiClient.get('/negocio/ciudades/');
        return normalizeApiResponse<Ciudad>(response.data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener ciudades');
    }
}

// Crear ciudad
export async function createCiudad(ciudadData: { nombre: string }): Promise<Ciudad> {
    try {
        const response = await apiClient.post<Ciudad>('/negocio/ciudades/', ciudadData);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                             error.response?.data?.nombre?.[0] ||
                             'Error al crear ciudad';
        throw new Error(errorMessage);
    }
}

// 🏪 PUNTOS DE VENTA

// Listar puntos de venta
export async function getPuntosVenta(): Promise<PuntoVenta[]> {
    try {
        const response = await apiClient.get('/negocio/puntos-venta/');
        return normalizeApiResponse<PuntoVenta>(response.data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener puntos de venta');
    }
}

// Obtener puntos de venta por sucursal
export async function getPuntosVentaBySucursal(sucursalId: number): Promise<PuntoVenta[]> {
    try {
        const response = await apiClient.get(
            `/negocio/puntos-venta/?sucursal=${sucursalId}`
        );
        return normalizeApiResponse<PuntoVenta>(response.data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener puntos de venta');
    }
}

// Crear punto de venta
export async function createPuntoVenta(puntoVentaData: {
    sucursal: number;
    nombre: string;
    activo?: boolean;
}): Promise<PuntoVenta> {
    try {
        const response = await apiClient.post<PuntoVenta>('/negocio/puntos-venta/', puntoVentaData);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                             error.response?.data?.nombre?.[0] ||
                             'Error al crear punto de venta';
        throw new Error(errorMessage);
    }
}

// Delete punto de venta
export async function deletePuntoVenta(id: number): Promise<{ message: string }> {
    try {
        await apiClient.delete(`/negocio/puntos-venta/${id}/`);
        return { message: 'Punto de venta eliminado exitosamente' };
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al eliminar punto de venta');
    }   
}

// ACTUALIZAR punto de venta
export async function updatePuntoVenta(id: number, puntoVentaData: Partial<PuntoVenta>): Promise<PuntoVenta> {
    try {
        const response = await apiClient.put<PuntoVenta>(`/negocio/puntos-venta/${id}/`, puntoVentaData);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                             error.response?.data?.nombre?.[0] ||
                                'Error al actualizar punto de venta';
        throw new Error(errorMessage);
    }
}

export async function patchPuntoVenta(
  id: number,
  data: Partial<PuntoVenta>
): Promise<PuntoVenta> {
  try {
    const response = await apiClient.patch<PuntoVenta>(
      `/negocio/puntos-venta/${id}/`,
      data
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.nombre?.[0] ||
      'Error al actualizar punto de venta'
    );
  }
}

// 📊 ESTADOS DE VENTA

// Listar estados de venta
export async function getEstadosVenta(): Promise<EstadoVenta[]> {
    try {
        const response = await apiClient.get('/negocio/estados-venta/');
        return normalizeApiResponse<EstadoVenta>(response.data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error al obtener estados de venta');
    }
}

// Crear estado de venta
export async function createEstadoVenta(estadoData: { nombre: string }): Promise<EstadoVenta> {
    try {
        const response = await apiClient.post<EstadoVenta>('/negocio/estados-venta/', estadoData);
        return response.data;
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                             error.response?.data?.nombre?.[0] ||
                             'Error al crear estado de venta';
        throw new Error(errorMessage);
    }
}
