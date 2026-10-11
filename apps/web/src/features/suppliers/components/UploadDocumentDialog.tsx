import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import { SupplierDocumentCategory } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { FileField } from '@/components/common/FileField';
import { DOCUMENT_CATEGORY_LABELS } from '@/constants/enums';
import { MAX_UPLOAD_BYTES } from '../types';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { file: File; category: SupplierDocumentCategory }) => void;
  isSubmitting: boolean;
}

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: UploadDocumentDialogProps) {
  const { t } = useTranslation('suppliers');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [category, setCategory] = useState<SupplierDocumentCategory>(
    SupplierDocumentCategory.OUTRO,
  );

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setFileError(null);
    setCategory(SupplierDocumentCategory.OUTRO);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('suppliers:documents.dialog.title')}</DialogTitle>
          <DialogDescription>{t('suppliers:documents.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FileField
            label={t('suppliers:documents.dialog.file')}
            file={file}
            onFileChange={setFile}
            maxSize={MAX_UPLOAD_BYTES}
            error={fileError}
            onError={setFileError}
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document-category">{t('suppliers:documents.dialog.category')}</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as SupplierDocumentCategory)}
            >
              <SelectTrigger id="document-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SupplierDocumentCategory).map((value) => (
                  <SelectItem key={value} value={value}>
                    {DOCUMENT_CATEGORY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!file}
            isLoading={isSubmitting}
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => file && onSubmit({ file, category })}
          >
            {t('suppliers:documents.dialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
