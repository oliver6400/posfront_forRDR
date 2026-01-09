// src/types/backend.types.ts
// Tipos basados en tu backend Django

// Base types
export type Timestamp = string; // ISO string format


// src/types/backend.types.ts
// Tipos basados en tu backend Django


// 👤 USUARIOS - Basado en apps/usuarios/models.py
export interface Rol {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  ci: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fecha_nacimiento?: string;
  activo: boolean;
  password_reset_pin?: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups?: any[];
  user_permissions?: any[];
  rol?: Rol; // AGREGADO: relación con Rol
  is_active: boolean; // AGREGADO: campo del modelo Django
  date_joined: string; // AGREGADO: campo del modelo Django
}

// AGREGADO: Tipo completo que incluye la relación con rol
export interface UsuarioCompleto extends Usuario {
  rol: Rol;
}

// AGREGADO: Tipos para crear usuario
export interface CrearUsuarioPayload {
  ci: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fecha_nacimiento?: string;
  password: string;
  rol_id: number;
  is_staff?: boolean;
}

export interface CrearUsuarioResponse {
  user: UsuarioCompleto;
  message: string;
}

// 🏢 NEGOCIO - Basado en apps/negocio/models.py
export interface Ciudad {
  id: number;
  nombre: string;
}

export interface Sucursal {
  id: number;
  ciudad: number | Ciudad;
  nombre: string;
  direccion: string;
  activo: boolean;
}

export interface PuntoVenta {
  id: number;
  sucursal: number | Sucursal;
  nombre: string;
  activo: boolean;
}

export interface Cliente {
  id: number;
  nit: string;
  nombre: string;
  razon_social: string;
  email: string;
}

export interface EstadoVenta {
  id: number;
  nombre: string;
}

// 📦 INVENTARIO - Basado en apps/inventario/models.py
export interface Producto {
  id: number;
  codigo_barras: string;
  codigo: string; 
  nombre: string;
  unidad: string; 
  precio_venta: number;
  costo_promedio: number; 
  activo: boolean;
}

export interface ImagenProducto {
  id: number;
  producto: number | Producto;
  imagen: string;
  fecha_subida: Timestamp;
}

export interface InventarioSucursal {
  id: number;
  sucursal: number;
  producto: number;
  stock_actual: number;
  stock_minimo: number;
}

export interface MovimientoInventario {
  id: number;
  sucursal: number | Sucursal;
  usuario: number | Usuario;
  fecha_hora: Timestamp;
  tipo_movimiento: 'Entrada' | 'Salida';
  observacion?: string;
}

export interface MovimientoInventarioDetalle {
  id: number;
  movimiento: number | MovimientoInventario;
  producto: number | Producto;
  cantidad: number;
  costo_unitario: number;
}

export interface MovimientoInventarioView {
  id: number;
  fecha_hora: string;
  tipo_movimiento: 'Entrada' | 'Salida';
  observacion?: string;
  usuario: number | Usuario;
  producto: number | Producto;
  cantidad: number;
}

// 💰 VENTAS - Basado en apps/ventas/models.py
export interface Venta {
  id: number;
  sucursal: number | Sucursal;
  punto_venta: number | PuntoVenta;
  usuario: number | Usuario;
  cliente?: number | Cliente;
  estado_venta: number | EstadoVenta;
  fecha_hora: Timestamp;
  total_bruto: number;
  total_descuento: number;
  total_neto: number;
}

export interface DetalleVenta {
  id: number;
  venta: number | Venta;
  producto: number | Producto;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

export interface MetodoPago {
  id: number;
  nombre: string;
}

export interface VentaPago {
  id: number;
  venta: number | Venta;
  metodo_pago: number | MetodoPago;
  monto: number;
  referencia?: string;
}

export interface FacturaSimulada {
  id: number;
  venta: number | Venta;
  nit_ci: string;
  razon_social: string;
  numero_factura: string;
  fecha_emision: Timestamp;
}

// 📊 REPORTES - Basado en apps/reportes/models.py
export interface LogAuditoria {
  id: number;
  usuario: number | Usuario;
  fecha_hora: Timestamp;
  entidad: string;
  accion: string;
  detalle_json: any;
}

export interface ArqueoCaja {
  id: number;
  sucursal: number | Sucursal;
  punto_venta: number | PuntoVenta;
  usuario_apertura: number | Usuario;
  usuario_cierre?: number | Usuario;
  fecha_apertura: Timestamp;
  fecha_cierre?: Timestamp;
  monto_inicial: number;
  monto_final_sistema: number;
  monto_final_real: number;
  diferencia: number;
  estado: 'ABIERTA' | 'CERRADA';
}

export interface EstadoCajaResponse {
  abierta: boolean;
  arqueo: ArqueoCaja | null;
}

// 🔄 TIPOS EXTENDIDOS PARA EL FRONTEND
export interface ProductoConStock extends Producto {
  stock_actual?: number;
  stock_minimo?: number;
}

export interface VentaConDetalles extends Venta {
  detalles: DetalleVenta[];
  pagos?: VentaPago[];
  cliente_data?: Cliente;
  sucursal_data?: Sucursal;
  usuario_data?: Usuario;
}

// 📝 PAYLOADS PARA CREAR/ACTUALIZAR
export interface CrearVentaPayload {
  sucursal: number;
  punto_venta: number;
  cliente?: number;
  estado_venta: number;
  detalles: Array<{
    producto: number;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
  }>;
  pagos: Array<{
    metodo_pago: number;
    monto: number;
    referencia?: string;
  }>;
  total_descuento?: number;
}

export interface CrearMovimientoInventarioPayload {
  sucursal: number;
  tipo_movimiento: 'Entrada' | 'Salida';
  observacion?: string;
  detalles: Array<{
    producto: number;
    cantidad: number;
    costo_unitario: number;
  }>;
}

export interface CrearProductoPayload extends Omit<Producto, 'id'> {}

export interface CrearClientePayload extends Omit<Cliente, 'id'> {}

export interface ActualizarStockPayload {
  stock_actual: number;
  stock_minimo?: number;
}

// 📊 TIPOS PARA RESPUESTAS DE LISTAS PAGINADAS
export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// 🔍 TIPOS PARA FILTROS Y BÚSQUEDAS
export interface FiltroVentas {
  fecha_desde?: string;
  fecha_hasta?: string;
  sucursal?: number;
  estado?: number;
  page?: number;
  limit?: number;
}

export interface FiltroProductos {
  search?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export interface FiltroClientes {
  search?: string;
  page?: number;
  limit?: number;
}

// Añade este tipo para manejar respuestas que pueden ser paginadas o no
export interface FlexibleProductResponse {
  results?: ProductoConStock[];
  count?: number;
  next?: string;
  previous?: string;
}