/** Limite de qualquer upload — o mesmo `MAX_UPLOAD_BYTES` da API. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Envio de arquivo grande numa conexão lenta passa fácil dos 15 s padrão do cliente HTTP. */
export const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;
