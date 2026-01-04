// Client-side analytics actions for Vercel compatibility
export const getOrderAnalytics = async () => {
  try {
    const response = await fetch('/api/admin/analytics/orders');
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching order analytics:', error);
    return {
      orders: [],
      revenue: 0,
      products_sold: 0,
      average_order_value: 0,
      total_orders: 0,
      total_revenue: 0,
      error: "Failed to fetch order analytics"
    };
  }
};

export const getTopSellingProducts = async () => {
  try {
    const response = await fetch('/api/admin/analytics/top-products');
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching top selling products:', error);
    return [];
  }
};

export const sizeAnalytics = async () => {
  try {
    const response = await fetch('/api/admin/analytics/sizes');
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching size analytics:', error);
    return [];
  }
};

export const getUseranalytics = async () => {
  try {
    const response = await fetch('/api/admin/analytics/users');
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    return { users: [] };
  }
};

export const getProductAnalytics = async () => {
  try {
    const response = await fetch('/api/admin/analytics/products');
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching product analytics:', error);
    return { products: [] };
  }
};

