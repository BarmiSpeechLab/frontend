import React from 'react';
import './Button.css';

const Button = ({ children, onClick, type = 'button', className = '' }) => {

    return (
        <button
            type={type}
            onClick={onClick}
            className={`btn ${className}`}
            style={style}
        >
            {children}
        </button>
    );
};

export default Button;
