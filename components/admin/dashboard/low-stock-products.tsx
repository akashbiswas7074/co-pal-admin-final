import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { getLowStockProducts } from "@/lib/database/actions/admin/dashboard/dashboard.actions";
const LowStockProducts = async () => {
  let products = null;
  
  try {
    products = await getLowStockProducts();
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    products = { lowStockProducts: [] };
  }
  
  return (
    <div className="w-full container">
      <div className="SecondaryTitleStyle">Low Stock Products</div>
      <div className="">
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Stock Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products?.lowStockProducts?.length > 0 ? (
                products?.lowStockProducts.map((product: any, productIndex: number) =>
                  product.subProducts?.map((subProduct: any, subProductIndex: number) =>
                    subProduct.sizes?.map((size: any, sizeIndex: number) => {
                      if (size && size.qty < 2) {
                        return (
                          <TableRow key={`${product._id || productIndex}-${subProduct._id || subProductIndex}-${size._id || sizeIndex}`}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>{size.size}</TableCell>
                            <TableCell>{size.qty}</TableCell>
                          </TableRow>
                        );
                      }
                      return null;
                    }).filter(Boolean)
                  ).flat()
                ).flat()
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No low stock products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default LowStockProducts;
