// src/pages/Menu/POS/components/StockControl.tsx
import React, { useState, useEffect } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import './StockControl.css'; 
import type { 
  ProductoConStock, 
  Sucursal, 
  InventarioSucursal,
  MovimientoInventarioView,
  CrearProductoPayload
} from '../../../../types/backend.types';
import { 
  getProducts, 
  updateStock, 
  getStockBySucursal, 
  getLowStockProducts,
  getInventoryMovements,
  createProduct,
  deleteProduct,
  updateProduct,
  createInventoryMovement
} from '../../../../services/api/products.api';
import { getSucursales } from '../../../../services/api/sales.api';

interface StockControlProps {
  user: AuthUser;
}

type ViewMode = 'stock' | 'movements' | 'lowStock' | 'adjust' | 'products';

const StockControl: React.FC<StockControlProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('stock');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<number | null>(null);
  const [products, setProducts] = useState<ProductoConStock[]>([]);

  //Esto es para el inventario de sucursal
  const [stockData, setStockData] = useState<InventarioSucursal[]>([]);

  const [movements, setMovements] = useState<MovimientoInventarioView[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductoConStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para ajuste de stock
  const [adjustProduct, setAdjustProduct] = useState<ProductoConStock | null>(null);
  const [editProduct, setEditProduct] = useState<ProductoConStock | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Movimiento
  const [isMovementFormVisible, setIsMovementFormVisible] = useState(false);
  const [movementType, setMovementType] = useState<'Entrada' | 'Salida'>('Entrada');
  const [movementObservation, setMovementObservation] = useState('');
  // Detalles
  const [movementDetails, setMovementDetails] = useState<{
    producto: number;
    cantidad: string;
    costo_unitario: string;
  }[]>([
    { producto: 0, cantidad: '', costo_unitario: '' }
  ]);

  // Modal and form states
  const [newProductData, setNewProductData] = useState<CrearProductoPayload>({
    nombre: '',
    codigo: '',
    codigo_barras: '',
    precio_venta: 0,
    costo_promedio: 0,
    unidad: '',
    activo: true
  });

  const [isProductFormVisible, setIsProductFormVisible] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSucursal) {
      loadStockData();
    }
  }, [selectedSucursal, viewMode]);

  const loadInitialData = async () => {
    try {
      const sucursalesData = await getSucursales();
      setSucursales(sucursalesData);
      
      if (sucursalesData.length > 0) {
        setSelectedSucursal(sucursalesData[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  const loadStockData = async () => {
    console.log('viewMode:', viewMode);
    console.log('selectedSucursal:', selectedSucursal);
    if (!selectedSucursal) return;
    
    setIsLoading(true);
    try {
      switch (viewMode) {
        case 'stock':
          await loadCurrentStock();
          break;
        case 'movements':
          await loadMovements();
          break;
        case 'lowStock':
          await loadLowStockProducts();
          break;
        case 'products':
          await loadProducts();
          break;
      }
    } catch (error) {
      console.error('Error cargando datos de stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentStock = async () => {
    const [productsData, stockInventory] = await Promise.all([
      getProducts(),
      getStockBySucursal(selectedSucursal!)
    ]);

    const productMap = new Map(productsData.map(p => [p.id, p]));

    const productsWithStock: ProductoConStock[] = stockInventory
      .map(inv => {
        const product = productMap.get(inv.producto); // ✅ AHORA SÍ
        if (!product) return null;

        return {
          ...product,
          stock_actual: inv.stock_actual,
          stock_minimo: inv.stock_minimo,
        };
      })
      .filter(Boolean) as ProductoConStock[];

    setProducts(productsWithStock);
  };

  const loadProducts = async () => {
    const productsData = await getProducts(); // Obtener todos los productos
    setProducts(productsData);
  };

  const loadMovements = async () => {
    const movementsData = await getInventoryMovements({
      sucursal: selectedSucursal!,
      page: 1,
      limit: 50
    });
    setMovements(movementsData);
    console.log(movementsData);
  };

  const loadLowStockProducts = async () => {
    if (!selectedSucursal) return;

    try {
      setIsLoading(true);
      const lowStock = await getLowStockProducts(selectedSucursal!);
      console.log("Productos con stock bajo:", lowStock);  // Agregar log para verificar los productos con stock bajo
      
      //if (lowStock.length === 0) {
        // Si no hay productos con stock bajo, puedes mostrar un mensaje o manejarlo de otra manera
        //alert("No hay productos con stock bajo");
      //}
      
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error("Error cargando productos con stock bajo", error);
      setLowStockProducts([]);  // Reset if error occurs
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditModal = (product: ProductoConStock) => {
    setEditProduct(product);
    setNewProductData({
      nombre: product.nombre,
      codigo: product.codigo,
      codigo_barras: product.codigo_barras,
      precio_venta: product.precio_venta,
      costo_promedio: product.costo_promedio,
      unidad: product.unidad,
      activo: product.activo
    });
    setIsProductFormVisible(true);
  }

  const handleStockAdjustment = async () => {
    if (!adjustProduct || !selectedSucursal) return;
    
    setIsLoading(true);
    try {
      await updateStock(selectedSucursal, adjustProduct.id, {
        stock_actual: newStock,
        stock_minimo: newMinStock
      });
      
      // Recargar datos
      await loadStockData();
      
      // Limpiar formulario
      setAdjustProduct(null);
      setNewStock(0);
      setNewMinStock(0);
      setAdjustReason('');
      
      alert('Stock actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando stock:', error);
      alert('Error al actualizar stock');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdjustModal = (product: ProductoConStock) => {
    setAdjustProduct(product);
    setNewStock(product.stock_actual || 0);
    setNewMinStock(product.stock_minimo || 0);
    setViewMode('adjust');
  };

  // Función para manejar el envío del formulario y crear el producto
  const handleCreateOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editProduct) {
        // Editar producto existente
        await updateProduct(editProduct.id, newProductData);
        alert('Producto editado exitosamente');
      } else {
        // Crear nuevo producto
        await createProduct(newProductData);
        alert('Producto creado exitosamente');
      }

      setIsProductFormVisible(false); // Cerrar el formulario después de crear el producto
      setEditProduct(null); // Limpiar el estado de edición
      loadProducts(); // Recargar los productos
    } catch (error) {
      console.error('Error creando producto:', error);
      alert('Error al crear el producto');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar el envío del formulario y crear moimiento de inventario
  const handleCreateMovements = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSucursal) {
      alert("Seleccione una sucursal");
      return;
    }

    if (!movementObservation.trim()) {
      alert("La observación es obligatoria");
      return;
    }

    if (!movementDetails[0].producto) {
      alert("Seleccione un producto");
      return;
    }

    setIsLoading(true);
    try {
      await createInventoryMovement({
        sucursal: selectedSucursal,
        tipo_movimiento: movementType,
        observacion: movementObservation,
        detalles: movementDetails.map(d => ({
          producto: d.producto,
          cantidad: Number(d.cantidad),
          costo_unitario: Number(d.costo_unitario)
        }))
      });

      alert("Movimiento creado correctamente");

      // Reset
      setMovementObservation('');
      setMovementDetails([{ producto: 0, cantidad: '', costo_unitario: '' }]);
      setIsMovementFormVisible(false);

      loadMovements();
      loadCurrentStock();
    } catch (error) {
      console.error(error);
      alert("Error al crear el movimiento");
    } finally {
      setIsLoading(false);
    }
  };

  // Funcion para eliminar un producto
  const handleDeleteProduct = async (id: number, nombre: string) => { 
    const confirmar = window.confirm(
      `¿Deseas eliminar el producto "${nombre}"?`
    );

    if (!confirmar) return;

    try {
      await deleteProduct(id);

      await loadProducts(); // ✅ Recarga real desde el backend

      alert("Producto eliminado correctamente");
    } catch (error) {
      console.error("Error eliminando producto", error);
      alert("No se pudo eliminar el producto");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProductData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // 🔎 Búsqueda con valores seguros
  const filteredProducts = products.filter(product =>
    (product.nombre?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (product.codigo_barras?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  console.log("Productos cargados:", products);

  const canAdjustStock = user.role === 'Almacenero' || user.role === 'Supervisor' || 
                        user.role === 'Admin' || user.role === 'Cajero' || user.role === 'SuperAdmin';

  return (
    <div className="stock-control">
      <div className="stock-header">
        <h2>CU05: Control de Stock en Tiempo Real</h2>
        
        {/* Selector de sucursal */}
        <div className="sucursal-selector">
          <label>Sucursal:</label>
          <select 
            title="Seleccionar Sucursal"
            value={selectedSucursal || ''} 
            onChange={(e) => setSelectedSucursal(parseInt(e.target.value))
            }
          >
            <option value="">Seleccionar sucursal...</option>
            {sucursales.map(sucursal => (
              <option key={sucursal.id} value={sucursal.id}>
                {typeof sucursal.ciudad === 'object' ? sucursal.ciudad.nombre : sucursal.ciudad} - {sucursal.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Pestañas de vista */}
        <div className="view-tabs">
          <button 
            className={`tab ${viewMode === 'stock' ? 'active' : ''}`}
            onClick={() => setViewMode('stock')}
          >
            Stock Actual
          </button>
          <button 
            className={`tab ${viewMode === 'lowStock' ? 'active' : ''}`}
            onClick={() => setViewMode('lowStock')}
          >
            Stock Bajo
          </button>
          <button 
            className={`tab ${viewMode === 'movements' ? 'active' : ''}`}
            onClick={() => setViewMode('movements')}
          >
            Movimientos
          </button>
                    <button 
            className={`tab ${viewMode === 'products' ? 'active' : ''}`}
            onClick={() => setViewMode('products')}
          >
            Productos
          </button>
        </div>
      </div>

      {isLoading && <div className="loading">Cargando datos...</div>}

      {/* Vista de Stock Actual */}
      {viewMode === 'stock' && (
        <div className="stock-view">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="table-container">
            <div className="stock-table">
              {/* Títulos de la tabla */}
              <div className="table-header">
                <span>Código</span>
                <span>Producto</span>
                <span>Stock Actual</span>
                <span>Stock Mínimo</span>
                <span>Estado</span>
                {canAdjustStock && <span>Acciones</span>}
              </div>

              {filteredProducts
                .filter((product) => product.activo)
                .map((product) => {
                  const isLowStock = (product.stock_actual || 0) <= (product.stock_minimo || 0);
                  const isOutOfStock = (product.stock_actual || 0) === 0;

                  return (
                    <div
                      key={`${product.id}-${selectedSucursal}`}
                      className={`table-row ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''}`}
                    >
                      <span className="product-code">{product.codigo_barras}</span>
                      <span className="product-name">{product.nombre}</span>
                      <span className="stock-current">{product.stock_actual || 0}</span>
                      <span className="stock-minimum">{product.stock_minimo || 0}</span>
                      <span className="stock-status">
                        {isOutOfStock ? (
                          <span className="status out-of-stock">Sin Stock</span>
                        ) : isLowStock ? (
                          <span className="status low-stock">Stock Bajo</span>
                        ) : (
                          <span className="status normal">Normal</span>
                        )}
                      </span>
                      {canAdjustStock && (
                        <span className="actions">
                          <button className="adjust-btn" onClick={() => openAdjustModal(product)}>
                            Ajustar
                          </button>
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Vista de Stock Bajo */}
      {viewMode === 'lowStock' && (
        <div className="low-stock-view">
          <h3>Productos con Stock Bajo</h3>
          
          {lowStockProducts.length === 0 ? (
            <div className="no-data">
              <p>No hay productos con stock bajo</p>
            </div>
          ) : (
            <div className="low-stock-table">
              <div className="table-header">
                <span>Producto</span>
                <span>Stock Actual</span>
                <span>Stock Mínimo</span>
                <span>Diferencia</span>
                {canAdjustStock && <span>Acciones</span>}
              </div>

              {lowStockProducts.map(product => (
                <div key={product.id} className="table-row low-stock">
                  <span className="product-name">
                    <strong>{product.nombre}</strong>
                    <small>{product.codigo_barras}</small>
                  </span>
                  <span className="stock-current">{product.stock_actual || 0}</span>
                  <span className="stock-minimum">{product.stock_minimo || 0}</span>
                  <span className="stock-difference">
                    {(product.stock_actual || 0) - (product.stock_minimo || 0)}
                  </span>
                  {canAdjustStock && (
                    <span className="actions">
                      <button 
                        className="adjust-btn urgent"
                        onClick={() => openAdjustModal(product)}
                      >
                        Ajustar Urgente
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista de Movimientos */}
      {viewMode === 'movements' && (
        <div className="movements-view">
          <div className="button-container">
            <button 
              className="movement-btn"
              onClick={() => setIsMovementFormVisible(true)} // Controla la visibilidad del formulario
            >
              Crear Movimiento de Stock
            </button>
          </div>
          <h3>Movimientos de Inventario</h3>
          
          {movements.length === 0 ? (
            <div className="no-data">
              <p>No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="movements-table-wrapper">
              <div className="movements-table">
                <div className="table-header">
                  <span>Fecha</span>
                  <span>Producto</span>
                  <span>Tipo</span>
                  <span>Cantidad</span>
                  <span>Usuario</span>
                  <span>Observación</span>
                </div>

                {movements.map(movement => (
                  <div key={movement.id} className="table-row">
                    <span className="movement-date">
                      {new Date(movement.fecha_hora).toLocaleDateString('es-ES')}
                      <small>{new Date(movement.fecha_hora).toLocaleTimeString('es-ES')}</small>
                    </span>
                    <span className="movement-product">
                      {typeof movement.producto === 'object' ? movement.producto.nombre : movement.producto}
                    </span>
                    <span className={`movement-type ${movement.tipo_movimiento.toLowerCase()}`}>
                      {movement.tipo_movimiento}
                    </span>
                    <span className="movement-quantity">{movement.cantidad}</span>
                    <span className="movement-user">
                      {typeof movement.usuario === 'object' ? movement.usuario.nombre : movement.usuario}
                    </span>
                    <span className="movement-observation">
                      {movement.observacion || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Productos */}
      {viewMode === 'products' && (
        <div className="products-view">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="button-container">
            <button 
              className="product-btn"
              onClick={() => setIsProductFormVisible(true)} // Controla la visibilidad del formulario
            >
              Nuevo Producto
            </button>
          </div>

          {/* Contenedor de la tabla con desplazamiento horizontal */}
          <div className="table-container">
            <div className="products-table">
              {/* Títulos de la tabla */}
              <div className="table-header">
                <span>Código</span>
                <span>Producto</span>
                <span>Unidad</span>
                <span>Activo</span>
                <span>Acciones</span>
              </div>

              {/* Datos de los productos */}
              {products.map((product) => (
                <div key={product.id} className="table-row">
                  <span>{product.codigo_barras}</span>
                  <span>{product.nombre}</span>
                  <span>{product.unidad}</span>
                  <span>{product.activo ? 'Sí' : 'No'}</span>
                  <span className="actions">
                    <button className="edit-btn" onClick={() => openEditModal(product)}>
                      Editar
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteProduct(product.id, product.nombre)}>
                      Borrar
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    
      {/* Modal de Ajuste de Stock */}
      {viewMode === 'adjust' && adjustProduct && (
        <div className="adjust-modal">
          <div className="modal-content">
            <h3>Ajustar Stock - {adjustProduct.nombre}</h3>
            
            <div className="current-info">
              <div className="info-item">
                <label>Stock Actual:</label>
                <span>{adjustProduct.stock_actual || 0}</span>
              </div>
              <div className="info-item">
                <label>Stock Mínimo:</label>
                <span>{adjustProduct.stock_minimo || 0}</span>
              </div>
            </div>

            <div className="adjust-form">
              <div className="form-group">
                <label>Nuevo Stock Actual:</label>
                <input
                  placeholder='0'
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Nuevo Stock Mínimo:</label>
                <input
                  placeholder='0'
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Observación:</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Motivo del ajuste (opcional)"
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="save-btn"
                onClick={handleStockAdjustment}
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              
              <button 
                className="cancel-btn"
                onClick={() => {
                  setAdjustProduct(null);
                  setViewMode('stock');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumen de Stock */}
      {viewMode === 'stock' && (
        <div className="stock-summary">
          <div className="summary-card">
            <h4>Resumen de Stock</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Total Productos:</span>
                <span className="stat-value">{products.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Con Stock Bajo:</span>
                <span className="stat-value low-stock">
                  {products.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 0)).length}
                </span>
              </div>
              <div className="stat">
                <span className="stat-label">Sin Stock:</span>
                <span className="stat-value out-of-stock">
                  {products.filter(p => (p.stock_actual || 0) === 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Movimiento de productos */}
      {viewMode === 'movements' && isMovementFormVisible && (
        <div className="movement-form-modal">
          <div className="modal-content">
            <h3>Crear Nuevo Movimiento</h3>

            <form onSubmit={handleCreateMovements}>
              {/* Tipo de Movimiento */}
              <div className="form-group">
                <label>Tipo de Movimiento *</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as 'Entrada' | 'Salida')}
                  required
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Salida">Salida</option>
                </select>
              </div>

              {/* Observacion */}
              <div className="form-group">
                <label>Observación *</label>
                <textarea
                  value={movementObservation}
                  onChange={(e) => setMovementObservation(e.target.value)}
                  placeholder="Justifique el movimiento de inventario"
                  required
                />
              </div>

              {/* Producto */}
              <div className="form-group">
                <label>Producto *</label>
                <select
                  value={movementDetails[0].producto}
                  onChange={(e) =>
                    setMovementDetails([{
                      ...movementDetails[0],
                      producto: Number(e.target.value)
                    }])
                  }
                  required
                >
                  <option value="">Seleccione producto</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  min={1}
                  value={movementDetails[0].cantidad}
                  onChange={(e) =>
                    setMovementDetails([{
                      ...movementDetails[0],
                      cantidad: e.target.value
                    }])
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Costo Unitario *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={movementDetails[0].costo_unitario}
                  onChange={(e) =>
                    setMovementDetails([{
                      ...movementDetails[0],
                      costo_unitario: e.target.value
                    }])
                  }
                  required
                />
              </div>

              {/* Botones de acción */}
              <div className="modal-actions">
                <button type="submit" className="save-btn" disabled={isLoading}>
                  Crear Movimiento
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsMovementFormVisible(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Producto */}
      {viewMode === 'products' && isProductFormVisible && (
        <div className="product-form-modal">
          <div className="modal-content">
            <h3>{editProduct? "Editar Producto" : "Crear Nuevo Producto"}</h3>

            <form onSubmit={handleCreateOrUpdateProduct}>
              {/* Nombre del Producto */}
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="nombre"
                  value={newProductData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre del producto"
                />
              </div>

              {/* Código del Producto */}
              <div className="form-group">
                <label>Código:</label>
                <input
                  type="text"
                  name="codigo"
                  value={newProductData.codigo}
                  onChange={handleInputChange}
                  placeholder="Código del producto"
                />
              </div>

              {/* Código de Barras */}
              <div className="form-group">
                <label>Código de Barras:</label>
                <input
                  type="text"
                  name="codigo_barras"
                  value={newProductData.codigo_barras}
                  onChange={handleInputChange}
                  placeholder="Código de barras"
                />
              </div>

              {/* Precio de Venta */}
              <div className="form-group">
                <label>Precio de Venta:</label>
                <input
                  type="number"
                  name="precio_venta"
                  value={newProductData.precio_venta}
                  onChange={handleInputChange}
                  placeholder="Precio de venta"
                />
              </div>

              {/* Costo Promedio */}
              <div className="form-group">
                <label>Costo Promedio:</label>
                <input
                  type="number"
                  name="costo_promedio"
                  value={newProductData.costo_promedio}
                  onChange={handleInputChange}
                  placeholder="Costo promedio"
                />
              </div>

              {/* Unidad */}
              <div className="form-group">
                <label>Unidad:</label>
                <input
                  type="text"
                  name="unidad"
                  value={newProductData.unidad}
                  onChange={handleInputChange}
                  placeholder="Unidad de medida"
                />
              </div>

              {/* Activo (checkbox) */}
              <div className="form-group">
                <label>Activo:</label>
                <input
                  type="checkbox"
                  checked={newProductData.activo}
                  onChange={(e) => setNewProductData({ ...newProductData, activo: e.target.checked })}
                />
              </div>

              {/* Botones de acción */}
              <div className="modal-actions">
                <button type="submit" className="save-btn" disabled={isLoading}>
                  {editProduct? 'Guardar Cambios' : 'Crear Producto'}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsProductFormVisible(false);
                    setEditProduct(null); 
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StockControl;