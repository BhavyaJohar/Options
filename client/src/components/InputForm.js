import React, { useState } from 'react';
import { Form, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import config from '../config';

const InputForm = ({ onCalculate }) => {
    const [formData, setFormData] = useState({
        assetPrice: 100,
        strikePrice: 100,
        maturity: 1,
        volatility: 0.2,
        riskFreeRate: 0.04,
    });

    // Input field configurations with tooltips
    const inputConfigs = {
        assetPrice: {
            label: 'Asset Price',
            tooltip: 'Current market price of the underlying asset',
            step: '0.01',
            placeholder: 'e.g., 100.00'
        },
        strikePrice: {
            label: 'Strike Price',
            tooltip: 'Price at which the option can be exercised',
            step: '0.01',
            placeholder: 'e.g., 100.00'
        },
        maturity: {
            label: 'Time to Maturity (Years)',
            tooltip: 'Time until the option expires (in years)',
            step: '0.01',
            placeholder: 'e.g., 1.00'
        },
        volatility: {
            label: 'Volatility',
            tooltip: 'Annualized volatility of the underlying asset (0-1)',
            step: '0.01',
            placeholder: 'e.g., 0.20'
        },
        riskFreeRate: {
            label: 'Risk-Free Rate',
            tooltip: 'Annual risk-free interest rate (0-1)',
            step: '0.01',
            placeholder: 'e.g., 0.04'
        }
    };

    // Handle input changes for each form field
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Function to send the form data to the backend for saving
    const saveFormData = async () => {
        try {
            const response = await fetch(`${config.apiUrl}/saveOptionsData`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const result = await response.text();
            console.log('Data saved:', result);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    // Handle form submission for calculation and saving data
    const handleSubmit = (e) => {
        e.preventDefault();
        onCalculate(formData);
        saveFormData();
    };

    return (
        <Form onSubmit={handleSubmit} className="input-form">
            {Object.keys(formData).map((key) => (
                <Form.Group key={key} className="input-group mb-3">
                    <OverlayTrigger
                        placement="right"
                        overlay={<Tooltip id={`tooltip-${key}`}>{inputConfigs[key].tooltip}</Tooltip>}
                    >
                        <Form.Label>{inputConfigs[key].label}</Form.Label>
                    </OverlayTrigger>
                    <Form.Control
                        type="number"
                        step={inputConfigs[key].step}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        placeholder={inputConfigs[key].placeholder}
                    />
                </Form.Group>
            ))}
            <Button variant="primary" type="submit" className="w-100 mt-3">
                Calculate Option Price
            </Button>
        </Form>
    );
};

export default InputForm;
