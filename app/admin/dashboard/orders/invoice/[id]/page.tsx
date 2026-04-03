"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderById } from "@/lib/database/actions/admin/orders/orders.actions";
import { getBusinessDetails } from "@/lib/database/actions/admin/settings.actions";
import {
    Container,
    Title,
    Text,
    Paper,
    Loader,
    Button,
    Group,
    Table,
    Box,
    Grid,
    Divider,
    Image,
    Stack,
    Badge
} from "@mantine/core";
import { IconPrinter, IconArrowLeft, IconDownload } from "@tabler/icons-react";

export default function InvoicePage() {
    const params = useParams();
    const router = useRouter();
    const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [order, setOrder] = useState<any>(null);
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (orderId) {
                try {
                    const [orderRes, businessRes] = await Promise.all([
                        getOrderById(orderId as string),
                        getBusinessDetails()
                    ]);

                    if (orderRes.success && orderRes.order) {
                        setOrder(orderRes.order);
                    }
                    setBusiness(businessRes);
                } catch (error) {
                    console.error("Error loading invoice data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [orderId]);

    if (loading) return <Container className="flex justify-center items-center h-screen"><Loader size="xl" /></Container>;
    if (!order) return <Container><Text>Order not found</Text></Container>;

    // Invoice items - normalize between orderItems and products
    const items = order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.products;

    return (
        <Box bg="white" mih="100vh" p="md">
            {/* Action Bar - Hidden in print */}
            <Group justify="space-between" mb="lg" className="print:hidden">
                <Button variant="default" leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()}>
                    Back
                </Button>
                <Group>
                    <Button leftSection={<IconPrinter size={16} />} onClick={() => window.print()}>
                        Print Invoice
                    </Button>
                </Group>
            </Group>

            {/* Invoice Container - A4 constrained */}
            <Paper
                p="xl"
                withBorder
                shadow="sm"
                mx="auto"
                w="210mm"
                mih="297mm"
                bg="white"
                className="invoice-document"
                style={{ position: 'relative' }} // For absolute positioning if needed
            >
                {/* Header Section */}
                <Grid mb="xl" align="flex-start">
                    <Grid.Col span={6}>
                        {business?.logoUrl ? (
                            <Image
                                src={business.logoUrl}
                                alt={business.businessName}
                                h={80}
                                fit="contain"
                                radius="sm"
                                fallbackSrc="/logo-placeholder.png"
                            />
                        ) : (
                            <Title order={2} tt="uppercase" opacity={0.8}>{business?.businessName}</Title>
                        )}
                    </Grid.Col>
                    <Grid.Col span={6} style={{ textAlign: 'right' }}>
                        <Title order={1} c="dark.3" mb="xs" style={{ letterSpacing: '1px' }}>INVOICE</Title>
                        <Text fw={700} size="lg">#{order.orderId || order._id?.substring(0, 8).toUpperCase()}</Text>
                        <Text size="sm" c="dimmed">Date: {new Date(order.createdAt).toLocaleDateString()}</Text>
                        <Badge
                            variant="filled"
                            color={order.isPaid ? 'green' : 'red'}
                            mt="xs"
                            size="lg"
                            radius="sm"
                        >
                            {order.isPaid ? 'PAID' : 'DUE'}
                        </Badge>
                    </Grid.Col>
                </Grid>

                <Divider mb="xl" />

                {/* Addresses Grid */}
                <Grid mb="xl" gutter="xl">
                    <Grid.Col span={6}>
                        <Box p="md" bg="gray.0" style={{ borderRadius: '8px', height: '100%' }}>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">Bill From / Sold By:</Text>
                            <Text fw={700} size="md">{business?.businessName}</Text>
                            <Text size="sm" style={{ whiteSpace: 'pre-line' }}>{business?.businessAddress}</Text>
                            <Stack gap={2} mt="sm">
                                {business?.businessEmail && <Text size="sm">Email: {business.businessEmail}</Text>}
                                {business?.businessPhone && <Text size="sm">Phone: {business.businessPhone}</Text>}
                                {business?.businessGstin && <Text size="sm">GSTIN: <strong>{business.businessGstin}</strong></Text>}
                            </Stack>
                        </Box>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Box p="md" style={{ border: '1px solid #eee', borderRadius: '8px', height: '100%' }}>
                            <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">Bill To / Ship To:</Text>
                            <Text fw={700} size="md">{order.shippingAddress?.name || order.user?.name}</Text>
                            <Text size="sm">
                                {order.shippingAddress?.address1}
                                {order.shippingAddress?.address2 ? `, ${order.shippingAddress.address2}` : ''}
                            </Text>
                            <Text size="sm">
                                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                            </Text>
                            <Text size="sm">{order.shippingAddress?.country}</Text>
                            <Stack gap={2} mt="sm">
                                <Text size="sm">Phone: {order.shippingAddress?.phone || order.user?.phone}</Text>
                                <Text size="sm">Email: {order.user?.email}</Text>
                                {order.gstInfo?.gstin && <Text size="sm">GSTIN: <strong>{order.gstInfo.gstin}</strong></Text>}
                            </Stack>
                        </Box>
                    </Grid.Col>
                </Grid>

                {/* Order Items Table */}
                <Table
                    striped
                    withTableBorder
                    withColumnBorders
                    mb="xl"
                    style={{ fontSize: '0.9rem' }}
                >
                    <Table.Thead bg="gray.1">
                        <Table.Tr>
                            <Table.Th w={50}>#</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Qty</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Rate</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {items?.map((item: any, index: number) => {
                            const price = item.price || 0;
                            const qty = item.quantity || item.qty || 1;
                            const amount = price * qty;

                            return (
                                <Table.Tr key={index}>
                                    <Table.Td>{index + 1}</Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={500}>{item.product?.name || item.name}</Text>
                                        <Group gap="xs">
                                            {item.size && <Badge size="xs" variant="outline" color="gray">Size: {item.size}</Badge>}
                                            {item.product?.sku && <Text size="xs" c="dimmed">SKU: {item.product.sku}</Text>}
                                            {item.hsnCode && <Text size="xs" c="dimmed">HSN: {item.hsnCode}</Text>}
                                        </Group>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>{qty}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>₹{price.toFixed(2)}</Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }} fw={600}>₹{amount.toFixed(2)}</Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>

                {/* Totals Section */}
                <Grid>
                    <Grid.Col span={7}>
                        {/* Notes / Terms */}
                        <Box p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs">Payment Info</Text>
                            <Text size="sm">Method: <strong>{(order.paymentMethod || 'Unknown').toUpperCase()}</strong></Text>
                            {order.paymentId && <Text size="sm">Ref ID: {order.paymentId}</Text>}
                            <Divider my="sm" />
                            <Text size="xs" c="dimmed">
                                Thank you for your business. If you have any questions about this invoice, please contact support.
                            </Text>
                        </Box>
                    </Grid.Col>
                    <Grid.Col span={5}>
                        <Paper p="md" withBorder radius="md">
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Subtotal</Text>
                                    <Text size="sm" fw={500}>₹{(order.itemsPrice || 0).toFixed(2)}</Text>
                                </Group>

                                {order.discountAmount > 0 && (
                                    <Group justify="space-between" c="green.7">
                                        <Text size="sm">Discount</Text>
                                        <Text size="sm">- ₹{order.discountAmount.toFixed(2)}</Text>
                                    </Group>
                                )}

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Shipping</Text>
                                    <Text size="sm" fw={500}>₹{(order.shippingPrice || 0).toFixed(2)}</Text>
                                </Group>

                                {/* Tax Section - Conditionally Rendered */}
                                {order.taxPrice > 0 && (
                                    <>
                                        <Divider style={{ borderStyle: 'dashed' }} />
                                        {(order.cgst || order.sgst) ? (
                                            <>
                                                <Group justify="space-between">
                                                    <Text size="sm" c="dimmed">CGST</Text>
                                                    <Text size="sm">₹{(order.cgst || 0).toFixed(2)}</Text>
                                                </Group>
                                                <Group justify="space-between">
                                                    <Text size="sm" c="dimmed">SGST</Text>
                                                    <Text size="sm">₹{(order.sgst || 0).toFixed(2)}</Text>
                                                </Group>
                                                {order.igst > 0 && (
                                                    <Group justify="space-between">
                                                        <Text size="sm" c="dimmed">IGST</Text>
                                                        <Text size="sm">₹{order.igst.toFixed(2)}</Text>
                                                    </Group>
                                                )}
                                            </>
                                        ) : (
                                            <Group justify="space-between">
                                                <Text size="sm" c="dimmed">Tax / GST</Text>
                                                <Text size="sm">₹{order.taxPrice.toFixed(2)}</Text>
                                            </Group>
                                        )}
                                    </>
                                )}

                                <Divider my="xs" />

                                <Group justify="space-between" align="center">
                                    <Text size="md" fw={700}>Grand Total</Text>
                                    <Title order={3}>₹{(order.totalAmount || order.total || 0).toFixed(2)}</Title>
                                </Group>
                            </Stack>
                        </Paper>
                    </Grid.Col>
                </Grid>

                {/* Footer Signature - Fixed at bottom for print */}
                <Box mt={80} pt="xl" style={{ borderTop: '1px solid #eee' }}>
                    <Group justify="space-between" align="flex-end">
                        <Box>
                            <Text size="xs" c="dimmed">Terms & Conditions:</Text>
                            <Text size="xs" c="dimmed" style={{ maxWidth: '300px' }}>
                                1. Goods once sold will not be taken back.<br />
                                2. Interest @18% p.a. will be charged if payment is not made within due date.<br />
                                3. Subject to {business?.businessState || 'Local'} Jurisdiction.
                            </Text>
                        </Box>
                        <Box style={{ textAlign: 'center' }}>
                            {/* Simple text signature placeholder or scan */}
                            <Text size="sm" fw={700} style={{ fontFamily: 'cursive' }}>Authorized Signatory</Text>
                            <Text size="xs" c="dimmed" mt={4}>for {business?.businessName}</Text>
                        </Box>
                    </Group>
                </Box>
            </Paper>

            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 0;
                    }
                    /* HIDE EVERYTHING INITIALLY */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Reset body to ensure no offsets */
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: white;
                        height: 100%;
                        width: 100%;
                    }

                    /* SHOW ONLY INVOICE AND ITS CHILDREN */
                    .invoice-document, .invoice-document * {
                        visibility: visible;
                    }

                    /* POSITION INVOICE TO FILL PAGE */
                    .invoice-document {
                        position: absolute !important;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important; /* Standard padding */
                        background: white !important;
                        z-index: 9999;
                        border: none !important;
                        box-shadow: none !important;
                        box-sizing: border-box;
                    }
                    
                    /* Hide components that might have inline styles */
                    .print\\:hidden { 
                        display: none !important; 
                    }
                }
            `}</style>
        </Box>
    );
}
