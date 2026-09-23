'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateRFQPDF } from '@/lib/pdf-generator';
import type { RFQ } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface RFQPDFModalProps {
  rfq: RFQ | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RFQPDFModal({ rfq, open, onOpenChange }: RFQPDFModalProps) {
  const [dataUri, setDataUri] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [downloaded, setDownloaded] = useState<boolean>(false);

  useEffect(() => {
    if (rfq && open) {
      try {
        const { dataUri: uri, filename: fname } = generateRFQPDF(rfq);
        setDataUri(uri);
        setFilename(fname);
        setDownloaded(false);
      } catch (err) {
        console.error('PDF generation error:', err);
      }
    }
  }, [rfq, open]);

  if (!rfq) return null;

  const handleDownload = () => {
    try {
      const { blob, filename: fname } = generateRFQPDF(rfq);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      toast({ title: 'PDF Downloaded', description: `${fname} saved successfully.` });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <FileText className="h-5 w-5 text-primary" />
            Official RFQ Document Preview — {rfq.id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 my-4 overflow-hidden rounded-xl border border-border bg-card/60">
          {dataUri ? (
            <iframe
              src={dataUri}
              className="w-full h-full border-none"
              title={`RFQ Document ${rfq.id}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Generating PDF Document...</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            ProcureAI Document Generator • Auto-formatted PDF
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              {downloaded ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {downloaded ? 'Downloaded PDF' : 'Download Official PDF'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
