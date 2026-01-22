import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Form, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, GeoJSON, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { CRS } from 'leaflet'; // Import CRS
import norteSantanderGeoJSON from '@/data/norte_santander.json';
import municipiosService from '@/services/municipiosService';
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

const NorteSantanderMap = () => {
    // We remove the internal 'municipios' state because the TableMunicipios handles fetching now.
    // If we need data for other things (like stats), we might re-add it differently.

    // const [municipios, setMunicipios] = useState([]); // REMOVED
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedMunicipio, setSelectedMunicipio] = useState(null); // Active Map State
    const [selectedIndicador, setSelectedIndicador] = useState(null); // Active Map State

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

    // Effect to set initial bounds once GeoJSON is loaded
    useEffect(() => {
        if (geoJsonData) {
            const layer = L.geoJSON(geoJsonData);
            setMapBounds(layer.getBounds());
        }
    }, [geoJsonData]);

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
        // User's preferred colors
        return {
            fillColor: isSelected ? '#F13C20' : (isHovered ? '#D79922' : '#4056A1'), // State-driven styles prevent flicker conflicts
            weight: isHovered || isSelected ? 3 : 1,
            opacity: 1,
            color: isHovered ? '#666' : 'white',
            dashArray: '3',
            fillOpacity: isSelected ? 0.8 : (isHovered ? 0.7 : 0.5)
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
    };

    const handleClearFilters = () => {
        // Reset all states
        setPendingMunicipio(null);
        setPendingIndicador(null);
        setSelectedIndicador(null);
        handleSelectMunicipio("todos"); // Resets map bounds and active municipio
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
