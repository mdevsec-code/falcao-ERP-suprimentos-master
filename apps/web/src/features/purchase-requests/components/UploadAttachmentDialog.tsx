import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { FileField } from '@/components/common/FileField';
import { MAX_UPLOAD_BYTES } from '../types';

interface UploadAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => void;
  isSubmitting: boolean;
}

export function UploadAttachmentDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: UploadAttachmentDialogProps) {
  const { t } = useTranslation('purchaseRequests');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setFileError(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('purchaseRequests:attachments.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('purchaseRequests:attachments.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <FileField
          label={t('purchaseRequests:attachments.dialog.file')}
          file={file}
          onFileChange={setFile}
          maxSize={MAX_UPLOAD_BYTES}
          error={fileError}
          onError={setFileError}
          disabled={isSubmitting}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={!file}
            isLoading={isSubmitting}
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => file && onSubmit(file)}
          >
            {t('purchaseRequests:attachments.dialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
