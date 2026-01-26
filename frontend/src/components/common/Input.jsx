import React from 'react';
import './Input.css';

const Input = ({ type = 'text', placeholder, value, onChange, className = '' }) => {
    return (
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className={`input-field ${className}`}
        />
    );
};

export default Input;