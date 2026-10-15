import { Injectable, Logger } from "@nestjs/common";

export interface WechatMessage {
  title: string;
  /** Linhas de texto puro — o HTML é montado aqui, com escape. */
  lines: string[];
  /** Link para abrir o sistema. */
  action?: { label: string; url: string };
}

const PUSHPLUS_URL = "https://www.pushplus.plus/send";
const TIMEOUT_MS = 10_000;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Avisos no WeChat pessoal via PushPlus (pushplus.plus): cada usuário segue a
 * conta do serviço no WeChat e cola no perfil o código dele. O WeChat não tem
 * API oficial para conta pessoal, então é o serviço que entrega a mensagem.
 * Como no e-mail, falha de envio só vai para o log — nunca desfaz uma aprovação.
 */
@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  /** Dispara sem bloquear quem chamou; erros só no log. */
  send(tokens: Array<string | null | undefined>, message: WechatMessage): void {
    const unique = [...new Set(tokens.filter((token): token is string => Boolean(token)))];
    for (const token of unique) {
      void this.deliver(token, message).catch((error: unknown) =>
        this.logger.warn(`WeChat não enviado (${message.title}): ${error instanceof Error ? error.message : error}`),
      );
    }
  }

  /** Envia e espera a resposta — usado para conferir o código que o usuário colou. */
  async deliver(token: string, message: WechatMessage): Promise<void> {
    const response = await fetch(PUSHPLUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        title: message.title,
        content: this.html(message),
        template: "html",
        channel: "wechat",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`PushPlus respondeu ${response.status}`);
    const body = (await response.json()) as { code?: number; msg?: string };
    if (body.code !== 200) throw new Error(body.msg || `PushPlus recusou (código ${body.code})`);
  }

  private html(message: WechatMessage): string {
    const lines = message.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    const action = message.action
      ? `<p><a href="${escapeHtml(message.action.url)}">${escapeHtml(message.action.label)}</a></p>`
      : "";
    return lines + action;
  }
}
