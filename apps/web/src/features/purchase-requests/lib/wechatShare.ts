import type { PurchaseRequestDetailDto } from '@falcao-erp/shared-types';

import i18n from '@/i18n';
import { routeTo } from '@/constants/routes';

/** O grupo lê nos dois idiomas, qualquer que seja o idioma de quem copia. */
const LANGUAGES = ['pt-BR', 'zh-CN'] as const;

/**
 * Texto pronto para colar num grupo do WeChat: número, título, situação
 * (com a etapa de assinatura), solicitante, projeto e o link do pedido —
 * em português e em chinês.
 */
export function wechatShareMessage(request: PurchaseRequestDetailDto, origin: string): string {
  const [pt, zh] = LANGUAGES.map((lng) => i18n.getFixedT(lng));
  const situation = (t: NonNullable<typeof pt>) =>
    request.status === 'AGUARDANDO_APROVACAO' && request.currentStep
      ? t('purchaseRequests:wechatShare.waiting', {
          step: t(`enums:approvalStep.${request.currentStep}`),
        })
      : t('purchaseRequests:wechatShare.status', {
          status: t(`enums:purchaseRequestStatus.${request.status}`),
        });
  const pair = (key: string) => `${pt!(key)} / ${zh!(key)}`;

  return [
    `【Falcão ERP】${pt!('purchaseRequests:wechatShare.header', { numero: request.numero })} · ${zh!(
      'purchaseRequests:wechatShare.header',
      { numero: request.numero },
    )}`,
    request.title,
    situation(pt!),
    situation(zh!),
    `${pair('purchaseRequests:wechatShare.requester')}: ${request.requesterName}`,
    ...(request.costCenter
      ? [`${pair('purchaseRequests:wechatShare.project')}: ${request.costCenter}`]
      : []),
    `${pair('purchaseRequests:wechatShare.items')}: ${request.items.length}`,
    `${origin}${routeTo.purchaseRequest(request.id)}`,
  ].join('\n');
}
