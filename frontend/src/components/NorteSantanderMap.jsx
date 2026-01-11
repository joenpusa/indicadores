import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Form, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, GeoJSON, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { CRS } from 'leaflet'; // Import CRS
import norteSantanderGeoJSON from '../data/norte_santander.json';
import municipiosService from '../services/municipiosService';
import TableMunicipios from '../modules/settings/municipios/TableMunicipios';

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
    const [selectedMunicipio, setSelectedMunicipio] = useState(null);
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
            // Prefer codigo_municipio if available (from API), otherwise fallback to id (if from simplistic object)
            handleSelectMunicipio(municipio.codigo_municipio || municipio.id);
        } else {
            handleSelectMunicipio("todos");
        }
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
                            <Card.Title>Filtrar por Municipio</Card.Title>
                            <Form.Group className="mb-3">
                                <TableMunicipios
                                    selectedMunicipio={
                                        selectedMunicipio ? {
                                            id: selectedMunicipio,
                                            codigo_municipio: selectedMunicipio, // Ensure display component finds this
                                            nombre: geoJsonData?.features.find(f => String(f.properties.id) === String(selectedMunicipio))?.properties.name
                                        } : null
                                    }
                                    onMunicipioChange={onTableChange}
                                />
                            </Form.Group>

                            {selectedMunicipio && (
                                <div className="mt-2 mb-3">
                                    <Alert variant="info" className="py-2">
                                        Seleccionaron el municipio: <strong>{getSelectedName()}</strong>
                                    </Alert>
                                </div>
                            )}

                            {selectedMunicipio && (
                                <div className="mt-4">
                                    <Button variant="outline-primary" onClick={() => handleSelectMunicipio("todos")} size="sm">
                                        Ver Todos
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
