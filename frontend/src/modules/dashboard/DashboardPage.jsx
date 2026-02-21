import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Building, Activity, Info, BarChart2 } from 'lucide-react';
import dashboardService from '@/services/dashboardService';

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#0dcaf0', '#d63384', '#6f42c1', '#fd7e14', '#20c997', '#6610f2'];

const DashboardPage = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getMetrics();
                setMetrics(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching dashboard metrics:", err);
                setError("Error al cargar las métricas. Por favor intente nuevamente más tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    return (
        <div className="dashboard-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Bienvenido, {user?.nombre || 'Usuario'}</h2>
            </div>

            <Alert variant="info" className="mb-4 d-flex align-items-start shadow-sm border-info rounded">
                <Info size={24} className="me-3 mt-1 text-info flex-shrink-0" />
                <div>
                    <h5 className="alert-heading text-info fw-bold">Panel Principal de Administración</h5>
                    <p className="mb-1 text-secondary">
                        En esta zona encontrará las principales funcionalidades del sistema. Podrá gestionar Secretarías, Indicadores, Zonas y Usuarios.
                    </p>
                    <p className="mb-0 text-secondary">
                        <strong>Nota:</strong> Cada módulo tiene sus propias gestiones de ayuda y opciones para facilitarle el trabajo continuo.
                    </p>
                </div>
            </Alert>

            {loading && (
                <div className="d-flex justify-content-center my-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            )}

            {error && (
                <Alert variant="danger">{error}</Alert>
            )}

            {!loading && !error && metrics && (
                <>
                    <Row className="mb-4">
                        <Col md={4} lg={4}>
                            <Card className="h-100 shadow-sm border-0 border-start border-primary border-4">
                                <Card.Body className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-4">
                                        <Users size={32} className="text-primary" />
                                    </div>
                                    <div>
                                        <h6 className="text-muted text-uppercase mb-1">Total de Usuarios</h6>
                                        <h2 className="mb-0 fw-bold">{metrics.totalUsuarios}</h2>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} lg={4}>
                            <Card className="h-100 shadow-sm border-0 border-start border-success border-4">
                                <Card.Body className="d-flex align-items-center">
                                    <div className="rounded-circle bg-success bg-opacity-10 p-3 me-4">
                                        <Building size={32} className="text-success" />
                                    </div>
                                    <div>
                                        <h6 className="text-muted text-uppercase mb-1">Secretarías Activas</h6>
                                        <h2 className="mb-0 fw-bold">{metrics.totalSecretariasActivas}</h2>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4} lg={4}>
                            <Card className="h-100 shadow-sm border-0 border-start border-warning border-4">
                                <Card.Body className="d-flex align-items-center">
                                    <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-4">
                                        <BarChart2 size={32} className="text-warning" />
                                    </div>
                                    <div>
                                        <h6 className="text-muted text-uppercase mb-1">Total Indicadores</h6>
                                        <h2 className="mb-0 fw-bold">{metrics.totalIndicadores}</h2>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={7} className="mb-4 mb-md-0">
                            <Card className="shadow-sm border-0 h-100">
                                <Card.Header className="bg-white border-bottom-0 pt-4 pb-0">
                                    <h5 className="mb-0 fw-bold d-flex align-items-center">
                                        <Activity size={20} className="me-2 text-primary" />
                                        Indicadores por Secretaría
                                    </h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <Table hover className="align-middle border rounded overflow-hidden mb-0">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th>Secretaría</th>
                                                    <th className="text-center" style={{ width: '120px' }}>Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metrics.indicadoresPorSecretaria?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="d-flex align-items-center text-wrap">
                                                                <span
                                                                    className="d-inline-block rounded-circle me-3 flex-shrink-0"
                                                                    style={{ width: '12px', height: '12px', backgroundColor: COLORS[index % COLORS.length] }}
                                                                ></span>
                                                                <span style={{ fontSize: '0.95rem' }}>{item.secretaria}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center fw-bold text-secondary">
                                                            {item.total_indicadores}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!metrics.indicadoresPorSecretaria || metrics.indicadoresPorSecretaria.length === 0) && (
                                                    <tr>
                                                        <td colSpan="2" className="text-center text-muted py-4">No hay datos disponibles</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={5}>
                            <Card className="shadow-sm border-0 h-100">
                                <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 text-center">
                                    <h5 className="mb-0 fw-bold">
                                        Distribución de indicadores por secretaria
                                    </h5>
                                </Card.Header>
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    <div style={{ height: '350px', width: '100%' }}>
                                        {metrics.indicadoresPorSecretaria && metrics.indicadoresPorSecretaria.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={metrics.indicadoresPorSecretaria}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={120}
                                                        fill="#8884d8"
                                                        paddingAngle={3}
                                                        dataKey="total_indicadores"
                                                        nameKey="secretaria"
                                                    >
                                                        {metrics.indicadoresPorSecretaria.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                                                No hay datos visuales para mostrar.
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </div>
    );
};

export default DashboardPage;
