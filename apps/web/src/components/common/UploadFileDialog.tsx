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
import { FileField } from './FileField';

export interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fileLabel: string;
  submitLabel: string;
  maxSize: number;
  onSubmit: (file: File) => void;
  isSubmitting: boolean;
}

/** Envio de um único arquivo (anexo, comprovante…) com validação de tamanho. */
export function UploadFileDialog({
  open,
  onOpenChange,
  title,
  description,
  fileLabel,
  submitLabel,
  maxSize,
  onSubmit,
  isSubmitting,
}: UploadFileDialogProps) {
  const { t } = useTranslation('common');
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <FileField
          label={fileLabel}
          file={file}
          onFileChange={setFile}
          maxSize={maxSize}
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
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
