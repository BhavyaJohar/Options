import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Navbar, Form, Button } from 'react-bootstrap';
import InputForm from './components/InputForm';
import OptionPriceDisplay from './components/OptionPriceDisplay';
import Heatmap from './components/Heatmap';
import { blackScholes } from './blackScholes';
import './styles.css';

const App = () => {
    const [optionPrices, setOptionPrices] = useState({
        callValue: 0,
        putValue: 0,
    });

    const [heatmapConfig, setHeatmapConfig] = useState({
        spotPriceMin: 80,
        spotPriceMax: 120,
        volatilityMin: 0.1,
        volatilityMax: 0.5,
        strikePrice: 100,
        maturity: 1,
        riskFreeRate: 0.04,
    });

    const [purchasePrices, setPurchasePrices] = useState({
        purchaseCallPrice: 0,
        purchasePutPrice: 0,
    });

    const [stagingConfig, setStagingConfig] = useState(heatmapConfig);

    // Function to calculate the option prices and update the state
    const calculateOptionPrice = (formData) => {
        const assetPrice = parseFloat(formData.assetPrice);
        const strikePrice = parseFloat(formData.strikePrice);
        const maturity = parseFloat(formData.maturity);
        const volatility = parseFloat(formData.volatility);
        const riskFreeRate = parseFloat(formData.riskFreeRate);

        const callValue = blackScholes(assetPrice, strikePrice, riskFreeRate, volatility, maturity, 'call').toFixed(2);
        const putValue = blackScholes(assetPrice, strikePrice, riskFreeRate, volatility, maturity, 'put').toFixed(2);

        setOptionPrices({ callValue, putValue });

        // Update the heatmap configuration with the new inputs
        setHeatmapConfig((prev) => ({
            ...prev,
            strikePrice,
            maturity,
            riskFreeRate,
        }));
    };

    // Fetch the most recent option data from the database when the component mounts
    useEffect(() => {
        const fetchLatestData = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/getLatestOptionsData');
                const data = await response.json();

                // Set the purchase prices for call and put
                setPurchasePrices({
                    purchaseCallPrice: data.call_price,
                    purchasePutPrice: data.put_price,
                });

                // Update the heatmap configuration with the most recent data
                setHeatmapConfig({
                    spotPriceMin: 80, // or use data from the most recent row
                    spotPriceMax: 120,
                    volatilityMin: 0.1,
                    volatilityMax: 0.5,
                    strikePrice: data.strike_price,
                    maturity: data.maturity,
                    riskFreeRate: data.risk_free_rate,
                });
            } catch (error) {
                console.error('Error fetching latest option data:', error);
            }
        };

        fetchLatestData();
    }, []);

    // Handle input changes for the volatility and spot price ranges
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStagingConfig((prev) => ({
            ...prev,
            [name]: parseFloat(value),
        }));
    };

    // Handle form submission to update the heatmap ranges
    const handleFormSubmit = (e) => {
        e.preventDefault();

        // Update heatmap configuration with the new values from stagingConfig
        setHeatmapConfig(stagingConfig);
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand>Bhavya's Options Pricer</Navbar.Brand>
                </Container>
            </Navbar>

            <Container className="app-container my-5">
                {/* Option Price Calculator Section */}
                <Row>
                    <Col md={6} className="mb-4">
                        <h2>Option Price Calculator</h2>
                        <InputForm onCalculate={calculateOptionPrice} />
                    </Col>
                    <Col md={6} className="mb-4">
                        <OptionPriceDisplay
                            callValue={optionPrices.callValue}
                            putValue={optionPrices.putValue}
                        />
                    </Col>
                </Row>

                {/* Heatmap Title */}
                <Row>
                    <Col md={12}>
                        <h2>Call and Put Price Heatmaps</h2>
                    </Col>
                </Row>

                {/* Form to adjust heatmap ranges */}
                <Row>
                    <Col md={12}>
                        <Form onSubmit={handleFormSubmit} className="heatmap-form">
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="heatmap-config-form form-label">
                                        <Form.Label>Volatility Range</Form.Label>
                                        <Row>
                                            <Col>
                                                <Form.Control
                                                    type="number"
                                                    name="volatilityMin"
                                                    step="0.01"
                                                    value={stagingConfig.volatilityMin}
                                                    onChange={handleInputChange}
                                                    placeholder="Min Volatility"
                                                />
                                            </Col>
                                            <Col>
                                                <Form.Control
                                                    type="number"
                                                    name="volatilityMax"
                                                    step="0.01"
                                                    value={stagingConfig.volatilityMax}
                                                    onChange={handleInputChange}
                                                    placeholder="Max Volatility"
                                                />
                                            </Col>
                                        </Row>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="heatmap-config-form form-label">
                                        <Form.Label>Spot Price Range</Form.Label>
                                        <Row>
                                            <Col>
                                                <Form.Control
                                                    type="number"
                                                    name="spotPriceMin"
                                                    value={stagingConfig.spotPriceMin}
                                                    onChange={handleInputChange}
                                                    placeholder="Min Spot Price"
                                                />
                                            </Col>
                                            <Col>
                                                <Form.Control
                                                    type="number"
                                                    name="spotPriceMax"
                                                    value={stagingConfig.spotPriceMax}
                                                    onChange={handleInputChange}
                                                    placeholder="Max Spot Price"
                                                />
                                            </Col>
                                        </Row>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button variant="primary" type="submit" className="w-100 mt-3">
                                Update Heatmap
                            </Button>
                        </Form>
                    </Col>
                </Row>

                {/* Heatmap Section */}
                <Row>
                    <Col md={12} className="mb-4">
                        <div className="heatmap-container">
                            <Heatmap
                                heatmapData={heatmapConfig}
                                purchaseCallPrice={purchasePrices.purchaseCallPrice}
                                purchasePutPrice={purchasePrices.purchasePutPrice}
                            />
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default App;
