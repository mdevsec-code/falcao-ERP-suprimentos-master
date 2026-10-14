import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Pencil, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { cn } from '@/utils/cn';
import { useCreateDiscipline, useDisciplines, useUpdateDiscipline } from '../hooks/useDisciplines';

interface DisciplinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Gestão da lista de disciplinas (Civil, Elétrica…): criar, renomear e desativar. */
export function DisciplinesDialog({ open, onOpenChange }: DisciplinesDialogProps) {
  const { t } = useTranslation('products');
  const list = useDisciplines(true);
  const create = useCreateDiscipline();
  const update = useUpdateDiscipline();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; nome: string } | null>(null);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const nome = newName.trim();
    if (nome.length < 2) return;
    create.mutate(nome, { onSuccess: () => setNewName('') });
  }

  function handleRename(event: FormEvent) {
    event.preventDefault();
    if (!editing || editing.nome.trim().length < 2) return;
    update.mutate(
      { id: editing.id, patch: { nome: editing.nome.trim() } },
      { onSuccess: () => setEditing(null) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('products:disciplines.title')}</DialogTitle>
          <DialogDescription>{t('products:disciplines.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <Input
            label={t('products:disciplines.newLabel')}
            placeholder={t('products:disciplines.newPlaceholder')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
            name="new-discipline"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            isLoading={create.isPending}
            disabled={newName.trim().length < 2}
          >
            {t('products:disciplines.add')}
          </Button>
        </form>

        <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-md border border-border">
          {list.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <li key={idx} className="p-3">
                <Skeleton className="h-5 w-full" />
              </li>
            ))}
          {list.data?.map((discipline) => (
            <li
              key={discipline.id}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5',
                !discipline.isActive && 'opacity-60',
              )}
            >
              {editing?.id === discipline.id ? (
                <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
                  <Input
                    aria-label={t('products:disciplines.renameAria', { name: discipline.nome })}
                    value={editing.nome}
                    onChange={(e) => setEditing({ id: discipline.id, nome: e.target.value })}
                    maxLength={60}
                    name={`discipline-${discipline.id}`}
                    className="flex-1"
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- foco vai direto para o campo que o usuário pediu para editar
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    aria-label={t('common:actions.save')}
                    isLoading={update.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t('common:actions.cancel')}
                    onClick={() => setEditing(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{discipline.nome}</p>
                    <p className="text-xs text-ink-soft">
                      {t('products:disciplines.productCount', { count: discipline.productCount })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('products:disciplines.renameAria', { name: discipline.nome })}
                    onClick={() => setEditing({ id: discipline.id, nome: discipline.nome })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Switch
                    checked={discipline.isActive}
                    onCheckedChange={(isActive) =>
                      update.mutate({ id: discipline.id, patch: { isActive } })
                    }
                    aria-label={t('products:disciplines.activeAria', { name: discipline.nome })}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-soft">{t('products:disciplines.inactiveHint')}</p>
      </DialogContent>
    </Dialog>
  );
}
