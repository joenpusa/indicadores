import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Form, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, GeoJSON, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { CRS } from 'leaflet'; // Import CRS
import norteSantanderGeoJSON from '@/data/norte_santander.json';
import municipiosService from '@/services/municipiosService';
import indicadoresService from '@/services/indicadoresService';
import TableMunicipios from '@/modules/settings/municipios/TableMunicipios';
import TableIndicadores from '@/modules/settings/indicadores/TableIndicadores';

// Fix for default Leaflet icon issues in React (keeping this as it's a common Leaflet issue)
// ...

// Component to handle map view updates
const MapUpdater = ({ center, zoom, bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [20, 20] });
        } else if (center && zoom) {
            map.setView(center, zoom);
        }
    }, [center, zoom, bounds, map]);

    return null;
};

const NorteSantanderMap = ({ mapData = null, title = "Mapa de Norte de Santander", onFilterApplied }) => {
    // We remove the internal 'municipios' state because the TableMunicipios handles fetching now.
    // If we need data for other things (like stats), we might re-add it differently.

    // const [municipios, setMunicipios] = useState([]); // REMOVED
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedMunicipio, setSelectedMunicipio] = useState(null); // Active Map State
    const [selectedIndicador, setSelectedIndicador] = useState(null); // Active Map State

    // Calculate max value for heatmap scale
    const maxValue = React.useMemo(() => {
        if (!mapData) return 0;
        return Math.max(...Object.values(mapData));
    }, [mapData]);

    const getHeatmapColor = (value) => {
        if (!value) return '#FFEDA0'; // Base color (no data)
        const ratio = value / maxValue;
        // Simple interpolation from Light Yellow to Red
        // #FFEDA0 to #BD0026
        // Use discrete buckets for better visualization
        if (ratio > 0.8) return '#800026';
        if (ratio > 0.6) return '#BD0026';
        if (ratio > 0.4) return '#E31A1C';
        if (ratio > 0.2) return '#FC4E2A';
        if (ratio > 0) return '#FD8D3C';
        return '#FFEDA0';
    };

    // Pending Form State
    const [pendingMunicipio, setPendingMunicipio] = useState(null);
    const [pendingIndicador, setPendingIndicador] = useState(null);
    const [hoveredMunicipio, setHoveredMunicipio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapBounds, setMapBounds] = useState(null);

    const geoJsonLayer = useRef(null);

    useEffect(() => {
        // Only load GeoJSON
        setGeoJsonData(norteSantanderGeoJSON);
        setLoading(false);
    }, []);

    // State for additional filters
    const [pendingPeriodo, setPendingPeriodo] = useState('');
    const [pendingVariable, setPendingVariable] = useState('');

    // Available options
    const [availablePeriodos, setAvailablePeriodos] = useState([]);
    const [availableVariables, setAvailableVariables] = useState([]);

    // Actual Active Filters (for Summary)
    const [selectedPeriodoObj, setSelectedPeriodoObj] = useState(null);
    const [selectedVariableObj, setSelectedVariableObj] = useState(null);

    // Effect to set initial bounds once GeoJSON is loaded
    useEffect(() => {
        if (geoJsonData) {
            const layer = L.geoJSON(geoJsonData);
            setMapBounds(layer.getBounds());
        }
    }, [geoJsonData]);

    // Fetch periods and variables when pendingIndicador changes
    useEffect(() => {
        const fetchFilters = async () => {
            if (!pendingIndicador) {
                setAvailablePeriodos([]);
                setAvailableVariables([]);
                setPendingPeriodo('');
                setPendingVariable('');
                return;
            }

            try {
                // Fetch Periods
                const periodos = await indicadoresService.getPeriodosByIndicador(pendingIndicador.id_indicador);
                setAvailablePeriodos(periodos || []);

                // Fetch Variables (only numeric for filtering)
                const variables = await indicadoresService.getVariables(pendingIndicador.id_indicador);
                const numericVars = variables.filter(v => v.tipo === 'numero');
                setAvailableVariables(numericVars || []);
            } catch (error) {
                console.error("Error fetching filters:", error);
            }
        };

        fetchFilters();
    }, [pendingIndicador]);

    // Unified selection logic
    const handleSelectMunicipio = (value) => {
        if (!value || value === "todos") {
            setSelectedMunicipio(null);
            if (geoJsonData) {
                const layer = L.geoJSON(geoJsonData);
                setMapBounds(layer.getBounds());
            }
            return;
        }

        // Use the value as the ID since that's what we pass around
        setSelectedMunicipio(String(value));
        setPendingMunicipio(String(value)); // Sync pending state

        // Find feature to zoom
        const feature = geoJsonData?.features.find(f =>
            String(f.properties.id) === String(value)
        );

        if (feature) {
            const layer = L.geoJSON(feature);
            setMapBounds(layer.getBounds());
        }
    };

    // Helper to get name
    const getSelectedName = () => {
        if (!selectedMunicipio || !geoJsonData) return "";
        const feature = geoJsonData.features.find(f => String(f.properties.id) === String(selectedMunicipio));
        return feature?.properties?.name || selectedMunicipio;
    };

    const handleFilterChange = (e) => {
        handleSelectMunicipio(e.target.value);
    };

    const style = (feature) => {
        // Ensure comparison is safe string-to-string
        const isSelected = String(selectedMunicipio) === String(feature.properties.id);
        const isHovered = String(hoveredMunicipio) === String(feature.properties.id);

        let fillColor = '#4056A1'; // Default blueish (no data/mapData null)

        if (mapData && !isSelected && !isHovered) {
            // mapData keys assumed to be codigo_municipio (id)
            const val = mapData[String(feature.properties.id)];
            fillColor = getHeatmapColor(val);
        }

        // Priority override
        if (isSelected) fillColor = '#F13C20';
        else if (isHovered) fillColor = '#D79922';

        return {
            fillColor: fillColor,
            weight: isHovered || isSelected ? 3 : 1,
            opacity: 1,
            color: isHovered ? '#666' : 'white',
            dashArray: '3',
            fillOpacity: 0.8
        };
    };

    const onEachFeature = (feature, layer) => {
        // Tooltip logic for names
        if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
                direction: 'top',
                sticky: true,
                opacity: 0.9
            });
        }

        layer.on({
            mouseover: (e) => {
                setHoveredMunicipio(feature.properties.id);
                // e.target.bringToFront(); // Removed to prevent z-index issues with tooltip
            },
            mouseout: (e) => {
                setHoveredMunicipio(null);
            },
            click: (e) => {
                // Use the unified handler
                handleSelectMunicipio(feature.properties.id);
            }
        });
    };

    const onTableChange = (municipio) => {
        if (municipio) {
            // Only update pending state
            setPendingMunicipio(municipio.codigo_municipio || municipio.id);
        } else {
            setPendingMunicipio("todos");
        }
    };

    const handleApplyFilters = () => {
        // Confirm Municipio
        handleSelectMunicipio(pendingMunicipio);
        // Confirm Indicador
        setSelectedIndicador(pendingIndicador);

        // Update summary objects
        const pObj = availablePeriodos.find(p => String(p.id_periodo) === String(pendingPeriodo));
        setSelectedPeriodoObj(pObj || null);

        const vObj = availableVariables.find(v => String(v.id_variable) === String(pendingVariable));
        setSelectedVariableObj(vObj || null);


        if (onFilterApplied) {
            onFilterApplied({
                municipioId: pendingMunicipio,
                indicador: pendingIndicador,
                id_periodo: pendingPeriodo || null,
                id_variable: pendingVariable || null
            });
        }
    };

    const handleClearFilters = () => {
        // Reset all states
        setPendingMunicipio(null);
        setPendingIndicador(null);
        setSelectedIndicador(null);
        setPendingPeriodo('');
        setPendingVariable('');
        setSelectedPeriodoObj(null);
        setSelectedVariableObj(null);
        // Note: availablePeriodos/Variables are reset by effect when pendingIndicador becomes null
        handleSelectMunicipio("todos"); // Resets map bounds and active municipio

        if (onFilterApplied) {
            onFilterApplied({
                municipioId: null,
                indicador: null
            });
        }
    };

    const getPendingMunicipioObj = () => {
        if (!pendingMunicipio || pendingMunicipio === 'todos') return null;
        const feature = geoJsonData?.features.find(f => String(f.properties.id) === String(pendingMunicipio));
        return feature ? {
            id: pendingMunicipio,
            codigo_municipio: pendingMunicipio,
            nombre: feature.properties.name
        } : null;
    };

    if (loading) {
        return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
    }

    return (
        <Container className="my-5">
            <Row className="justify-content-center mb-4">
                <Col md={8} className="text-center">
                    <h2 className="mb-3">Mapa de Cobertura</h2>
                    <p className="text-muted">Explora nuestra presencia en los municipios de Norte de Santander</p>
                </Col>
            </Row>
            <Row>
                <Col md={4} className="mb-4 mb-md-0">
                    <Card className="h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Filtros</Card.Title>
                            <Form.Group className="row mb-3 gy-2">
                                <Col xs={12}>
                                    <TableMunicipios
                                        selectedMunicipio={getPendingMunicipioObj()}
                                        onMunicipioChange={onTableChange}
                                    />
                                </Col>
                                <Col xs={12}>
                                    <TableIndicadores
                                        selectedIndicador={pendingIndicador}
                                        onIndicadorChange={setPendingIndicador}
                                        onlyActive={true}
                                    />
                                </Col>

                                <Col xs={12}>
                                    <div className="form-floating">
                                        <Form.Select
                                            id="periodoSelect"
                                            value={pendingPeriodo}
                                            onChange={(e) => setPendingPeriodo(e.target.value)}
                                            disabled={!pendingIndicador || availablePeriodos.length === 0}
                                        >
                                            <option value="">Todos los periodos</option>
                                            {availablePeriodos.map(p => (
                                                <option key={p.id_periodo} value={p.id_periodo}>
                                                    {p.anio} {p.numero ? `- Periodo ${p.numero}` : ''} ({p.tipo})
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <label htmlFor="periodoSelect">Periodo</label>
                                    </div>
                                </Col>

                                <Col xs={12}>
                                    <div className="form-floating">
                                        <Form.Select
                                            id="variableSelect"
                                            value={pendingVariable}
                                            onChange={(e) => setPendingVariable(e.target.value)}
                                            disabled={!pendingIndicador || availableVariables.length === 0}
                                        >
                                            <option value="">Todas las variables (numéricas)</option>
                                            {availableVariables.map(v => (
                                                <option key={v.id_variable} value={v.id_variable}>
                                                    {v.nombre} ({v.unidad})
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <label htmlFor="variableSelect">Variable Numérica</label>
                                    </div>
                                </Col>
                                <Col xs={12}>
                                    <Button
                                        variant="primary"
                                        className="w-100"
                                        onClick={handleApplyFilters}
                                    >
                                        Aplicar Filtros
                                    </Button>
                                </Col>
                            </Form.Group>

                            {/* Summary Section */}
                            {(selectedMunicipio || selectedIndicador) && (
                                <div className="mt-3 mb-3">
                                    <h6 className="text-muted small text-uppercase fw-bold mb-2">Filtros Activos:</h6>
                                    <div className="d-flex flex-column gap-1">
                                        {selectedMunicipio && (
                                            <Alert variant="info" className="py-2 mb-0 small">
                                                Municipio: <strong>{getSelectedName()}</strong>
                                            </Alert>
                                        )}
                                        {selectedIndicador && (
                                            <Alert variant="success" className="py-2 mb-0 small">
                                                Indicador: <strong>{selectedIndicador.nombre}</strong>
                                            </Alert>
                                        )}
                                        {selectedPeriodoObj && (
                                            <Alert variant="warning" className="py-2 mb-0 small">
                                                Periodo: <strong>{selectedPeriodoObj.anio} {selectedPeriodoObj.numero ? `- ${selectedPeriodoObj.numero}` : ''}</strong>
                                            </Alert>
                                        )}
                                        {selectedVariableObj && (
                                            <Alert variant="secondary" className="py-2 mb-0 small">
                                                Var: <strong>{selectedVariableObj.nombre}</strong>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedMunicipio && (
                                <div className="mt-4">
                                    <Button variant="outline-primary" onClick={handleClearFilters} size="sm">
                                        Limpiar filtros
                                    </Button>
                                </div>
                            )}

                            {/* Legend */}
                            {mapData && (
                                <div className="mt-3">
                                    <h6 className="text-muted small fw-bold mb-2">Escala de Valores</h6>
                                    <div className="d-flex align-items-center justify-content-between small">
                                        <div className="d-flex align-items-center"><span className="d-inline-block me-1" style={{ width: 12, height: 12, background: '#FFEDA0' }}></span> 0</div>
                                        <div className="d-flex align-items-center"><span className="d-inline-block me-1" style={{ width: 12, height: 12, background: '#FD8D3C' }}></span> Baja</div>
                                        <div className="d-flex align-items-center"><span className="d-inline-block me-1" style={{ width: 12, height: 12, background: '#E31A1C' }}></span> Media</div>
                                        <div className="d-flex align-items-center"><span className="d-inline-block me-1" style={{ width: 12, height: 12, background: '#800026' }}></span> Alta</div>
                                    </div>
                                </div>
                            )}

                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="shadow-sm border-0 overflow-hidden" style={{ height: '700px' }}>
                        <MapContainer
                            crs={CRS.Simple}
                            bounds={mapBounds}
                            zoom={8}
                            center={[0, 0]}
                            style={{ height: '100%', width: '100%', background: 'white' }}
                            scrollWheelZoom={false}
                            zoomControl={false}
                            doubleClickZoom={false}
                            dragging={true}
                            attributionControl={false}
                            minZoom={-10}
                        >
                            {geoJsonData && (
                                <GeoJSON
                                    ref={geoJsonLayer}
                                    data={geoJsonData}
                                    style={style}
                                    onEachFeature={onEachFeature}
                                />
                            )}
                            <MapUpdater bounds={mapBounds} />
                        </MapContainer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default NorteSantanderMap;
