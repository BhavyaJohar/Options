import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

const InputForm = ({ onCalculate }) => {
    const [formData, setFormData] = useState({
        assetPrice: 100,
        strikePrice: 100,
        maturity: 1,
        volatility: 0.2,
        riskFreeRate: 0.04,
    });

    // Handle input changes for each form field
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Function to send the form data to the backend for saving
    const saveFormData = async () => {
        try {
            const response = await fetch('https://black-scholes-options-pricer.onrender.com/api/saveOptionsData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),  // Send the form data as JSON
            });
            const result = await response.text();
            console.log('Data saved:', result); // Log success message
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    // Handle form submission for calculation and saving data
    const handleSubmit = (e) => {
        e.preventDefault();

        // Trigger the option price calculation
        onCalculate(formData);

        // Save the input data in the backend (MySQL)
        saveFormData();
    };

    return (
        <Form onSubmit={handleSubmit} className="input-form">
            {Object.keys(formData).map((key) => (
                <Form.Group key={key} className="input-group">
                    <Form.Label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Form.Label>
                    <Form.Control
                        type="number"
                        step="0.01"
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
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
