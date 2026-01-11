import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup, InputGroup, Spinner, Button } from 'react-bootstrap';
// Using Bootstrap icons classes assuming they are available, or simple text if not.

const CompTableSelect = ({
    selectedItem,
    onSearch, // Async function that returns a list
    itemDisplay, // Function: (item) => string
    onSelect, // Callback: (item) => void
    label = "Seleccionar",
    placeholder = "Buscar...",
    chars = 2,
    enabled = true
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const searchTimeout = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (term.length >= chars) {
            setLoading(true);
            setIsOpen(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const results = await onSearch(term);
                    setOptions(results || []);
                } catch (error) {
                    console.error("Search error:", error);
                    setOptions([]);
                } finally {
                    setLoading(false);
                }
            }, 500); // 500ms debounce
        } else {
            setOptions([]);
            setLoading(false);
            // Optionally close if term is too short? Keep open for "status"
        }
    };

    const handleSelectOption = (item) => {
        onSelect(item);
        setIsOpen(false);
        setSearchTerm(''); // Clear search on select? Or keep it?
        // Typically clear search, but maybe show selected item text?
        // The display logic for selected item is separate in the UI usually.
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onSelect(null);
    };

    return (
        <div ref={wrapperRef} className={`comp-table-select position-relative ${enabled ? '' : 'disabled'}`}>
            {/* Selected Item Display Area */}
            <div
                className="form-control d-flex justify-content-between align-items-center"
                style={{ cursor: enabled ? 'pointer' : 'default', backgroundColor: enabled ? '#fff' : '#e9ecef' }}
                onClick={() => enabled && setIsOpen(!isOpen)}
            >
                <div>
                    <span className="text-muted small d-block mb-1">{label}</span>
                    <span className="fw-bold">
                        {selectedItem ? itemDisplay(selectedItem) : "Seleccione..."}
                    </span>
                </div>
                {selectedItem && enabled && (
                    <Button variant="link" className="p-0 text-secondary" onClick={handleClear}>
                        <i className="bi bi-x-lg"></i> X
                    </Button>
                )}
            </div>

            {/* Dropdown Area */}
            {isOpen && enabled && (
                <div className="position-absolute w-100 bg-white border border-top-0 shadow-sm rounded-bottom p-2" style={{ zIndex: 1050, top: '100%' }}>
                    <Form.Control
                        type="search"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        autoFocus
                        className="mb-2"
                        autoComplete="off"
                    />

                    {loading ? (
                        <div className="text-center py-2">
                            <Spinner animation="border" size="sm" variant="primary" />
                        </div>
                    ) : (
                        <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {options.length > 0 ? (
                                options.map((item, idx) => (
                                    <ListGroup.Item
                                        key={idx}
                                        action
                                        onClick={() => handleSelectOption(item)}
                                        className={selectedItem === item ? 'active' : ''}
                                    >
                                        {itemDisplay(item)}
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <div className="text-muted text-center small py-2">
                                    {searchTerm.length < chars ? `Escriba al menos ${chars} caracteres` : "No se encontraron resultados"}
                                </div>
                            )}
                        </ListGroup>
                    )}
                </div>
            )}
        </div>
    );
};

export default CompTableSelect;
