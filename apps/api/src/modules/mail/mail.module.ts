import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { WechatService } from "./wechat.service";

@Global()
@Module({
  providers: [MailService, WechatService],
  exports: [MailService, WechatService],
})
export class MailModule {}
