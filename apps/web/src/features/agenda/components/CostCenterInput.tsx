import { forwardRef, useId } from 'react';
import { Input, type InputProps } from '@/components/ui/Input';
import { useObras } from '../hooks/useAgenda';

/**
 * Campo de texto livre para obra / centro de custo, com sugestões (datalist)
 * dos valores já usados na empresa — evita "Obra Alfa" e "obra alfa" virarem
 * centros diferentes nos relatórios.
 */
export const CostCenterInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const listId = useId();
  const { data: obras } = useObras();
  return (
    <>
      <Input ref={ref} list={listId} autoComplete="off" {...props} />
      <datalist id={listId}>
        {(obras ?? []).map((obra) => (
          <option key={obra} value={obra} />
        ))}
      </datalist>
    </>
  );
});
CostCenterInput.displayName = 'CostCenterInput';
