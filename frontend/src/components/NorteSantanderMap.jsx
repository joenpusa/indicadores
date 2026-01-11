import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Form, Card, Button, Spinner } from 'react-bootstrap';
import { MapContainer, GeoJSON, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { CRS } from 'leaflet'; // Import CRS
import norteSantanderGeoJSON from '../data/norte_santander.json';
import municipiosService from '../services/municipiosService';

// Fix for default Leaflet icon issues in React (keeping this as it's a common Leaflet issue)
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
    const [municipios, setMunicipios] = useState([]);
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [selectedMunicipio, setSelectedMunicipio] = useState(null);
    const [hoveredMunicipio, setHoveredMunicipio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapBounds, setMapBounds] = useState(null); // Use bounds instead of center/zoom for auto-fit

    const geoJsonLayer = useRef(null);

    useEffect(() => {
        // Load Municipality Data
        const fetchMunicipios = async () => {
            try {
                const response = await municipiosService.getAll();
                // Defensive check for array
                if (Array.isArray(response)) {
                    setMunicipios(response);
                } else if (response && Array.isArray(response.data)) {
                    setMunicipios(response.data);
                } else {
                    console.warn("Unexpected API response structure:", response);
                    setMunicipios([]);
                }
            } catch (error) {
                console.error("Error fetching municipios:", error);
                setMunicipios([]);
            }
        };

        // Load GeoJSON Data
        // Since we are importing it directly, we can just set it
        setGeoJsonData(norteSantanderGeoJSON);
        setLoading(false);
        fetchMunicipios();
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

        // Safe array check before .find
        const safeMunicipios = Array.isArray(municipios) ? municipios : [];
        const municipio = safeMunicipios.find(m => String(m.id) === String(value) || String(m.codigo) === String(value));

        // Use the value as the ID since that's what we pass around
        setSelectedMunicipio(String(value));

        // Find feature to zoom
        const feature = geoJsonData?.features.find(f =>
            String(f.properties.id) === String(value) ||
            (municipio && String(f.properties.id) === String(municipio.codigo))
        );

        if (feature) {
            const layer = L.geoJSON(feature);
            setMapBounds(layer.getBounds());
        }
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
                                <Form.Label>Seleccione un municipio</Form.Label>
                                <Form.Select
                                    value={selectedMunicipio || "todos"}
                                    onChange={handleFilterChange}
                                >
                                    <option value="todos">Todos los municipios</option>
                                    {/* STRICTLY use API data for names as requested */}
                                    {(municipios.length > 0 ? municipios : (geoJsonData?.features.map(f => ({ id: f.properties.id, name: f.properties.name })) || [])).map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name || m.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            {selectedMunicipio && (
                                <div className="mt-4">
                                    <h5>Información</h5>

                                    <p>
                                        Has seleccionado el municipio con ID: <strong>{selectedMunicipio}</strong>.
                                    </p>
                                    <Button variant="outline-primary" onClick={() => handleSelectMunicipio("todos")} size="sm">
                                        Ver Todos
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={8}>
                    <Card className="shadow-sm border-0 overflow-hidden" style={{ height: '500px' }}>
                        <MapContainer
                            crs={CRS.Simple} // KEY CHANGE: Use Simple CRS for pure coordinate projection (flat)
                            bounds={mapBounds}
                            zoom={8} // Initial zoom, though bounds will override it usually
                            center={[0, 0]}
                            style={{ height: '100%', width: '100%', background: 'white' }} // White or transparent background
                            scrollWheelZoom={false}
                            zoomControl={false}
                            doubleClickZoom={false}
                            dragging={true}
                            attributionControl={false}
                            minZoom={-10} // Allow zooming out far enough for Simple coords which might be large/small
                        >
                            {/* No TileLayer */}

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
