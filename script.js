document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    //                BLOQUE DE SEGURIDAD Y SESIÓN
    // =================================================================
    const nombreUsuario = sessionStorage.getItem('nombreUsuario');

    if (!nombreUsuario) {
        window.location.href = 'login.html';
        return;
    }

    const infoUsuarioDiv = document.createElement('div');
    infoUsuarioDiv.id = 'info-usuario';
    infoUsuarioDiv.innerHTML = `
        <span>Usuario: <strong>${nombreUsuario}</strong></span>
        <a href="#" id="logout-link">Cerrar Sesión</a>
    `;
    
    const container = document.querySelector('.caja-container');
    container.insertBefore(infoUsuarioDiv, container.firstChild);

    document.getElementById('logout-link').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('nombreUsuario');
        window.location.href = 'login.html';
    });
    // =================================================================
    //            FIN DEL BLOQUE DE SEGURIDAD Y SESIÓN
    // =================================================================


    // --- VARIABLES Y CONSTANTES ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby4jw_3_ZXeDa7KYS61YsKbliV0PWIvaqgaAzbSMZ4MaGNfXOk5elBLm5vPt167Js_X/exec';
    const TOTAL_MESAS = 10;
    const NOMBRES_TIENDAS = ['Tienda 1', 'Tienda 2', 'Tienda 3', 'Tienda 4'];
    const menu = {
        '1/4 de pollo': 19.90,
        '1/4 de pollo con chaufa': 21.90,
        'Combo 2': 60.90,
        '1/4 de pollo': 19.90,
        '1/2 pollo': 39.90,
        '1/8 de pollo': 19.90,
        '1/8 de pollo con chaufa': 21.90,
        'Combo 3': 60.90,
        '1/2 de pollo': 19.90,
        '1/7 pollo': 39.90,
        '1.5 pollo': 50.90
    };
    
    let estadoTiendas = {};
    let ordenActiva = [];
    let tiendaSeleccionada = '';
    let tipoDeOrden = '';
    let mesaSeleccionada = null;

    // --- ELEMENTOS DEL DOM ---
    const seccionTienda = document.getElementById('seccion-tienda');
    const selectorTienda = document.getElementById('selector-tienda');
    const btnConfirmarTienda = document.getElementById('btn-confirmar-tienda');
    const seccionTipoOrden = document.getElementById('seccion-tipo-orden');
    const btnSalon = document.getElementById('btn-salon');
    const btnLlevar = document.getElementById('btn-llevar');
    const btnVolverInicioTipo = document.getElementById('btn-volver-inicio-tipo');
    const seccionMesas = document.getElementById('seccion-mesas');
    const tituloSeccionMesas = document.getElementById('titulo-seccion-mesas');
    const mesasGrid = document.getElementById('mesas-grid');
    const btnVolverTipoOrden = document.getElementById('btn-volver-tipo-orden');
    const cajaPrincipal = document.getElementById('caja-principal');
    const tituloOperacion = document.getElementById('titulo-operacion');
    const menuItemsContainer = document.getElementById('menu-items');
    const listaOrden = document.getElementById('lista-orden');
    const totalConsumoSpan = document.getElementById('total-consumo');
    const seccionVenta = document.getElementById('seccion-venta');
    const seccionPago = document.getElementById('seccion-pago');
    const btnCobrar = document.getElementById('btn-cobrar');
    const btnVolver = document.getElementById('btn-volver');
    const btnFinalizar = document.getElementById('btn-finalizar');
    const btnVolverInicio = document.getElementById('btn-volver-inicio');
    const formPago = document.getElementById('form-pago');
    const pagoTotalConsumoSpan = document.getElementById('pago-total-consumo');
    const inputsPago = {
        yape1: document.getElementById('pago-yape1'),
        yape2: document.getElementById('pago-yape2'),
        efectivo: document.getElementById('pago-efectivo'),
        tarjeta: document.getElementById('pago-tarjeta')
    };
    const totalPagadoSpan = document.getElementById('total-pagado');
    const vueltoSpan = document.getElementById('vuelto');
    const mensajeEstado = document.getElementById('mensaje-estado');

    // --- FUNCIONES ---
    function inicializarEstado() {
        NOMBRES_TIENDAS.forEach(nombreTienda => {
            estadoTiendas[nombreTienda] = {
                mesas: Array.from({ length: TOTAL_MESAS }, (_, i) => ({ 
                    id: i + 1, 
                    estado: 'disponible',
                    orden: [] 
                }))
            };
            const option = document.createElement('option');
            option.value = nombreTienda;
            option.textContent = nombreTienda;
            selectorTienda.appendChild(option);
        });
    }

    function iniciarFlujoCaja() {
        tiendaSeleccionada = selectorTienda.value;
        if (!tiendaSeleccionada) {
            alert('Por favor, selecciona una tienda para continuar.');
            return;
        }
        seccionTienda.classList.add('hidden');
        seccionTipoOrden.classList.remove('hidden');
    }

    function renderizarMesas() {
        const mesasDeTienda = estadoTiendas[tiendaSeleccionada].mesas;
        tituloSeccionMesas.textContent = `Mesas en ${tiendaSeleccionada}`;
        mesasGrid.innerHTML = '';
        mesasDeTienda.forEach(mesa => {
            const botonMesa = document.createElement('button');
            botonMesa.classList.add('btn-mesa', mesa.estado);
            botonMesa.textContent = `Mesa ${mesa.id}`;
            botonMesa.dataset.mesaId = mesa.id;
            mesasGrid.appendChild(botonMesa);
        });
    }

    function mostrarCaja() {
        let titulo = `Operando en: ${tiendaSeleccionada} | Orden: ${tipoDeOrden === 'llevar' ? 'Para Llevar' : 'Salón'}`;
        if (tipoDeOrden === 'salon') {
            titulo += ` | Mesa: ${mesaSeleccionada.id}`;
        }
        tituloOperacion.textContent = titulo;
        seccionTienda.classList.add('hidden');
        seccionTipoOrden.classList.add('hidden');
        seccionMesas.classList.add('hidden');
        cajaPrincipal.classList.remove('hidden');
        actualizarOrden();
    }

    function agregarProducto(nombre, precio) {
        const itemExistente = ordenActiva.find(item => item.nombre === nombre);
        if (itemExistente) {
            itemExistente.cantidad++;
        } else {
            ordenActiva.push({ nombre, precio, cantidad: 1 });
        }
        if (tipoDeOrden === 'salon') mesaSeleccionada.estado = 'en-proceso';
        actualizarOrden();
    }
    
    function actualizarOrden() {
        listaOrden.innerHTML = '';
        let total = 0;
        ordenActiva.forEach((item, index) => {
            const li = document.createElement('li');
            const subtotal = item.cantidad * item.precio;
            li.innerHTML = `
                <span class="item-nombre">${item.cantidad} x ${item.nombre}</span>
                <div class="item-controles">
                    <button class="btn-cantidad" data-index="${index}" data-action="decrease">-</button>
                    <button class="btn-cantidad" data-index="${index}" data-action="increase">+</button>
                </div>
                <span class="item-subtotal">S/ ${subtotal.toFixed(2)}</span>
            `;
            listaOrden.appendChild(li);
            total += subtotal;
        });
        totalConsumoSpan.textContent = total.toFixed(2);
    }

    function manejarCantidad(event) {
        const target = event.target;
        if (!target.classList.contains('btn-cantidad')) return;

        const index = parseInt(target.dataset.index, 10);
        const action = target.dataset.action;

        if (action === 'increase') {
            ordenActiva[index].cantidad++;
        } else if (action === 'decrease') {
            ordenActiva[index].cantidad--;
            if (ordenActiva[index].cantidad === 0) {
                ordenActiva.splice(index, 1);
            }
        }
        
        if (tipoDeOrden === 'salon' && ordenActiva.length === 0) {
            mesaSeleccionada.estado = 'disponible';
        }
        actualizarOrden();
    }

    function mostrarSeccionPago() {
        const total = parseFloat(totalConsumoSpan.textContent);
        if (ordenActiva.length === 0) {
            alert('No hay productos en la orden.');
            return;
        }
        pagoTotalConsumoSpan.textContent = total.toFixed(2);
        seccionVenta.classList.add('hidden');
        seccionPago.classList.remove('hidden');
        calcularVuelto();
    }

    function mostrarSeccionVenta() {
        seccionVenta.classList.remove('hidden');
        seccionPago.classList.add('hidden');
    }

    function calcularVuelto() {
        const totalConsumo = parseFloat(pagoTotalConsumoSpan.textContent);
        const pagoYape1 = parseFloat(inputsPago.yape1.value) || 0;
        const pagoYape2 = parseFloat(inputsPago.yape2.value) || 0;
        const pagoEfectivo = parseFloat(inputsPago.efectivo.value) || 0;
        const pagoTarjeta = parseFloat(inputsPago.tarjeta.value) || 0;
        const totalPagado = pagoYape1 + pagoYape2 + pagoEfectivo + pagoTarjeta;
        const vuelto = totalPagado - totalConsumo;
        totalPagadoSpan.textContent = totalPagado.toFixed(2);
        const vueltoSpanElem = vueltoSpan;
        vueltoSpanElem.textContent = vuelto.toFixed(2);
        vueltoSpanElem.classList.toggle('positivo', vuelto >= 0);
    }
    
    async function finalizarVenta(event) {
        event.preventDefault();
        btnFinalizar.disabled = true;
        btnFinalizar.textContent = 'Registrando...';
        
        const totalConsumo = parseFloat(pagoTotalConsumoSpan.textContent);
        const totalPagado = parseFloat(totalPagadoSpan.textContent);

        if (totalPagado < totalConsumo) {
            mostrarMensaje('El monto pagado es insuficiente.', 'error');
            btnFinalizar.disabled = false;
            btnFinalizar.textContent = 'Finalizar y Registrar Venta';
            return;
        }

        const ahora = new Date();
        const itemsString = ordenActiva.map(item => `${item.cantidad}x ${item.nombre}`).join(', ');

        const data = {
            Local: tiendaSeleccionada,
            'Tipo de Orden': tipoDeOrden === 'llevar' ? 'Para Llevar' : 'Salón',
            Mesa: mesaSeleccionada ? mesaSeleccionada.id : 'N/A',
            Fecha: ahora.toLocaleDateString('es-PE'),
            Hora: ahora.toLocaleTimeString('es-PE'),
            Items: itemsString,
            Total: totalConsumo.toFixed(2),
            'Pago Yape 1': (parseFloat(inputsPago.yape1.value) || 0).toFixed(2),
            'Pago Yape 2': (parseFloat(inputsPago.yape2.value) || 0).toFixed(2),
            'Pago Efectivo': (parseFloat(inputsPago.efectivo.value) || 0).toFixed(2),
            'Pago Tarjeta': (parseFloat(inputsPago.tarjeta.value) || 0).toFixed(2),
            'Total Pagado': totalPagado.toFixed(2),
            Vuelto: (parseFloat(vueltoSpan.textContent)).toFixed(2)
        };
        
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            console.log("Datos enviados a Google Sheets:", data);
            
            if (tipoDeOrden === 'salon') {
                mesaSeleccionada.estado = 'disponible';
                mesaSeleccionada.orden = [];
            }
            
            mostrarMensaje('Venta registrada con éxito.', 'exito');
            setTimeout(reiniciarParaSiguienteVenta, 2000);

        } catch (error) {
            console.error('Error al registrar la venta:', error);
            mostrarMensaje('Error al enviar. Revisa la conexión y la consola.', 'error');
            btnFinalizar.disabled = false;
            btnFinalizar.textContent = 'Finalizar y Registrar Venta';
        }
    }

    function reiniciarParaSiguienteVenta() {
        ordenActiva = [];
        mesaSeleccionada = null;
        formPago.reset();
        actualizarOrden();
        mensajeEstado.textContent = '';
        mensajeEstado.className = 'mensaje';
        btnFinalizar.disabled = false;
        btnFinalizar.textContent = 'Finalizar y Registrar Venta';
        
        seccionPago.classList.add('hidden');
        seccionVenta.classList.remove('hidden');
        cajaPrincipal.classList.add('hidden');
        seccionTipoOrden.classList.remove('hidden');
    }

    function volverAlInicio() {
        ordenActiva = [];
        tiendaSeleccionada = '';
        tipoDeOrden = '';
        mesaSeleccionada = null;
        
        cajaPrincipal.classList.add('hidden');
        seccionMesas.classList.add('hidden');
        seccionTipoOrden.classList.add('hidden');
        seccionTienda.classList.remove('hidden');
        selectorTienda.value = '';
    }
    
    function mostrarMensaje(texto, tipo) {
        mensajeEstado.textContent = texto;
        mensajeEstado.className = `mensaje ${tipo}`;
    }

    function cargarMenu() {
        menuItemsContainer.innerHTML = '';
        for (const [nombre, precio] of Object.entries(menu)) {
            const button = document.createElement('button');
            button.className = 'menu-item';
            button.innerHTML = `${nombre} <span class="price">S/ ${precio.toFixed(2)}</span>`;
            button.onclick = () => agregarProducto(nombre, precio);
            menuItemsContainer.appendChild(button);
        }
    }

    // --- EVENT LISTENERS ---
    btnConfirmarTienda.addEventListener('click', iniciarFlujoCaja);
    
    btnLlevar.addEventListener('click', () => {
        tipoDeOrden = 'llevar';
        mesaSeleccionada = null;
        ordenActiva = [];
        mostrarCaja();
    });

    btnSalon.addEventListener('click', () => {
        renderizarMesas();
        seccionTipoOrden.classList.add('hidden');
        seccionMesas.classList.remove('hidden');
    });

    mesasGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('btn-mesa')) {
            const mesaId = parseInt(target.dataset.mesaId, 10);
            tipoDeOrden = 'salon';
            mesaSeleccionada = estadoTiendas[tiendaSeleccionada].mesas.find(m => m.id === mesaId);
            ordenActiva = mesaSeleccionada.orden; 
            mostrarCaja();
        }
    });

    btnVolverTipoOrden.addEventListener('click', () => {
        seccionMesas.classList.add('hidden');
        seccionTipoOrden.classList.remove('hidden');
    });

    btnVolverInicio.addEventListener('click', volverAlInicio);
    btnVolverInicioTipo.addEventListener('click', volverAlInicio);

    listaOrden.addEventListener('click', manejarCantidad);
    btnCobrar.addEventListener('click', mostrarSeccionPago);
    btnVolver.addEventListener('click', mostrarSeccionVenta);
    formPago.addEventListener('submit', finalizarVenta);
    
    Object.values(inputsPago).forEach(input => {
        input.addEventListener('input', calcularVuelto);
    });

    // --- INICIALIZACIÓN ---
    inicializarEstado();
    cargarMenu();
});