import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Form, FloatingLabel, Table, Badge, ButtonGroup, Nav } from 'react-bootstrap';
import { 
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { FaDownload, FaFilter, FaTable, FaChartBar, FaChartLine, FaLayerGroup, FaFileExcel, FaInfoCircle } from 'react-icons/fa';

// Paleta de colores armónica inspirada en Excel y diseño ejecutivo
const PALETTE = [
    '#2563eb', // Azul fuerte (Área sembrada)
    '#ea580c', // Naranja cálido (Área cosechada)
    '#64748b', // Gris azulado pizarra (Producción)
    '#10b981', // Verde esmeralda
    '#8b5cf6', // Violeta
    '#06b6d4', // Cian
    '#ec4899', // Rosa
    '#eab308'  // Amarillo ámbar
];

// Formateador de números (estilo Colombia / español con separador de miles '.' y decimal ',')
const formatNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    const num = Number(val);
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(num);
};

const DashboardCharts = ({ dashboardData, charts: legacyChartsProp }) => {
    // Si viene por prop legacy desde LandingPage
    const chartsData = dashboardData || (legacyChartsProp ? { charts: legacyChartsProp } : null);
    if (!chartsData) return null;

    const isDetallada = chartsData.fuente_datos === 'detallada';

    // Si es fuente de datos detallada (microdatos)
    if (isDetallada) {
        return <InteractivePivotChart dashboardData={chartsData} />;
    }

    // Modo Excel-Agrupado con Series y Tabla
    if (chartsData.series && chartsData.series.length > 0 && chartsData.table) {
        return <ExcelDashboardView dashboardData={chartsData} />;
    }

    // Modo Legacy: Gráficos individuales por dimensión
    return <LegacyChartsView dashboardData={chartsData} />;
};

/**
 * =========================================================================
 * VISTA TIPO EXCEL: Gráfico Multi-Series + Tabla de Datos Integrada
 * =========================================================================
 */
