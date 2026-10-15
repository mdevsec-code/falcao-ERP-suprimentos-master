import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

export interface MailMessage {
  to: string[];
  subject: string;
  /** Título grande no topo do e-mail. */
  heading: string;
  /** Parágrafos (texto puro — o HTML é montado aqui, com escape). */
  paragraphs: string[];
  /** Linhas "rótulo: valor" num quadro de resumo. */
  details?: Array<[string, string]>;
  /** Botão principal (abre o sistema). */
  action?: { label: string; url: string };
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * E-mails do sistema (aprovações do plano de aquisição). Sem SMTP configurado
 * nada é enviado e o motivo fica no log — o fluxo do sistema não depende do e-mail.
 * Falha de envio também só vai para o log: nunca desfaz a aprovação já gravada.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;
  readonly appUrl: string;

  constructor(config: ConfigService) {
    const host = config.get<string>("SMTP_HOST");
    this.appUrl = (config.get<string>("APP_URL") ?? config.get<string>("CORS_ORIGIN")?.split(",")[0] ?? "").replace(
      /\/$/,
      "",
    );
    this.from = config.get<string>("MAIL_FROM") ?? config.get<string>("SMTP_USER") ?? "no-reply@localhost";
    this.transporter = host
      ? createTransport({
          host,
          port: config.get<number>("SMTP_PORT") ?? 465,
          secure: config.get<boolean>("SMTP_SECURE") ?? true,
          auth: config.get<string>("SMTP_USER")
            ? { user: config.get<string>("SMTP_USER"), pass: config.get<string>("SMTP_PASS") }
            : undefined,
        })
      : null;
    if (!this.transporter) this.logger.warn("SMTP_HOST não configurado: e-mails de aprovação não serão enviados.");
  }

  /** Link para uma tela do sistema (ex.: `/solicitacoes/<id>`). */
  link(path: string): string {
    return `${this.appUrl}${path}`;
  }

  /** Dispara sem bloquear quem chamou; erros só no log. */
  send(message: MailMessage): void {
    const to = [...new Set(message.to.map((address) => address.trim().toLowerCase()).filter(Boolean))];
    if (to.length === 0) return;
    if (!this.transporter) {
      this.logger.log(`E-mail não enviado (sem SMTP): "${message.subject}" para ${to.join(", ")}`);
      return;
    }
    this.transporter
      .sendMail({ from: this.from, to, subject: message.subject, html: this.html(message), text: this.text(message) })
      .then(() => this.logger.log(`E-mail enviado: "${message.subject}" para ${to.join(", ")}`))
      .catch((error: unknown) =>
        this.logger.error(`Falha ao enviar "${message.subject}": ${error instanceof Error ? error.message : error}`),
      );
  }

  private text(message: MailMessage): string {
    return [
      message.heading,
      "",
      ...message.paragraphs,
      "",
      ...(message.details ?? []).map(([label, value]) => `${label}: ${value}`),
      "",
      ...(message.action ? [`${message.action.label}: ${message.action.url}`] : []),
    ].join("\n");
  }

  /** HTML simples, com estilo inline (o que os clientes de e-mail aceitam), nas cores da marca. */
  private html(message: MailMessage): string {
    const details = (message.details ?? [])
      .map(
        ([label, value]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#6b6b63;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0;color:#14140f;font-weight:600">${escapeHtml(value)}</td></tr>`,
      )
      .join("");
    const action = message.action
      ? `<p style="margin:24px 0"><a href="${escapeHtml(message.action.url)}" style="background:#14140f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;display:inline-block">${escapeHtml(message.action.label)}</a></p>`
      : "";
    return `<!doctype html><html><body style="margin:0;background:#f5f5f2;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e7e7e3">
<tr><td style="background:#14140f;padding:16px 24px;color:#fdbf2a;font-weight:700;font-size:15px;letter-spacing:.04em">FALCÃO SUPRIMENTOS</td></tr>
<tr><td style="height:4px;background:#fdbf2a"></td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#14140f">${escapeHtml(message.heading)}</h1>
${message.paragraphs.map((p) => `<p style="margin:0 0 10px;color:#14140f;font-size:14px;line-height:1.5">${escapeHtml(p)}</p>`).join("")}
${details ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">${details}</table>` : ""}
${action}
<p style="margin:16px 0 0;color:#6b6b63;font-size:12px">E-mail automático do sistema de suprimentos da Falcão — não responda.</p>
</td></tr></table></td></tr></table></body></html>`;
  }
}
