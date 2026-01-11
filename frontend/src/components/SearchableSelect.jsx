import React, { useState, useEffect, useRef } from 'react';
import { Form, ListGroup, InputGroup } from 'react-bootstrap';

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    labelKey = 'name',
    valueKey = 'id',
    placeholder = 'Buscar...',
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const wrapperRef = useRef(null);

    // Initial load and sync with options
    useEffect(() => {
        setFilteredOptions(options);
    }, [options]);

    // Update internal input when external value changes
    useEffect(() => {
        if (value) {
            const selectedItem = options.find(opt => String(opt[valueKey]) === String(value));
            if (selectedItem) {
                setSearchTerm(selectedItem[labelKey]);
            }
        } else {
            setSearchTerm(''); // Clear if value is null
        }
    }, [value, options, valueKey, labelKey]);

    // Handle outside clicks to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset search term to currently selected item if closed without new selection
                if (value) {
                    const selectedItem = options.find(opt => String(opt[valueKey]) === String(value));
                    if (selectedItem) {
                        setSearchTerm(selectedItem[labelKey]);
                    }
                } else {
                    setSearchTerm('');
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, value, options, valueKey, labelKey]);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        setIsOpen(true);

        if (!term) {
            setFilteredOptions(options);
            onChange(null); // Optional: Clear selection on empty input? 
            return;
        }

        const filtered = options.filter(opt =>
            String(opt[labelKey]).toLowerCase().includes(term.toLowerCase())
        );
        setFilteredOptions(filtered);
    };

    const handleSelect = (option) => {
        setSearchTerm(option[labelKey]);
        setIsOpen(false);
        onChange(option[valueKey]);
    };

    const handleFocus = () => {
        setIsOpen(true);
        // If focusing and we have a value, maybe filter by it or show all? 
        // Showing all is usually better for "changing" selection
        setFilteredOptions(options);
    };

    return (
        <div ref={wrapperRef} className="position-relative">
            <InputGroup>
                <Form.Control
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={handleFocus}
                    disabled={disabled}
                    autoComplete="off"
                />
            </InputGroup>

            {isOpen && filteredOptions.length > 0 && (
                <ListGroup className="position-absolute w-100 shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredOptions.map((opt, idx) => (
                        <ListGroup.Item
                            key={opt[valueKey] || idx}
                            action
                            onClick={() => handleSelect(opt)}
                        >
                            {opt[labelKey]}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
            {isOpen && searchTerm && filteredOptions.length === 0 && (
                <ListGroup className="position-absolute w-100 shadow-sm" style={{ zIndex: 1000 }}>
                    <ListGroup.Item disabled>No se encontraron resultados</ListGroup.Item>
                </ListGroup>
            )}
        </div>
    );
};

export default SearchableSelect;
