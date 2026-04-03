import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ShippingLabelGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  waybill: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

type PdfSize = 'A4' | '4R';

export function ShippingLabelGenerator({
  isOpen,
  onClose,
  waybill,
  onSuccess,
  onError
}: ShippingLabelGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [pdfSize, setPdfSize] = useState<PdfSize>('4R');
  const [outputType, setOutputType] = useState<'pdf' | 'json'>('pdf');
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      const pdf = outputType === 'pdf';
      const response = await fetch(`/api/shipment/label?waybill=${waybill}&pdf=${pdf}&pdf_size=${pdfSize}`);
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to generate shipping label');
      }

      if (pdf) {
        // Handle PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `shipping-label-${waybill}-${pdfSize}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        onSuccess?.(`Shipping label (${pdfSize}) downloaded successfully`);
        onClose();
      } else {
        // Handle JSON response for preview
        const result = await response.json();
        if (result.success) {
          setPreviewData(result.data);
          setShowPreview(true);
        } else {
          throw new Error(result.error || 'Failed to generate label data');
        }
      }
    } catch (err: any) {
      console.error('Error generating label:', err);
      onError?.(err.message || 'Failed to generate shipping label');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPreview = () => {
    if (previewData) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Shipping Label - ${waybill}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px;
                  background: white;
                }
                .label-container {
                  max-width: ${pdfSize === 'A4' ? '8.27in' : '4in'};
                  height: ${pdfSize === 'A4' ? '11.69in' : '6in'};
                  border: 1px solid #000;
                  padding: 10px;
                  margin: 0 auto;
                }
                .label-header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                  margin-bottom: 15px;
                }
                .label-section {
                  margin-bottom: 15px;
                  padding: 8px;
                  border: 1px solid #ccc;
                }
                .label-title {
                  font-weight: bold;
                  margin-bottom: 5px;
                  text-decoration: underline;
                }
                .label-content {
                  font-size: ${pdfSize === 'A4' ? '12px' : '10px'};
                  line-height: 1.4;
                }
                .waybill-number {
                  font-size: ${pdfSize === 'A4' ? '24px' : '18px'};
                  font-weight: bold;
                  text-align: center;
                  margin: 10px 0;
                  padding: 10px;
                  border: 2px solid #000;
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="label-container">
                <div class="label-header">
                  <h2>SHIPPING LABEL</h2>
                  <div class="waybill-number">${waybill}</div>
                </div>
                
                <div class="label-section">
                  <div class="label-title">FROM:</div>
                  <div class="label-content">
                    ${previewData.pickup_location?.name || 'N/A'}<br>
                    ${previewData.pickup_location?.address || 'N/A'}<br>
                    ${previewData.pickup_location?.city || ''} ${previewData.pickup_location?.state || ''} ${previewData.pickup_location?.pin || ''}
                  </div>
                </div>
                
                <div class="label-section">
                  <div class="label-title">TO:</div>
                  <div class="label-content">
                    ${previewData.name || 'N/A'}<br>
                    ${previewData.add || 'N/A'}<br>
                    ${previewData.city || ''} ${previewData.state || ''} ${previewData.pin || ''}<br>
                    Phone: ${previewData.phone || 'N/A'}
                  </div>
                </div>
                
                <div class="label-section">
                  <div class="label-title">SHIPMENT DETAILS:</div>
                  <div class="label-content">
                    Weight: ${previewData.weight || 'N/A'} kg<br>
                    Payment Mode: ${previewData.payment_mode || 'N/A'}<br>
                    ${previewData.cod_amount ? `COD Amount: ₹${previewData.cod_amount}` : ''}
                    ${previewData.products_desc ? `<br>Products: ${previewData.products_desc}` : ''}
                  </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                  <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Label</button>
                  <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Shipping Label
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              Waybill: <span className="font-mono font-semibold">{waybill}</span>
            </div>

            {/* PDF Size Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Label Size</CardTitle>
                <CardDescription>
                  Choose the size for your shipping label
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={pdfSize}
                  onValueChange={(value: PdfSize) => setPdfSize(value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="4R" id="4R" />
                    <Label htmlFor="4R" className="cursor-pointer flex-1">
                      <div className="font-semibold">4R Size (4×6 inches)</div>
                      <div className="text-sm text-gray-600">
                        Standard shipping label size
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="A4" id="A4" />
                    <Label htmlFor="A4" className="cursor-pointer flex-1">
                      <div className="font-semibold">A4 Size (8.27×11.69 inches)</div>
                      <div className="text-sm text-gray-600">
                        Full page format
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Output Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Output Format</CardTitle>
                <CardDescription>
                  Choose how you want to receive the label
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={outputType}
                  onValueChange={(value: 'pdf' | 'json') => setOutputType(value)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="cursor-pointer">
                      <div className="font-semibold">PDF Download</div>
                      <div className="text-sm text-gray-600">
                        Ready-to-print PDF file (recommended)
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="cursor-pointer">
                      <div className="font-semibold">Custom Preview</div>
                      <div className="text-sm text-gray-600">
                        Preview and customize label layout
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Label
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Label Preview</DialogTitle>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Label Data:</h3>
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handlePrintPreview} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Print Preview
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setOutputType('pdf');
                    setShowPreview(false);
                    handleGenerate();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
