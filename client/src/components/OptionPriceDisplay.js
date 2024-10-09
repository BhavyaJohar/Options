import React from 'react';
import { Card, Col } from 'react-bootstrap';

const OptionPriceDisplay = ({ callValue, putValue }) => {
    return (
        <div className="price-display">
            <Col xs={12} className="mb-4 d-flex justify-content-center">
                <Card className="call-value text-center">
                    <Card.Body>
                        <Card.Title>CALL Value</Card.Title>
                        <Card.Text>{`$${callValue}`}</Card.Text>
                    </Card.Body>
                </Card>
            </Col>
            <Col xs={12} className="d-flex justify-content-center">
                <Card className="put-value text-center">
                    <Card.Body>
                        <Card.Title>PUT Value</Card.Title>
                        <Card.Text>{`$${putValue}`}</Card.Text>
                    </Card.Body>
                </Card>
            </Col>
        </div>
    );
};

export default OptionPriceDisplay;