const ExcelDashboardView = ({ dashboardData }) => {
    const { 
        series = [], 
        table = { columns: [], rows: [] }, 
        variables = [], 
        municipiosBreakdown = null,
        agrupado_municipios = true,
        modo_periodos = 'ninguno'
    } = dashboardData;

    // Estado para tipo de gráfico: 'grouped' (barras agrupadas) | 'stacked' (apiladas) | 'lines' (líneas)
    const [chartMode, setChartMode] = useState('grouped');
    
    // Estado para visibilidad de series (ocultar/mostrar variables)
    const [hiddenSeries, setHiddenSeries] = useState(new Set());

    // Estado para municipio activo si no está agrupado por municipios
    const [selectedMunIdx, setSelectedMunIdx] = useState(0);

    // Lista de variables numéricas a graficar
    const activeVariables = useMemo(() => {
        if (variables && variables.length > 0) {
            return variables.map(v => ({
                key: v.nombre,
                name: v.nombre,
                unidad: v.unidad || '',
                label: `Suma de ${v.nombre}${v.unidad ? ` (${v.unidad})` : ''}`
            }));
        }
        // Extraer de las filas de la tabla si no están en variables
        return (table.rows || []).map(r => ({
            key: r.nombre,
            name: r.nombre,
            unidad: r.unidad || '',
            label: r.displayName || r.nombre
        }));
    }, [variables, table]);

    // Data activa para el gráfico y la tabla (considerando desagregación por municipio si aplica)
    const currentData = useMemo(() => {
        if (!agrupado_municipios && municipiosBreakdown && municipiosBreakdown.length > 0) {
            const mun = municipiosBreakdown[selectedMunIdx] || municipiosBreakdown[0];
            return {
                series: mun.series || [],
                table: mun.table || { columns: [], rows: [] },
                municipioNombre: mun.nombre
            };
        }
        return {
            series,
            table,
            municipioNombre: 'Consolidado Departamental'
        };
    }, [agrupado_municipios, municipiosBreakdown, selectedMunIdx, series, table]);

    // Toggle para ocultar/mostrar una serie
    const toggleSeries = (key) => {
        setHiddenSeries(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Exportar tabla a archivo CSV compatible con Excel
    const handleDownloadCSV = () => {
        const columns = currentData.table.columns || [];
        const rows = currentData.table.rows || [];
        if (rows.length === 0) return;

        const headers = ['Variable', ...columns, 'Total Consolidado'];
        const csvRows = [
            headers.join(','),
            ...rows.map(r => {
                const rowVals = [
                    `"${(r.displayName || r.nombre).replace(/"/g, '""')}"`,
                    ...columns.map(col => r.values[col] !== undefined ? r.values[col] : 0),
                    r.total !== undefined ? r.total : 0
                ];
                return rowVals.join(',');
            })
        ];

        const csvContent = '\uFEFF' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `datos_indicador_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="excel-dashboard-container">
            {/* Si está desglosado por municipio, mostramos selector de municipio */}
            {!agrupado_municipios && municipiosBreakdown && municipiosBreakdown.length > 1 && (
                <div className="mb-4 p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="small fw-bold text-secondary">
                            Mostrando datos individuales por municipio:
                        </span>
                        <Badge bg="info" className="px-2 py-1">
                            {municipiosBreakdown.length} Municipios disponibles
                        </Badge>
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                        {municipiosBreakdown.map((m, idx) => (
                            <Button
                                key={m.id_municipio || idx}
                                variant={selectedMunIdx === idx ? 'primary' : 'outline-secondary'}
                                size="sm"
                                className="px-3 py-1 text-truncate"
                                onClick={() => setSelectedMunIdx(idx)}
                                style={{ maxWidth: '160px' }}
                            >
                                {m.nombre}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* BARRA SUPERIOR DE HERRAMIENTAS DEL GRÁFICO */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
                <div className="d-flex align-items-center gap-2">
                    <ButtonGroup size="sm">
                        <Button 
                            variant={chartMode === 'grouped' ? 'primary' : 'outline-secondary'} 
                            onClick={() => setChartMode('grouped')}
                            title="Barras agrupadas (estilo Excel)"
                            className="d-flex align-items-center gap-1"
                        >
                            <FaChartBar size={13} /> Agrupado
                        </Button>
                        <Button 
                            variant={chartMode === 'stacked' ? 'primary' : 'outline-secondary'} 
                            onClick={() => setChartMode('stacked')}
                            title="Barras apiladas (acumulado)"
                            className="d-flex align-items-center gap-1"
                        >
                            <FaLayerGroup size={13} /> Apilado
                        </Button>
                        <Button 
                            variant={chartMode === 'lines' ? 'primary' : 'outline-secondary'} 
                            onClick={() => setChartMode('lines')}
                            title="Líneas de tendencia"
                            className="d-flex align-items-center gap-1"
                        >
                            <FaChartLine size={13} /> Tendencia
                        </Button>
                    </ButtonGroup>

                    <span className="text-muted small ms-2 border-start ps-2">
                        {modo_periodos === 'anio' ? 'Agrupado por Año' : modo_periodos === 'todos' ? 'Total Periodos' : 'Detallado'}
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Button 
                        variant="outline-success" 
                        size="sm" 
                        onClick={handleDownloadCSV}
                        className="d-flex align-items-center gap-1 shadow-sm"
                        title="Exportar tabla completa a Excel/CSV"
                    >
                        <FaFileExcel className="text-success" /> Descargar CSV
                    </Button>
                </div>
            </div>

            {/* CHIPS DE SERIES / VARIABLES ACTIVAS */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="small text-muted me-1">Series:</span>
                {activeVariables.map((v, idx) => {
                    const color = PALETTE[idx % PALETTE.length];
                    const isHidden = hiddenSeries.has(v.key);
                    return (
                        <Badge
                            key={v.key}
                            bg={isHidden ? 'light' : 'white'}
                            text={isHidden ? 'muted' : 'dark'}
                            className={`border px-3 py-2 cursor-pointer shadow-sm d-flex align-items-center gap-2 ${isHidden ? 'opacity-50 text-decoration-line-through' : ''}`}
                            style={{ 
                                cursor: 'pointer',
                                borderColor: isHidden ? '#dee2e6' : color,
                                borderLeftWidth: '4px'
                            }}
                            onClick={() => toggleSeries(v.key)}
                            title={`Clic para ${isHidden ? 'mostrar' : 'ocultar'} ${v.label}`}
                        >
                            <span 
                                className="rounded-circle d-inline-block" 
                                style={{ width: '10px', height: '10px', backgroundColor: isHidden ? '#ccc' : color }} 
                            />
                            <span>{v.label}</span>
                        </Badge>
                    );
                })}
            </div>

            {/* CONTENEDOR DEL GRÁFICO */}
            <Card className="shadow-sm border-0 mb-4 bg-white rounded-3 overflow-hidden">
                <Card.Body className="p-3" style={{ height: '420px' }}>
                    {currentData.series.length === 0 ? (
                        <div className="text-center text-muted h-100 d-flex flex-column align-items-center justify-content-center">
                            <FaInfoCircle className="fs-2 mb-2 text-secondary opacity-50" />
                            <p className="mb-0">No se encontraron datos registrados para los filtros seleccionados.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {chartMode === 'lines' ? (
                                <LineChart data={currentData.series} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 500 }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#4a5568', fontSize: 12 }}
                                        tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                                    />
                                    <Tooltip 
                                        formatter={(val, name) => [formatNumber(val), name]}
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    {activeVariables.map((v, idx) => {
                                        if (hiddenSeries.has(v.key)) return null;
                                        const color = PALETTE[idx % PALETTE.length];
                                        return (
                                            <Line
                                                key={v.key}
                                                type="monotone"
                                                dataKey={v.key}
                                                name={v.label}
                                                stroke={color}
                                                strokeWidth={3}
                                                dot={{ r: 5, fill: color }}
                                                activeDot={{ r: 7 }}
                                            />
                                        );
                                    })}
                                </LineChart>
                            ) : (
                                <BarChart data={currentData.series} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 500 }}
                                        tickLine={{ stroke: '#cbd5e1' }}
                                    />
                                    <YAxis 
                                        tick={{ fill: '#4a5568', fontSize: 12 }}
                                        tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                                    />
                                    <Tooltip 
                                        formatter={(val, name) => [formatNumber(val), name]}
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    {activeVariables.map((v, idx) => {
                                        if (hiddenSeries.has(v.key)) return null;
                                        const color = PALETTE[idx % PALETTE.length];
                                        return (
                                            <Bar
                                                key={v.key}
                                                dataKey={v.key}
                                                name={v.label}
                                                stackId={chartMode === 'stacked' ? 'a' : undefined}
                                                fill={color}
                                                radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                                            />
                                        );
                                    })}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </Card.Body>
            </Card>

            {/* =========================================================
                TABLA DE DATOS INTEGRADA (ESTILO EXACTO DE EXCEL)
               ========================================================= */}
            {currentData.table.rows && currentData.table.rows.length > 0 && (
                <Card className="shadow-sm border-0 bg-white rounded-3 overflow-hidden">
                    <Card.Header className="bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-dark small d-flex align-items-center gap-2">
                            <FaTable className="text-primary" /> Tabla de Datos Agrupados
                        </span>
                        <span className="badge bg-secondary-subtle text-secondary fw-normal">
                            {currentData.table.columns.length} Periodos analizados
                        </span>
                    </Card.Header>

                    <div className="table-responsive">
                        <Table hover bordered size="sm" className="mb-0 text-nowrap align-middle" style={{ fontSize: '0.875rem' }}>
                            <thead className="table-light">
                                <tr>
                                    <th className="py-2 px-3 text-secondary" style={{ minWidth: '220px' }}>
                                        Variable
                                    </th>
                                    {currentData.table.columns.map(col => (
                                        <th key={col} className="text-center py-2 px-2 text-dark font-monospace fw-semibold" style={{ minWidth: '95px' }}>
                                            {col}
                                        </th>
                                    ))}
                                    <th className="text-end py-2 px-3 bg-secondary bg-opacity-10 text-dark fw-bold" style={{ minWidth: '120px' }}>
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.table.rows.map((row, idx) => {
                                    const color = PALETTE[idx % PALETTE.length];
                                    return (
                                        <tr key={row.id_variable || idx}>
                                            <td className="py-2 px-3 fw-medium text-dark">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span 
                                                        className="rounded-circle d-inline-block flex-shrink-0" 
                                                        style={{ width: '9px', height: '9px', backgroundColor: color }} 
                                                    />
                                                    <span>{row.displayName || row.nombre}</span>
                                                </div>
                                            </td>
                                            {currentData.table.columns.map(col => {
                                                const val = row.values[col];
                                                return (
                                                    <td key={col} className="text-center py-2 px-2 font-monospace text-secondary">
                                                        {val !== undefined ? formatNumber(val) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td className="text-end py-2 px-3 font-monospace fw-bold text-dark bg-secondary bg-opacity-10">
                                                {formatNumber(row.total)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    );
};

/**
 * =========================================================================
 * VISTA LEGACY: Dimensiones Estándar (Compatible con LandingPage)
 * =========================================================================
 */
const LegacyChartsView = ({ dashboardData }) => {
    const charts = dashboardData.charts || [];
    if (charts.length === 0) {
        return <div className="text-center text-muted my-5">No hay gráficas disponibles.</div>;
    }

    const downloadCSV = (dimensionName, data) => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                let cell = row[h];
                if (typeof cell === 'string') {
                    cell = cell.replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                }
                return cell;
            }).join(','))
        ].join('\n');
        const blob = new Blob(["\uFEFF" + csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${dimensionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_datos.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-4">
            <h4 className="mb-4 text-dark fw-bold">Análisis por Dimensiones</h4>
            <Row xs={1} className="g-4">
                {charts.map((chart, idx) => (
                    <Col key={chart.dimensionId || idx}>
                        <Card className="h-100 shadow-sm border-0 rounded-3">
                            <Card.Header className="bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
                                <h5 className="text-primary mb-0">{chart.dimensionName}</h5>
                                <Button variant="outline-secondary" size="sm" onClick={() => downloadCSV(chart.dimensionName, chart.data)}>
                                    <FaDownload className="me-2" /> Descargar Data
                                </Button>
                            </Card.Header>
                            <Card.Body style={{ height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chart.data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                                        <Tooltip 
                                            formatter={(val) => [formatNumber(val), 'Valor']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                        />
                                        <Legend />
                                        <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                                            {chart.data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

/**
 * =========================================================================
 * VISTA MICRODATOS (Pivot Interactivo)
 * =========================================================================
 */
const InteractivePivotChart = ({ dashboardData }) => {
    const { flatData = [], variables = [] } = dashboardData;

    const textVars = variables.filter(v => v.tipo === 'texto').map(v => v.nombre);
    const numVars = variables.filter(v => v.tipo === 'numero').map(v => v.nombre);

    const xOptions = ['municipio', 'periodo', ...textVars];
    const groupOptions = ['none', 'municipio', 'periodo', ...textVars];
    const yOptions = ['count', ...numVars];

    const [xAxis, setXAxis] = useState('municipio');
    const [groupBy, setGroupBy] = useState('none');
    const [yAxis, setYAxis] = useState('count');
    const [chartType, setChartType] = useState('stacked');

    const { chartData, groupKeys } = useMemo(() => {
        if (!flatData || flatData.length === 0) return { chartData: [], groupKeys: [] };

        const map = new Map();
        const keysSet = new Set();

        for (const row of flatData) {
            const xVal = row[xAxis] || 'Desconocido';
            
            if (!map.has(xVal)) {
                map.set(xVal, { name: xVal });
            }
            const agg = map.get(xVal);

            const yVal = yAxis === 'count' ? 1 : (Number(row[yAxis]) || 0);

            if (groupBy === 'none' || groupBy === xAxis) {
                agg['Total'] = (agg['Total'] || 0) + yVal;
                keysSet.add('Total');
            } else {
                const gVal = row[groupBy] || 'Desconocido';
                agg[gVal] = (agg[gVal] || 0) + yVal;
                keysSet.add(gVal);
            }
        }

        const result = Array.from(map.values()).map(item => {
            const total = Array.from(keysSet).reduce((sum, k) => sum + (item[k] || 0), 0);
            return { ...item, _rowTotal: total };
        }).sort((a, b) => b._rowTotal - a._rowTotal);

        return { chartData: result, groupKeys: Array.from(keysSet) };
    }, [flatData, xAxis, groupBy, yAxis]);

    const downloadCSV = () => {
        if (!chartData || chartData.length === 0) return;
        const headers = ['Nombre', ...groupKeys];
        const csvRows = [
            headers.join(','),
            ...chartData.map(row => headers.map(h => {
                let cell = row[h === 'Nombre' ? 'name' : h] ?? 0;
                if (typeof cell === 'string') {
                    cell = cell.replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                }
                return cell;
            }).join(','))
        ].join('\n');
        const blob = new Blob(["\uFEFF" + csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `grafico_interactivo.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-4">
            <h4 className="text-dark fw-bold mb-4">Graficador Interactivo (Microdatos)</h4>
            
            <Card className="shadow-sm border-0 mb-4 bg-light rounded-3">
                <Card.Body>
                    <Row className="g-3 align-items-center">
                        <Col md={3}>
                            <FloatingLabel label="Eje X (Filas)">
                                <Form.Select value={xAxis} onChange={e => setXAxis(e.target.value)}>
                                    {xOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                </Form.Select>
                            </FloatingLabel>
                        </Col>
                        <Col md={3}>
                            <FloatingLabel label="Agrupar por (Color)">
                                <Form.Select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                                    <option value="none">Sin agrupar</option>
                                    {xOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                </Form.Select>
                            </FloatingLabel>
                        </Col>
                        <Col md={3}>
                            <FloatingLabel label="Valor (Eje Y)">
                                <Form.Select value={yAxis} onChange={e => setYAxis(e.target.value)}>
                                    <option value="count">Conteo de Registros</option>
                                    {numVars.map(opt => <option key={opt} value={opt}>Suma de {opt.toUpperCase()}</option>)}
                                </Form.Select>
                            </FloatingLabel>
                        </Col>
                        <Col md={3}>
                            <FloatingLabel label="Tipo de Gráfico">
                                <Form.Select value={chartType} onChange={e => setChartType(e.target.value)}>
                                    <option value="stacked">Apilado (Stacked)</option>
                                    <option value="grouped">Agrupado (Grouped)</option>
                                </Form.Select>
                            </FloatingLabel>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0 rounded-3">
                <Card.Header className="bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
                    <h5 className="text-primary mb-0 d-flex align-items-center gap-2">
                        <FaFilter /> Resultados Cruzados
                    </h5>
                    <Button variant="outline-secondary" size="sm" onClick={downloadCSV}>
                        <FaDownload className="me-2" /> Descargar CSV
                    </Button>
                </Card.Header>
                <Card.Body style={{ height: '480px' }}>
                    {chartData.length === 0 ? (
                        <div className="text-center text-muted h-100 d-flex align-items-center justify-content-center">
                            No hay datos para graficar con estos filtros.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                                <YAxis tickFormatter={val => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                                <Tooltip 
                                    formatter={val => [formatNumber(val), 'Total']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                />
                                <Legend verticalAlign="top" height={36} />
                                {groupKeys.map((key, index) => (
                                    <Bar 
                                        key={key} 
                                        dataKey={key} 
                                        name={key} 
                                        stackId={chartType === 'stacked' ? 'a' : undefined} 
                                        fill={PALETTE[index % PALETTE.length]} 
                                        radius={chartType === 'stacked' ? [0,0,0,0] : [4, 4, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default DashboardCharts;
