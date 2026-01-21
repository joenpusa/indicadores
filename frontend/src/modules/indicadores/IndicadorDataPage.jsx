import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Table, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaTable } from 'react-icons/fa';
import indicadoresService from '../../services/indicadoresService';

const IndicadorDataPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [indicador, setIndicador] = useState(null);
    const [variables, setVariables] = useState([]);
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [indData, varsData, regsData] = await Promise.all([
                indicadoresService.getById(id),
                indicadoresService.getVariables(id),
                indicadoresService.getRegistros(id) // Now returns list with values
            ]);
            setIndicador(indData);
            setVariables(varsData);
            setRegistros(regsData);
        } catch (error) {
            console.error("Error loading data", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format Period Name
    const formatPeriodo = (r) => {
        if (r.tipo === 'anual') return r.anio;
        if (r.tipo === 'mensual') return `${r.anio}-${String(r.numero).padStart(2, '0')}`;
        if (r.tipo === 'semestral') return `${r.anio}-S${r.numero}`;
        if (r.tipo === 'trimestral') return `${r.anio}-T${r.numero}`;
        return `${r.anio} ${r.numero ? r.numero : ''}`;
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (!indicador) return <Alert variant="warning" className="m-4">Indicador no encontrado</Alert>;

    return (
        <div className="container-fluid">
            <div className="d-flex align-items-center mb-4">
                <Button variant="link" className="p-0 me-3 text-secondary" onClick={() => navigate('/dashboard/indicadores')}>
                    <FaArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="mb-0">{indicador.nombre}</h2>
                    <small className="text-muted">Visualización de Datos</small>
                </div>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0"><FaTable className="me-2 text-primary" />Registros Cargados ({registros.length})</h5>
                        <Button variant="outline-success" size="sm" onClick={() => navigate(`/dashboard/indicadores/${id}/carga`)}>
                            Cargar Nuevos Datos
                        </Button>
                    </div>

                    <div className="table-responsive">
                        <Table hover striped bordered size="sm">
                            <thead className="table-light">
                                <tr>
                                    <th>Periodo</th>
                                    <th>Cod. Municipio</th>
                                    <th>Municipio</th>
                                    {variables.map(v => (
                                        <th key={v.id_variable}>{v.nombre} <small className="text-muted fw-normal">({v.unidad})</small></th>
                                    ))}
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registros.length > 0 ? (
                                    registros.map((row) => (
                                        <tr key={row.id_registro}>
                                            <td className="fw-bold text-nowrap">{formatPeriodo(row)}</td>
                                            <td>{row.codigo_municipio}</td>
                                            <td>{row.nombre_municipio}</td>
                                            {variables.map(v => (
                                                <td key={v.id_variable}>{row.valores ? row.valores[v.id_variable] : '-'}</td>
                                            ))}
                                            <td className="small text-muted">{row.descripcion}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4 + variables.length} className="text-center py-4 text-muted">
                                            No hay registros cargados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default IndicadorDataPage;
