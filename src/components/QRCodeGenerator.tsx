import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Download, 
  Copy, 
  MapPin, 
  AlertTriangle,
  Share2,
  Printer,
  Eye,
  RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  onClose?: () => void;
}

const QRCodeGenerator = ({ onClose }: QRCodeGeneratorProps) => {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [useCustomBase, setUseCustomBase] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => localStorage.getItem('qr_base_url') || '');
  const [rememberBase, setRememberBase] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-detect LAN IP for QR if frontend runs on localhost
  const [lanIp, setLanIp] = useState<string | null>(null);
  useEffect(() => {
    const fetchHostInfo = async () => {
      try {
        const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
        const resp = await fetch(`${apiBase.replace(/\/$/, '')}/host-info`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (data?.lanIPv4) setLanIp(data.lanIPv4);
      } catch {}
    };
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      fetchHostInfo();
    }
  }, []);

  const categories = [
    'Road Maintenance',
    'Lighting', 
    'Waste Management',
    'Water & Utilities',
    'Traffic',
    'Infrastructure',
    'Other'
  ];

  const generateQRCode = async () => {
    if (!location.trim() && !autoDetect) {
      toast.error('Please enter a location or enable Auto-detect');
      return;
    }

    setIsGenerating(true);

    try {
      // Create URL that will auto-fill the report form
      let baseUrl = (useCustomBase && /^https?:\/\//i.test(customBaseUrl)) ? customBaseUrl.replace(/\/$/, '') : window.location.origin;
      if (!useCustomBase && lanIp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        baseUrl = baseUrl.replace('localhost', lanIp).replace('127.0.0.1', lanIp);
      }
      const params = new URLSearchParams();
      params.set('view', 'report');
      params.set('category', category || 'Other');
      if (!autoDetect && location.trim()) params.set('location', location.trim());
      if (description.trim()) params.set('description', description.trim());
      if (autoDetect) params.set('autodetect', '1');

      const reportUrl = `${baseUrl}/report?${params.toString()}`;
      
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(reportUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeUrl(qrCodeDataUrl);
      
      // Also draw on canvas for download functionality
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, reportUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }

      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `qr-code-${location.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrCodeUrl;
    link.click();
    
    toast.success('QR Code downloaded');
  };

  const copyQRCodeUrl = async () => {
    if (!qrCodeUrl) return;

    try {
      // Create URL for sharing
      let baseUrl = (useCustomBase && /^https?:\/\//i.test(customBaseUrl)) ? customBaseUrl.replace(/\/$/, '') : window.location.origin;
      if (!useCustomBase && lanIp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        baseUrl = baseUrl.replace('localhost', lanIp).replace('127.0.0.1', lanIp);
      }
      const params = new URLSearchParams();
      params.set('view', 'report');
      params.set('category', category || 'Other');
      if (!autoDetect && location.trim()) params.set('location', location.trim());
      if (description.trim()) params.set('description', description.trim());
      if (autoDetect) params.set('autodetect', '1');
      const shareUrl = `${baseUrl}/report?${params.toString()}`;

      await navigator.clipboard.writeText(shareUrl);
      toast.success('Report URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const printQRCode = () => {
    if (!qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${location}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .header { 
              margin-bottom: 20px; 
              border-bottom: 2px solid #ccc;
              padding-bottom: 15px;
            }
            .qr-container { 
              margin: 20px 0; 
            }
            .footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #ccc;
              color: #666;
              font-size: 14px;
            }
            .badge {
              background: #f0f0f0;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              margin: 0 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🏛️ Civic Issue Report</h2>
            <h3>${location}</h3>
            ${category ? `<span class="badge">${category}</span>` : ''}
            ${description ? `<p style="margin: 10px 0; color: #666;">${description}</p>` : ''}
          </div>
          
          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 300px;" />
          </div>
          
          <div class="footer">
            <p><strong>📱 Scan to Report Issues</strong></p>
            <p>Scan this QR code with your smartphone to quickly report civic issues at this location.</p>
            <p>Generated by Urban Guardians - Municipal Issue Reporting System</p>
            <p style="font-size: 12px; color: #999;">Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Delay print to ensure image loads
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast.success('Opening print dialog...');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            QR Code Generator
          </CardTitle>
          <CardDescription>
            Generate QR codes for physical locations to enable quick civic issue reporting
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Enter specific location (e.g., Main Street Bus Stop)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 text-foreground placeholder:text-muted-foreground caret-primary"
                    style={{ color: 'hsl(var(--foreground))' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Be specific about the location for better reporting accuracy
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Expected Issue Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-foreground">
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description Template</Label>
                <Textarea
                  id="description"
                  placeholder="Optional: Add a description template for this location"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  This will be pre-filled in the report form when users scan the QR code
                </p>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} />
                    Auto-detect location on scan
                  </label>
                  <span className="text-xs text-muted-foreground">{autoDetect ? 'QR will request GPS on the user\'s device' : 'QR will include this address as fallback'}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={useCustomBase} onChange={(e) => setUseCustomBase(e.target.checked)} />
                    Use custom base URL for phone access
                  </label>
                  <span className="text-xs text-muted-foreground">e.g., http://192.168.1.20:8080</span>
                </div>

                {useCustomBase && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input 
                      placeholder="http://192.168.x.x:8080"
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      className="md:col-span-2"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" checked={rememberBase} onChange={(e) => setRememberBase(e.target.checked)} />
                        Remember
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        if (rememberBase && customBaseUrl) {
                          localStorage.setItem('qr_base_url', customBaseUrl);
                        }
                        const testUrl = (customBaseUrl || window.location.origin) + '/report';
                        window.open(testUrl, '_blank');
                      }}>Test</Button>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                onClick={generateQRCode}
                disabled={isGenerating || (!location.trim() && !autoDetect)}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </div>

            {/* QR Code Display Section */}
            <div className="space-y-4">
              {qrCodeUrl ? (
                <div className="space-y-4">
                  {/* QR Code Display */}
                  <div className="bg-white text-black p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="Generated QR Code" 
                      className="mx-auto max-w-full h-auto"
                      style={{ maxWidth: '300px' }}
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {location && (
                        <Badge variant="outline" className="text-xs text-black border-gray-300 max-w-[280px] truncate">
                          📍 {location}
                        </Badge>
                      )}
                      {category && (
                        <Badge className="text-xs ml-0 bg-gray-100 text-gray-800 border border-gray-300">
                          {category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadQRCode}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>

                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={printQRCode}
                      className="flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>

                    <Button
                      variant="outline"
                      size="sm" 
                      onClick={copyQRCodeUrl}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: `Report Issues at ${location}`,
                            text: `Scan QR code to report civic issues at ${location}`,
                            url: window.location.href
                          });
                        } else {
                          copyQRCodeUrl();
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      📱 How to Use
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Print and place the QR code at the physical location</li>
                      <li>• Citizens can scan with their smartphone camera</li>
                      <li>• Report form will auto-fill with location details</li>
                      <li>• Enables quick and accurate issue reporting</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 p-12 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    QR code will appear here after generation
                  </p>
                </div>
              )}

              {/* Hidden canvas for download functionality */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Use Cases */}
          <div className="border-t pt-6">
            <h4 className="font-medium mb-3">💡 Ideal Use Cases</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>Recurring issue hotspots</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Bus stops and transit areas</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <span>Public parks and facilities</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500" />
                  <span>Construction sites</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;