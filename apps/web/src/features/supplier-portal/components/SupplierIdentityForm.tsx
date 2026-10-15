import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { BRAZILIAN_STATES, SupplierCategory, isValidCnpj } from '@falcao-erp/shared-types';

import { SelectField } from '@/components/common/SelectField';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SUPPLIER_CATEGORY_LABELS } from '@/constants/enums';
import type { PublicIdentityPayload } from '@/features/quotations/types';
import { formatCNPJ, formatPhoneBR } from '@/utils/format';

interface SupplierIdentityFormProps {
  /** O CNPJ não está cadastrado: pede os dados da empresa. */
  needsRegistration: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (payload: PublicIdentityPayload) => void;
  /** Campos extras do formulário (ex.: arquivo do catálogo). */
  children?: ReactNode;
  disabled?: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Identificação do fornecedor nos links públicos: CNPJ + quem preenche. Se o
 * CNPJ for novo, abre o cadastro mínimo (fica pendente até compras aprovar).
 */
export function SupplierIdentityForm({
  needsRegistration,
  isSubmitting,
  submitLabel,
  onSubmit,
  children,
  disabled,
}: SupplierIdentityFormProps) {
  const { t } = useTranslation('supplierPortal');
  const [cnpj, setCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [categoria, setCategoria] = useState<string>('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [touched, setTouched] = useState(false);

  const errors = {
    cnpj: !isValidCnpj(cnpj) ? t('supplierPortal:identity.errors.cnpj') : undefined,
    nome: nome.trim().length < 2 ? t('supplierPortal:identity.errors.required') : undefined,
    ...(needsRegistration
      ? {
          razaoSocial:
            razaoSocial.trim().length < 3
              ? t('supplierPortal:identity.errors.required')
              : undefined,
          nomeFantasia:
            nomeFantasia.trim().length < 2
              ? t('supplierPortal:identity.errors.required')
              : undefined,
          cidade:
            cidade.trim().length < 2 ? t('supplierPortal:identity.errors.required') : undefined,
          estado: !estado ? t('supplierPortal:identity.errors.required') : undefined,
          email: !EMAIL.test(email.trim()) ? t('supplierPortal:identity.errors.email') : undefined,
          telefone:
            telefone.replace(/\D/g, '').length < 10
              ? t('supplierPortal:identity.errors.phone')
              : undefined,
        }
      : {}),
  };
  const valid = Object.values(errors).every((error) => !error);
  const show = (error: string | undefined) => (touched ? error : undefined);

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!valid || disabled) return;
    onSubmit({
      cnpj,
      nomeResponsavel: nome.trim(),
      cadastro: needsRegistration
        ? {
            razaoSocial: razaoSocial.trim(),
            nomeFantasia: nomeFantasia.trim(),
            categoria: categoria || undefined,
            cidade: cidade.trim(),
            estado,
            email: email.trim(),
            telefone,
          }
        : undefined,
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-5 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 text-brand-gold-700" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-ink">{t('supplierPortal:identity.title')}</h2>
          <p className="text-sm text-ink-soft">{t('supplierPortal:identity.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('supplierPortal:identity.cnpj')}
          value={cnpj}
          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          autoComplete="off"
          name="cnpj"
          error={show(errors.cnpj)}
          required
        />
        <Input
          label={t('supplierPortal:identity.name')}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoComplete="name"
          name="responsavel"
          maxLength={120}
          error={show(errors.nome)}
          required
        />
      </div>

      {needsRegistration && (
        <fieldset className="space-y-4 rounded-md border border-brand-gold-300 bg-brand-gold-50/50 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            {t('supplierPortal:identity.registrationTitle')}
          </legend>
          <p className="text-sm text-ink-soft">
            {t('supplierPortal:identity.registrationDescription')}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('supplierPortal:identity.razaoSocial')}
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              autoComplete="organization"
              name="razao-social"
              maxLength={180}
              error={show(errors.razaoSocial)}
              required
            />
            <Input
              label={t('supplierPortal:identity.nomeFantasia')}
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              name="nome-fantasia"
              maxLength={180}
              error={show(errors.nomeFantasia)}
              required
            />
            <SelectField
              id="supplier-category"
              label={t('supplierPortal:identity.categoria')}
              value={categoria}
              onChange={setCategoria}
              noneLabel={t('supplierPortal:identity.categoriaNone')}
              options={Object.values(SupplierCategory).map((value) => ({
                value,
                label: SUPPLIER_CATEGORY_LABELS[value],
              }))}
            />
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <Input
                label={t('supplierPortal:identity.cidade')}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                autoComplete="address-level2"
                name="cidade"
                maxLength={120}
                error={show(errors.cidade)}
                required
              />
              <SelectField
                id="supplier-state"
                label={t('supplierPortal:identity.estado')}
                value={estado}
                onChange={setEstado}
                options={BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }))}
                error={show(errors.estado)}
                required
              />
            </div>
            <Input
              type="email"
              label={t('supplierPortal:identity.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              name="email"
              maxLength={120}
              error={show(errors.email)}
              required
            />
            <Input
              type="tel"
              label={t('supplierPortal:identity.telefone')}
              value={telefone}
              onChange={(e) => setTelefone(formatPhoneBR(e.target.value))}
              autoComplete="tel"
              name="telefone"
              error={show(errors.telefone)}
              required
            />
          </div>
        </fieldset>
      )}

      {children}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
