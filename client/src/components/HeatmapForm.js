// client/src/components/HeatmapForm.js
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import ReactSlider from 'react-slider';  // Import react-slider

const HeatmapForm = ({ onGenerateHeatmap }) => {
    const [heatmapData, setHeatmapData] = useState({
        spotPriceMin: 80,
        spotPriceMax: 120,
        volatilityMin: 0.1,
        volatilityMax: 0.5,
        strikePrice: 100,
        maturity: 1,
        riskFreeRate: 0.05,
        purchasePrice: 5
    });

    const handleChange = (e) => {
        setHeatmapData({ ...heatmapData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerateHeatmap(heatmapData);
    };

    return (
        <Form onSubmit={handleSubmit} className="heatmap-form">
            {/* Spot Price Range Slider */}
            <Form.Group className="input-group">
                <Form.Label>Spot Price Range</Form.Label>
                <ReactSlider
                    className="horizontal-slider"
                    thumbClassName="example-thumb"
                    trackClassName="example-track"
                    min={50}
                    max={150}
                    value={[heatmapData.spotPriceMin, heatmapData.spotPriceMax]}
                    onChange={([min, max]) => setHeatmapData({ ...heatmapData, spotPriceMin: min, spotPriceMax: max })}
                    minDistance={10} // Minimum range between the two thumbs
                    ariaLabel={['Lower thumb', 'Upper thumb']}
                    renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
                />
                <div className="slider-values">
                    <span>Min: {heatmapData.spotPriceMin}</span>
                    <span>Max: {heatmapData.spotPriceMax}</span>
                </div>
            </Form.Group>

            {/* Volatility Range Slider */}
            <Form.Group className="input-group">
                <Form.Label>Volatility Range</Form.Label>
                <ReactSlider
                    className="horizontal-slider"
                    thumbClassName="example-thumb"
                    trackClassName="example-track"
                    min={0.01}
                    max={1.0}
                    step={0.01}
                    value={[heatmapData.volatilityMin, heatmapData.volatilityMax]}
                    onChange={([min, max]) => setHeatmapData({ ...heatmapData, volatilityMin: min, volatilityMax: max })}
                    minDistance={0.1} // Minimum range between the two thumbs
                    ariaLabel={['Lower thumb', 'Upper thumb']}
                    renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
                />
                <div className="slider-values">
                    <span>Min: {heatmapData.volatilityMin}</span>
                    <span>Max: {heatmapData.volatilityMax}</span>
                </div>
            </Form.Group>

            {/* Strike Price, Maturity, Risk-Free Rate Inputs */}
            <Form.Group className="input-group">
                <Form.Label>Strike Price</Form.Label>
                <Form.Control
                    type="number"
                    name="strikePrice"
                    value={heatmapData.strikePrice}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="input-group">
                <Form.Label>Maturity (in years)</Form.Label>
                <Form.Control
                    type="number"
                    name="maturity"
                    value={heatmapData.maturity}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="input-group">
                <Form.Label>Risk-Free Rate</Form.Label>
                <Form.Control
                    type="number"
                    name="riskFreeRate"
                    value={heatmapData.riskFreeRate}
                    onChange={handleChange}
                />
            </Form.Group>

            <Form.Group className="input-group">
                <Form.Label>Purchase Price</Form.Label>
                <Form.Control
                    type="number"
                    name="purchasePrice"
                    value={heatmapData.purchasePrice}
                    onChange={handleChange}
                />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mt-3">
                Generate Heatmap
            </Button>
        </Form>
    );
};

export default HeatmapForm;
