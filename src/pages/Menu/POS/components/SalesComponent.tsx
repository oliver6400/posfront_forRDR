// src/pages/Menu/POS/components/SalesComponent.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { AuthUser } from '../../../../types/user.types';
import './SalesComponent.css';
import type {
  ProductoConStock,
  Cliente,
  MetodoPago, 
  Sucursal,
  CrearVentaPayload,
  PuntoVenta,
  ArqueoCaja,
  EstadoCajaResponse
} from '../../../../types/backend.types';
import {
  searchProducts,
  createSale,
  generateInvoice,
  getPaymentMethods, 
  getSucursales,
  searchClientByNit,
  createClient,
  abrirCaja,
  cerrarCaja,
  estadoCaja as fetchEstadoCaja,
  usarioCajaAbierta
} from '../../../../services/api/sales.api';
import { getStockBySucursal } from "../../../../services/api/products.api";
import { 
  getPuntosVentaBySucursal
} from '../../../../services/api/business.api';

interface SalesComponentProps {
  user: AuthUser;
}

interface CartItem {
  producto: ProductoConStock;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

interface PaymentItem {
  metodo_pago: number;
  metodo_nombre: string;
  monto: number;
  referencia?: string;
}

const SalesComponent: React.FC<SalesComponentProps> = ({ user }) => {
  // Estados para productos y carrito
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductoConStock[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para cliente
  const [clientNit, setClientNit] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  // Estados para pago
  const [paymentMethods, setPaymentMethods] = useState<MetodoPago[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);

  //aun en desarrollo (para el metodo de pago)
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Estados para configuración 
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<number | null>(null);

  // Estados para procesamiento
  const [isProcessing, setIsProcessing] = useState(false);

  //Para el comprobante (aun en desarrollo)
  const [showInvoice, setShowInvoice] = useState(false);

  const [lastSaleId, setLastSaleId] = useState<number | null>(null);

  // Estado de arqueo de caja
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [montoInicial, setMontoInicial] = useState<string>("");
  const [montoFinalReal, setMontoFinalReal] = useState<string>("");
  const [montoFinalSistema, setMontoFinalSistema] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([]);
  const [puntoVentaSeleccionado, setPuntoVentaSeleccionado] = useState<number | null>(null);
  const [estadoCaja, setEstadoCaja] = useState<ArqueoCaja | null>(null);

  // Referencias para escaneo de código de barras
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
    // Focus en input de código de barras al cargar
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const [metodosData, sucursalesData] = await Promise.all([ 
        getPaymentMethods(),
        getSucursales()
      ]);

      setPaymentMethods(metodosData); 
      setSucursales(sucursalesData);

      // Seleccionar primera sucursal por defecto
      if (sucursalesData.length > 0) {
        setSelectedSucursal(sucursalesData[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    }
  };

  // cargar puntos de venta de la sucursal seleccionada
  useEffect(() => {
    if (selectedSucursal) {
      loadPuntosVenta(selectedSucursal);
    }
  }, [selectedSucursal]);

  const loadPuntosVenta = async (sucursalId: number) => {
    try {
      const puntos = await getPuntosVentaBySucursal(sucursalId);
      setPuntosVenta(puntos);

      if (puntos.length > 0) {
        setPuntoVentaSeleccionado(puntos[0].id); // ✅
      }
    } catch (error) {
      console.error('Error cargando puntos de venta:', error);
    }
  };

  // seleccionar punto de venta
  const handlePuntoVentaChange = (puntoVentaId: number) => {
    setPuntoVentaSeleccionado(puntoVentaId);
  };

  // verificar si el usuario tiene caja abierta al iniciar sesión
  useEffect(() => {
    validarCajaAbierta();
  }, []);

  const validarCajaAbierta = async () => {
    try {
      const data = await usarioCajaAbierta();

      if (data.abierta && data.arqueo) {
        const arqueo = data.arqueo;

        setEstadoCaja(arqueo);
        setCajaAbierta(true);

        // ✅ Normalización segura
        const sucursalId =
          typeof arqueo.sucursal === 'number'
            ? arqueo.sucursal
            : arqueo.sucursal.id;

        const puntoVentaId =
          typeof arqueo.punto_venta === 'number'
            ? arqueo.punto_venta
            : arqueo.punto_venta.id;
        setSelectedSucursal(sucursalId);
        setPuntoVentaSeleccionado(puntoVentaId);
      } else { 
        setCajaAbierta(false);
        setEstadoCaja(null);
      }
    } catch (error) {
      console.error("Error verificando caja abierta", error);
      setCajaAbierta(false);
    } finally {
      setLoading(false);
    }
  };

  // cargar estado de caja al cambiar punto de venta
  const cargarEstadoCaja = async () => {
    if (!puntoVentaSeleccionado) return;

    try {
      const data: EstadoCajaResponse = await fetchEstadoCaja(puntoVentaSeleccionado);

      console.log("Estado caja recibido:", data);

      setEstadoCaja(data.arqueo);
      setCajaAbierta(data.abierta);

    } catch (error) {
      console.error(error);
      setError('Error cargando estado de caja');
      setCajaAbierta(false);
    }
  };

  useEffect(() => {
    const totalVentas = cart.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    setMontoFinalSistema(totalVentas);
  }, [cart]);

  const handleSucursalChange = async (sucursalId: number) => {
    setSelectedSucursal(sucursalId);

    const puntos = await getPuntosVentaBySucursal(sucursalId);
    setPuntosVenta(puntos);

    if (puntos.length > 0) {
      setPuntoVentaSeleccionado(puntos[0].id);
    } else {
      setPuntoVentaSeleccionado(null);
    }
  };

  const handleAbrirCaja = async () => {
    if(!puntoVentaSeleccionado){
      setError('Seleccione un punto de venta');
      return;
    }
    if (montoInicial === "" || Number(montoInicial) < 0) {
      setError("Ingrese un monto inicial válido");
      return;
    }

    const monto = Number(montoInicial);

    try{
      const data = await abrirCaja(puntoVentaSeleccionado, monto);
      setEstadoCaja(data);
      setCajaAbierta(data.estado === "ABIERTA");
      setMensaje('Caja abierta exitosamente');
    } catch (error: any) {
      console.log("Error abrir caja:", error.response?.data);
      setError(error.response?.data?.error || "Error al abrir caja");
    }
  }

  const handleCerrarCaja = async () => {
    if (!estadoCaja) return;

    try{
      const montoReal = Number(montoFinalReal);
      if (isNaN(montoReal)) {
        setError("Monto final real inválido");
        return;
      }
      const data = await cerrarCaja(estadoCaja.id, montoReal);
      setEstadoCaja(data);
      setCajaAbierta(false);
      setMensaje('Caja cerrada exitosamente');

      // limpiar estado POS
      setCart([]);
      setPayments([]);
      setSelectedClient(null);
      setClientNit('');
    } catch (error) {
      console.log(error);
      setError('Error al cerrar caja');
    }
  }  

  // CU04: Escaneo de código de barras/QR 
  const handleBarcodeInput = async (barcode: string) => {
    if (!barcode.trim()) return;

    setIsSearching(true);
    try {
      const foundProducts = await searchProducts(barcode, 1);
      if (foundProducts.length > 0) {
        addToCart(foundProducts[0]);
        setSearchQuery('');
      } else {
        alert('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error buscando producto:', error);
      alert('Error al buscar producto');
    } finally {
      setIsSearching(false);
    }
  };

  const handleProductSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setIsSearching(true);

    try {
      // Buscar productos por texto
      const foundProducts = await searchProducts(query, 10);

      // Obtener inventario REAL por sucursal
      const inventario = await getStockBySucursal(selectedSucursal!);

      // Combinar producto + stock
      const productosConStock = foundProducts.map((prod) => {
        const inv = inventario.find(
          (i) =>
            i.producto === prod.id || 
            i.producto === prod.id
        );

        return {
          ...prod,
          stock_actual: inv ? Number(inv.stock_actual) : 0,
          stock_minimo: inv ? Number(inv.stock_minimo) : 0,
        };
      });

      setProducts(productosConStock);
    } catch (error) {
      console.error("Error buscando productos:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToCart = async (producto: ProductoConStock) => {
    if (!selectedSucursal) {
      alert("Seleccione una sucursal primero");
      return;
    }

    try {
      // ✅ obtener stock real por sucursal
      const inventario = await getStockBySucursal(selectedSucursal);
      const inv = inventario.find(i => i.producto === producto.id);

      const stockActual = inv ? inv.stock_actual : 0;

      // ✅ Validar
      if (stockActual <= 0) {
        alert(`El producto "${producto.nombre}" no tiene stock disponible.`);
        return;
      }

      const existingItem = cart.find(item => item.producto.id === producto.id);

      if (existingItem) {
        if (existingItem.cantidad >= stockActual) {
          alert(`Stock insuficiente. Solo hay ${stockActual} unidades disponibles.`);
          return;
        }

        updateCartItemQuantity(producto.id, existingItem.cantidad + 1);
      } else {
        setCart(prev => [
          ...prev,
          {
            producto,
            cantidad: 1,
            precio_unitario: producto.precio_venta,
            descuento: 0,
            subtotal: producto.precio_venta
          }
        ]);
      }

    } catch (error) {
      console.error("Error obteniendo stock real", error);
      alert("Error obteniendo stock real");
    }
  };

  const updateCartItemQuantity = (productId: number, newQuantity: number) => {
    const item = cart.find(i => i.producto.id === productId);
    if (!item) return;

    const stockActual = item.producto.stock_actual || 0;

    // ✅ Si intenta poner más que el stock → bloquear
    if (newQuantity > stockActual) {
      alert(`Stock insuficiente. Solo hay ${stockActual} unidades disponibles.`);
      return;
    }

    // ✅ Si la cantidad es cero, eliminar
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // ✅ actualizar normalmente
    setCart(prev =>
      prev.map(i =>
        i.producto.id === productId
          ? { ...i, cantidad: newQuantity, subtotal: (i.precio_unitario * newQuantity) - i.descuento }
          : i
      )
    );
  };

  const updateCartItemDiscount = (productId: number, discount: number) => {
    setCart(prev => prev.map(item => {
      if (item.producto.id === productId) {
        const subtotal = (item.precio_unitario * item.cantidad) - discount;
        return { ...item, descuento: discount, subtotal };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.producto.id !== productId));
  };

  // CU06: Registrar cliente
  const handleClientSearch = async (nit: string) => {
    if (!nit.trim()) {
      setSelectedClient(null);
      return;
    }

    setIsSearchingClient(true);
    try {
      const client = await searchClientByNit(nit);
      setSelectedClient(client);
    } catch (error) {
      console.error('Error buscando cliente:', error);
      // Mostrar mensaje al usuario
      alert('Cliente no encontrado o error en la búsqueda');
    } finally {
      setIsSearchingClient(false);
    }
  };

  const handleCreateClient = async (clientData: {
    nit: string;
    nombre: string;
    razon_social: string;
    email: string;
  }) => {
    try {
      const newClient = await createClient(clientData);
      setSelectedClient(newClient);
      setClientNit(newClient.nit);
    } catch (error) {
      console.error('Error creando cliente:', error);
      alert('Error al crear cliente');
    }
  };

  // Calcular totales
  const calculateTotals = () => {
    const totalBruto = cart.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    const totalDescuento = cart.reduce((sum, item) => sum + item.descuento, 0);
    const totalNeto = totalBruto - totalDescuento;

    return { totalBruto, totalDescuento, totalNeto };
  };

  // CU03: Múltiples métodos de pago
  const addPayment = (metodoPago: MetodoPago, monto: number, referencia?: string) => {
    const newPayment: PaymentItem = {
      metodo_pago: metodoPago.id,
      metodo_nombre: metodoPago.nombre,
      monto,
      referencia
    };

    setPayments(prev => [...prev, newPayment]);
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const calculatePaymentTotals = () => {
    const totalPagado = payments.reduce((sum, payment) => sum + payment.monto, 0);
    const { totalNeto } = calculateTotals();
    const cambio = totalPagado - totalNeto;

    return { totalPagado, cambio };
  };

  // CU01: Procesar venta
  const handleProcessSale = async () => {
    console.log('ENTRANDO A PROCESAR VENTA');
    console.log({
      selectedSucursal,
      puntoVentaSeleccionado,
      cajaAbierta
    });
    if (!puntoVentaSeleccionado) {
      alert("Debes seleccionar un punto de venta");
      return;
    }
    if (!cajaAbierta) {
      setError('La caja está cerrada. No se pueden procesar ventas.');
      return;
    }
    try {
      if (cart.length === 0) {
        alert('Agregue productos al carrito');
        return;
      }

      if (!selectedSucursal) {
        alert('Seleccione una sucursal');
        return;
      }

      const { totalNeto } = calculateTotals();
      const { totalPagado } = calculatePaymentTotals();

      if (totalPagado < totalNeto) {
        alert('El monto pagado es insuficiente');
        return;
      }

      setIsProcessing(true);
      try {
 
        const saleData: CrearVentaPayload = {
          sucursal: selectedSucursal,
          punto_venta: puntoVentaSeleccionado,
          cliente: selectedClient?.id,  
          detalles: cart.map(item => ({
            producto: item.producto.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento: item.descuento
          })),
          ...(payments.length > 0 && { 
            pagos: payments.map(payment => ({
              metodo_pago: payment.metodo_pago,
              monto: payment.monto,
              referencia: payment.referencia || ''
            }))
          }),
          total_descuento: calculateTotals().totalDescuento
        };

        const sale = await createSale(saleData);
        setLastSaleId(sale.id);

        // Limpiar carrito y pagos
        setCart([]);
        setPayments([]);
        setSelectedClient(null);
        setClientNit('');
        setShowPaymentModal(false);

        alert('Venta procesada exitosamente');

        // Preguntar si desea generar comprobante
        if (confirm('¿Desea generar el comprobante electrónico?')) {
          handleGenerateInvoice(sale.id);
        }

      } catch (error) {
        console.error('Error procesando venta:', error);
        alert('Error al procesar la venta');
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      setError('Error al procesar la venta');
    }
  };

  // CU02: Generar comprobante electrónico simulado
  const handleGenerateInvoice = async (saleId: number) => {
    if (!selectedClient) {
      const clientData = prompt('Ingrese datos del cliente (NIT|Nombre|Email):');
      if (!clientData) return;

      const [nit, nombre, email] = clientData.split('|');
      try {
        await handleCreateClient({ nit, nombre, razon_social: nombre, email });
      } catch (error) {
        console.error('Error creando cliente:', error);
      }
    }

    try {
      const invoice = await generateInvoice(saleId, {
        nit_ci: selectedClient?.nit || '0',
        razon_social: selectedClient?.razon_social || 'Cliente General'
      });

      setShowInvoice(true);
      alert('Comprobante generado exitosamente');
    } catch (error) {
      console.error('Error generando comprobante:', error);
      alert('Error al generar comprobante');
    }
  };

  const { totalBruto, totalDescuento, totalNeto } = calculateTotals();
  const { totalPagado, cambio } = calculatePaymentTotals();
  const canProcessSale = cart.length > 0 && totalPagado >= totalNeto;

  if (loading) {
    return <div>Cargando estado de caja...</div>;
  }

  /* 🔒 NO hay caja → solo aperturar */
  if (!cajaAbierta) {
    return (
      <div className="open-cash-panel">
        <h2>
            {estadoCaja ? 'Tiene una caja abierta en otro punto de venta' : 'No hay caja abierta'}
        </h2>

        <select onChange={(e) => setSelectedSucursal(+e.target.value)}>
          <option value="">Sucursal</option>
          {sucursales.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        <select onChange={(e) => setPuntoVentaSeleccionado(+e.target.value)}>
          <option value="">Punto de Venta</option>
          {puntosVenta.map(pv => (
            <option key={pv.id} value={pv.id}>{pv.nombre}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Monto inicial"
          value={montoInicial}
          onChange={(e) => setMontoInicial(e.target.value)}
        />

        <button 
          onClick={handleAbrirCaja}
          disabled={!selectedSucursal || !puntoVentaSeleccionado || montoInicial === ""}
        >
          Aperturar Caja
        </button>
      </div>
    );
  }

  // Renderizado del componente
  return (
    <div className="sales-component">
      {/* Panel de búsqueda de productos */}
      <div className="product-search-panel">
        <h3>CU04: Escaneo/Búsqueda de Productos</h3>

        {/* Input para código de barras */}
        <div className="barcode-section">
          <label>Código de Barras/QR:</label>
          <input
            ref={barcodeInputRef}
            type="text"
            className="barcode-input"
            placeholder="Escanee o ingrese código..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcodeInput(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>

        {/* Búsqueda por texto */}
        <div className="text-search-section">
          <label>Búsqueda por nombre:</label>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleProductSearch(e.target.value);
            }}
          />

          {isSearching && <div className="loading">Buscando...</div>}

          {products.length > 0 && (
            <div className="search-results">
              {products.map(product => (
                <div key={product.id} className="product-item">
                  <div className="product-info">
                    <strong>{product.nombre}</strong>
                    <span className="product-price">
                      Bs. {Number(product.precio_venta).toFixed(2)}
                    </span>
                    <span className="product-stock">
                      Stock: {product.stock_actual || 0}
                    </span>
                  </div>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => addToCart(product)}

                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel del carrito */}
      <div className="cart-panel">
        <h3>CU01: Carrito de Compras</h3>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>El carrito está vacío</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={`${item.producto.id}-${index}`} className="cart-item">
                  <div className="item-info">
                    <strong>{item.producto.nombre}</strong>
                    <span className="item-code">{item.producto.codigo_barras}</span>
                  </div>

                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateCartItemQuantity(item.producto.id, item.cantidad - 1)}
                      >
                        -
                      </button>
                      <span className="quantity">{item.cantidad}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.producto.id, item.cantidad + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="price-controls">
                      <span className="unit-price">
                        Bs. {Number(item.precio_unitario).toFixed(2)}
                      </span>

                      <input
                        type="number"
                        className="discount-input"
                        placeholder="Descuento"
                        value={item.descuento}
                        onChange={(e) => updateCartItemDiscount(item.producto.id, parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="item-total">
                      <strong>Bs. {Number(item.subtotal).toFixed(2)}</strong>
                    </div>

                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromCart(item.producto.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-totals">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>Bs. {totalBruto.toFixed(2)}</span>
              </div>
              <div className="total-line">
                <span>Descuento:</span>
                <span>Bs. {totalDescuento.toFixed(2)}</span>
              </div>
              <div className="total-line total-final">
                <strong>
                  <span>TOTAL:</span>
                  <span>Bs. {totalNeto.toFixed(2)}</span>
                </strong>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Panel de cliente */}
      <div className="client-panel">
        <h3>CU06: Cliente</h3>

        <div className="client-search">
          <label>NIT/CI del Cliente:</label>
          <input
            type="text"
            className="client-input"
            placeholder="Ingrese NIT/CI..."
            value={clientNit}
            onChange={(e) => setClientNit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleClientSearch(e.currentTarget.value);
              }
            }}
          />
          <button
            onClick={() => handleClientSearch(clientNit)}
            disabled={isSearchingClient}
          >
            {isSearchingClient ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {selectedClient ? (
          <div className="selected-client">
            <div className="client-info">
              <strong>{selectedClient.razon_social}</strong>
              <span>NIT: {selectedClient.nit}</span>
              <span>Email: {selectedClient.email}</span>
            </div>
            <button onClick={() => { setSelectedClient(null); setClientNit(''); }}>
              Quitar
            </button>
          </div>
        ) : clientNit && (
          <div className="new-client-form">
            <p>Cliente no encontrado. ¿Registrar nuevo cliente?</p>
            <button
              onClick={() => {
                const nombre = prompt('Nombre del cliente:');
                const email = prompt('Email del cliente:');
                if (nombre && email) {
                  handleCreateClient({
                    nit: clientNit,
                    nombre,
                    razon_social: nombre,
                    email
                  });
                }
              }}
            >
              Registrar Cliente
            </button>
          </div>
        )}
      </div>

      {/* Panel de pago */}
      <div className="payment-panel">
        <h3>CU03: Métodos de Pago</h3>

        {payments.length > 0 && (
          <div className="payments-list">
            {payments.map((payment, index) => (
              <div key={index} className="payment-item">
                <span>{payment.metodo_nombre}</span>
                <span>Bs. {payment.monto.toFixed(2)}</span>
                {payment.referencia && (
                  <span className="reference">Ref: {payment.referencia}</span>
                )}
                <button onClick={() => removePayment(index)}>Quitar</button>
              </div>
            ))}

            <div className="payment-totals">
              <div>Total a pagar: Bs. {totalNeto.toFixed(2)}</div>
              <div>Total pagado: Bs. {totalPagado.toFixed(2)}</div>
              {cambio >= 0 && (
                <div className="change">
                  <strong>Cambio: Bs. {cambio.toFixed(2)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="payment-methods">
          {paymentMethods.map(method => (
            <button
              key={method.id}
              className="payment-method-btn"
              onClick={() => {
                const monto = prompt(`Monto para ${method.nombre}:`);
                if (monto) {
                  const referencia = method.nombre.toLowerCase().includes('tarjeta') ||
                    method.nombre.toLowerCase().includes('transfer') ?
                    prompt('Número de referencia (opcional):') : undefined;
                  addPayment(method, parseFloat(monto), referencia || undefined);
                }
              }}
            >
              {method.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Configuración */}
      <div className="config-panel">
        <h3>Configuración</h3>

        <div className="sucursal-selector">
          <label>Sucursal:</label>
          <select
            value={selectedSucursal || ''}
            disabled={cajaAbierta}
            onChange={(e) => handleSucursalChange(Number(e.target.value))}
          >
            <option value="">Seleccionar...</option>
            {sucursales.map(sucursal => (
              <option key={sucursal.id} value={sucursal.id}>
                {typeof sucursal.ciudad === 'object' ? sucursal.ciudad.nombre : sucursal.ciudad} - {sucursal.nombre}
              </option>
            ))}
          </select>
          <select
            value={puntoVentaSeleccionado ?? ""}
            disabled={cajaAbierta}
            onChange={(e) => handlePuntoVentaChange(Number(e.target.value))}
          >
            {puntosVenta.map((pv) => (
              <option key={pv.id} value={pv.id}>{pv.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="action-buttons">
        <button
          className="process-sale-btn"
          onClick={handleProcessSale}
          disabled={!canProcessSale || isProcessing}
        >
          {isProcessing ? 'Procesando...' : 'PROCESAR VENTA'}
        </button>

        <button
          className="clear-sale-btn"
          onClick={() => {
            setCart([]);
            setPayments([]);
            setSelectedClient(null);
            setClientNit('');
          }}
        >
          Limpiar Todo
        </button>

        {lastSaleId && (
          <button
            className="generate-invoice-btn"
            onClick={() => handleGenerateInvoice(lastSaleId)}
          >
            CU02: Generar Comprobante
          </button>
        )}
      </div>

      <div className="close-pos-btn">
        <button
          className="close-cash-btn"
          onClick={() => {
            const montoFinalReal = prompt("Ingrese el monto real en caja:");
            if (montoFinalReal === null) return;
            handleCerrarCaja();
          }}
        >
          Cerrar Caja
        </button>
      </div>
    </div>
  );
};

export default SalesComponent;