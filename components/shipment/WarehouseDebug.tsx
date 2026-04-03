import React from 'react';

interface WarehouseDebugProps {
  warehouses?: any[];
  shipmentData?: any;
  label?: string;
}

export const WarehouseDebug: React.FC<WarehouseDebugProps> = ({ 
  warehouses, 
  shipmentData, 
  label = 'Warehouse Debug'
}) => {
  return (
    <div className="border border-gray-300 rounded p-4 bg-gray-50 mb-4">
      <h3 className="font-bold text-sm mb-2">{label}</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Warehouses prop:</strong> {warehouses ? `Array(${warehouses.length})` : 'undefined'}
        </div>
        
        <div>
          <strong>ShipmentData.warehouses:</strong> {shipmentData?.warehouses ? `Array(${shipmentData.warehouses.length})` : 'undefined'}
        </div>
        
        <div>
          <strong>ShipmentData exists:</strong> {shipmentData ? 'Yes' : 'No'}
        </div>
        
        {warehouses && warehouses.length > 0 && (
          <div>
            <strong>Warehouse data:</strong>
            <pre className="bg-white p-2 rounded text-xs overflow-auto">
              {JSON.stringify(warehouses, null, 2)}
            </pre>
          </div>
        )}
        
        {shipmentData?.warehouses && shipmentData.warehouses.length > 0 && (
          <div>
            <strong>ShipmentData warehouse data:</strong>
            <pre className="bg-white p-2 rounded text-xs overflow-auto">
              {JSON.stringify(shipmentData.warehouses, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseDebug;
