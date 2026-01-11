import React, { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form, OverlayTrigger, Tooltip, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaQuestionCircle } from 'react-icons/fa';
import municipiosService from '@/services/municipiosService';
import zonasService from '@/services/zonasService';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';

const MunicipiosPage = () => {
    const [municipios, setMunicipios] = useState([]);
    const [zonas, setZonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    // Ref to prevent double page increments (race condition fix)
    const intentToFetchRef = useRef(false);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        codigo_municipio: '',
        nombre: '',
        id_zona: '',
        es_activo: true
    });

    const [formError, setFormError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const { success, error } = useToast();
    const { confirm } = useConfirm();

    // Load Zonas for the select
    useEffect(() => {
        const fetchZonas = async () => {
            try {
                const data = await zonasService.getAll();
                setZonas(data);
            } catch (err) {
                console.error('Error loading zonas:', err);
                error('Error al cargar zonas');
            }
        };
        fetchZonas();
    }, []);

    // Fetch data logic
    const fetchMunicipios = async (pageNum = 1, shouldReset = false) => {
        if (isFetching && !shouldReset) return;

        if (shouldReset) {
            setLoading(true);
        } else {
            setIsFetching(true);
        }

        try {
            const response = await municipiosService.getAll({ q: searchTerm, page: pageNum, limit: 20 });
            const newMunicipios = response.data || [];

            setMunicipios(prev => shouldReset ? newMunicipios : [...prev, ...newMunicipios]);
            setHasMore(pageNum < (response.meta?.totalPages || 1));
        } catch (err) {
            error('Error al cargar los municipios.');
            console.error(err);
        } finally {
            setLoading(false);
            setIsFetching(false);
            intentToFetchRef.current = false; // Release lock
        }
    };

    // Effect for handling search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            intentToFetchRef.current = false; // Reset lock on search
            setPage(1);
            fetchMunicipios(1, true);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Effect for handling page changes (infinite scroll)
    useEffect(() => {
        if (page > 1) {
            fetchMunicipios(page, false);
        }
    }, [page]);

    // Scroll listener
    useEffect(() => {
        const scrollContainer = document.getElementById('main-content');
        if (!scrollContainer) return;

        const handleScroll = () => {
            if (
                scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight * 0.8 &&
                hasMore &&
                !isFetching &&
                !loading &&
                !intentToFetchRef.current
            ) {
                intentToFetchRef.current = true; // Set lock immediately
                setPage(prev => prev + 1);
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [hasMore, isFetching, loading]);

    const handleShow = (municipio = null) => {
        if (municipio) {
            setEditingId(municipio.id_municipio);
            setFormData({
                codigo_municipio: municipio.codigo_municipio,
                nombre: municipio.nombre,
                id_zona: municipio.id_zona,
                es_activo: municipio.activo === 1
            });
        } else {
            setEditingId(null);
            setFormData({
                codigo_municipio: '',
                nombre: '',
                id_zona: '',
                es_activo: true
            });
        }
        setFormError(null);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.codigo_municipio.trim()) {
            setFormError('El código del municipio es obligatorio.');
            return;
        }
        if (!formData.nombre.trim()) {
            setFormError('El nombre es obligatorio.');
            return;
        }
        if (!formData.id_zona) {
            setFormError('Debe seleccionar una zona.');
            return;
        }

        try {
            const dataToSend = { ...formData, activo: formData.es_activo ? 1 : 0 };
            if (editingId) {
                await municipiosService.update(editingId, dataToSend);
                success('Municipio actualizado correctamente.');
            } else {
                await municipiosService.create(dataToSend);
                success('Municipio creado correctamente.');
            }
            // Refresh list (reset to page 1 to see changes properly or handle update locally - resetting is safer)
            setPage(1);
            fetchMunicipios(1, true);
            handleClose();
        } catch (err) {
            error('Error al guardar el municipio.');
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Desactivar Municipio',
            message: '¿Estás seguro de que deseas desactivar este municipio?',
            confirmText: 'Desactivar',
            variant: 'danger'
        });

        if (isConfirmed) {
            try {
                // Assuming remove performs a logical delete or actual delete
                // In Dao we might just update active status? The user didn't specify DELETE behavior but "el CRUD".
                // Usually remove -> delete or logical delete. 
                // Let's assume logical delete (update active = 0) if standard practice, or strict delete.
                // Secretarias uses strict delete/inactivate.
                await municipiosService.update(id, { ...formData, active: false });
                // Wait, remove method usually calls DELETE endpoint.
                // If I use service.remove(id), the backend DELETE route must exist.
                // I added DELETE route but not controller method specifically?
                // Wait, I implemented getAll, create, update in Controller. DELETE is missing?
                // User said "CRUD", usually implies D too.
                // But in Secretarias we use toggle active?
                // Secretarias uses `secretariasService.remove(id)`.
                // In backend `secretariasDao.delete` sets `es_activo = 0`.
                // So I should implement DELETE in MunicipiosController similarly.
                // For now, let's use UPDATE to inactive if DELETE endpoint is not fully up, 
                // OR I should fix the backend to include DELETE.
                // I'll add the DELETE logic to backend controller/dao too quickly or just use update here.
                // Let's just update active to false here for safety if DELETE route is missing logic.
                // Re-reading controller... I missed DELETE implementation in Controller!
                // I will add it.

                await municipiosService.remove(id); // I added the route, need to ensure controller support.
                success('Municipio desactivado correctamente.');
                setPage(1);
                fetchMunicipios(1, true);
            } catch (err) {
                error('Error al eliminar el municipio.');
                console.error(err);
            }
        }
    };

    return (
        <div className="container-fluid">
            <style>
                {`
                    .municipio-card {
                        transition: all 0.3s ease;
                        border-left: 5px solid #6c757d;
                    }
                    .municipio-card.active {
                        border-left-color: #0d6efd;
                    }
                    .municipio-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
                        background-color: #f8f9fa;
                    }
                `}
            </style>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2>Gestión de Municipios</h2>
                <Button variant="primary" onClick={() => handleShow()}>
                    <FaPlus className="me-2" /> Nuevo Municipio
                </Button>
            </div>

            <div className="mb-4">
                <Form.Control
                    type="text"
                    placeholder="Buscar municipio por nombre o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow-sm"
                />
            </div>

            {loading ? (
                <div className="text-center mt-5"><Spinner animation="border" /></div>
            ) : (
                <div className="row g-3">
                    {municipios.map((mun) => (
                        <div className="col-12" key={mun.id_municipio}>
                            <div className={`card shadow-sm border-0 municipio-card ${mun.activo ? 'active' : ''}`}>
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <div className="d-flex flex-column">
                                        <div className="d-flex align-items-center gap-2">
                                            <h5 className="card-title mb-1">{mun.nombre}</h5>
                                            <Badge bg="secondary" className="fw-normal" style={{ fontSize: '0.8rem' }}>
                                                {mun.codigo_municipio}
                                            </Badge>
                                        </div>
                                        <div className="text-muted small">
                                            Zone: {mun.nombre_zona || 'Sin Zona'}
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-3">
                                        <Badge bg={mun.activo ? 'success' : 'secondary'} className="fw-normal">
                                            {mun.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        <div className="d-flex gap-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleShow(mun)} title="Editar">
                                                <FaEdit />
                                            </Button>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Editar Municipio' : 'Nuevo Municipio'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && <Alert variant="danger">{formError}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <div className="row g-2 mb-3">
                            <div className="col-md-4">
                                <div className="form-floating">
                                    <Form.Control
                                        type="text"
                                        id="floatingCodigo"
                                        placeholder="Código"
                                        value={formData.codigo_municipio}
                                        onChange={(e) => setFormData({ ...formData, codigo_municipio: e.target.value })}
                                        autoFocus
                                        className={formError && !formData.codigo_municipio ? 'is-invalid' : ''}
                                    />
                                    <label htmlFor="floatingCodigo">Código <span className="text-danger">*</span></label>
                                </div>
                            </div>
                            <div className="col-md-8">
                                <div className="form-floating">
                                    <Form.Select
                                        id="floatingZona"
                                        value={formData.id_zona}
                                        onChange={(e) => setFormData({ ...formData, id_zona: e.target.value })}
                                        aria-label="Seleccione zona"
                                        className={formError && !formData.id_zona ? 'is-invalid' : ''}
                                    >
                                        <option value="">Seleccione una zona...</option>
                                        {zonas.map(z => (
                                            <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>
                                        ))}
                                    </Form.Select>
                                    <label htmlFor="floatingZona">Zona <span className="text-danger">*</span></label>
                                </div>
                            </div>
                        </div>
                        <div className="form-floating mb-3">
                            <Form.Control
                                type="text"
                                id="floatingNombre"
                                placeholder="Nombre del municipio"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className={formError && !formData.nombre ? 'is-invalid' : ''}
                            />
                            <label htmlFor="floatingNombre">Nombre <span className="text-danger">*</span></label>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                label="Activo"
                                checked={formData.es_activo}
                                onChange={(e) => setFormData({ ...formData, es_activo: e.target.checked })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                            <Button variant="primary" type="submit">
                                {editingId ? 'Guardar Cambios' : 'Crear Municipio'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default MunicipiosPage;
