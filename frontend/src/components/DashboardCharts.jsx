import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardCharts = ({ charts }) => {
    if (!charts || charts.length === 0) {
        return <div className="text-center text-muted my-5">Seleccione un indicador con dimensiones para ver gráficas detalladas.</div>;
    }

    return (
        <div className="mt-5">
            <h3 className="text-center mb-4">Análisis por Dimensiones</h3>
            <Row xs={1} md={2} className="g-4">
                {charts.map((chart, idx) => (
                    <Col key={chart.dimensionId}>
                        <Card className="h-100 shadow-sm border-0">
                            <Card.Header className="bg-white border-bottom-0 pt-3">
                                <h5 className="text-center text-primary mb-0">{chart.dimensionName}</h5>
                            </Card.Header>
                            <Card.Body style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* Alternate between Bar and Pie for variety, or stick to Bar which is safer for many categories */}
                                    <BarChart
                                        data={chart.data}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            formatter={(value, name, props) => {
                                                const unit = props.payload.unit || '';
                                                return [`${value} ${unit}`, name];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                                            {chart.data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default DashboardCharts;
