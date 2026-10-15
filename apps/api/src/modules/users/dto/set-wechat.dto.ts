import { IsString, Matches } from "class-validator";

/** Código do PushPlus (token da "一对一推送") que o usuário copia no WeChat. */
export class SetWechatDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{16,64}$/, { message: "Código do WeChat inválido — copie o token completo do PushPlus." })
  token: string;
}
