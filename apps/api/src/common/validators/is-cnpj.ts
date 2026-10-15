import { registerDecorator, type ValidationOptions } from "class-validator";
import { isValidCnpj } from "@falcao-erp/shared-types";

/** CNPJ com ou sem máscara, com dígitos verificadores corretos. */
export function IsCnpj(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: "isCnpj",
      target: object.constructor,
      propertyName,
      options: { message: "CNPJ inválido.", ...options },
      validator: { validate: (value: unknown) => typeof value === "string" && isValidCnpj(value) },
    });
}
