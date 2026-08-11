import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Button, Form, FloatingLabel } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FaDownload, FaFilter } from 'react-icons/fa';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#e57373', '#ba68c8', '#4db6ac', '#fff176'];

const DashboardCharts = ({ dashboardData }) => {
    if (!dashboardData) return null;

    const isDetallada = dashboardData.fuente_datos === 'detallada';

    // ==========================================
    // MODO AGRUPADO (Estándar)
    // ==========================================
    if (!isDetallada) {
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
            <div className="mt-5">
                <h3 className="text-center mb-4">Análisis por Dimensiones</h3>
                <Row xs={1} className="g-4">
                    {charts.map((chart, idx) => (
                        <Col key={chart.dimensionId}>
                            <Card className="h-100 shadow-sm border-0">
                                <Card.Header className="bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
                                    <h5 className="text-primary mb-0">{chart.dimensionName}</h5>
                                    <Button variant="outline-secondary" size="sm" onClick={() => downloadCSV(chart.dimensionName, chart.data)}>
                                        <FaDownload className="me-2" /> Descargar Data
                                    </Button>
                                </Card.Header>
                                <Card.Body style={{ height: '400px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chart.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Legend />
                                            <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                                                {chart.data.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
    }

    // ==========================================
    // MODO DETALLADO (Pivot Interactivo)
    // ==========================================
    return <InteractivePivotChart dashboardData={dashboardData} />;
};

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
    const [chartType, setChartType] = useState('stacked'); // 'stacked' | 'grouped'

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

        // Convert to array and sort by total descending (or alphabetically if needed)
        const result = Array.from(map.values()).map(item => {
            // calculate a row total for sorting
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
        <div className="mt-5">
            <h3 className="text-center mb-4">Graficador Interactivo (Microdatos)</h3>
            
            <Card className="shadow-sm border-0 mb-4 bg-light">
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

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white border-bottom-0 pt-3 d-flex justify-content-between align-items-center">
                    <h5 className="text-primary mb-0 d-flex align-items-center gap-2">
                        <FaFilter /> Resultados Cruzados
                    </h5>
                    <Button variant="outline-secondary" size="sm" onClick={downloadCSV}>
                        <FaDownload className="me-2" /> Descargar CSV
                    </Button>
                </Card.Header>
                <Card.Body style={{ height: '500px' }}>
                    {chartData.length === 0 ? (
                        <div className="text-center text-muted h-100 d-flex align-items-center justify-content-center">
                            No hay datos para graficar con estos filtros.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
                                <YAxis />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="top" height={36} />
                                {groupKeys.map((key, index) => (
                                    <Bar 
                                        key={key} 
                                        dataKey={key} 
                                        name={key} 
                                        stackId={chartType === 'stacked' ? 'a' : undefined} 
                                        fill={COLORS[index % COLORS.length]} 
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
