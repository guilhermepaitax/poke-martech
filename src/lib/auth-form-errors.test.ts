import { authApiErrorMessage, authFieldErrors } from "@/lib/auth-form-errors";
import { describe, expect, it } from "vitest";

const empty = {
  email: "",
  password: "",
  name: "",
  username: "",
  imageUseConsent: false,
};

describe("auth form errors", () => {
  it("traduz os erros de login do Better Auth", () => {
    expect(
      authApiErrorMessage("sign-in", {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    ).toBe("E-mail ou senha incorretos.");
    expect(
      authApiErrorMessage("sign-in", {
        message:
          "You have been banned from this application. Please contact support if you believe this is an error.",
      }),
    ).toBe(
      "Esta conta está suspensa. Fale com o suporte se achar que isso é um engano.",
    );
  });

  it("traduz e-mail e usuário duplicados no cadastro", () => {
    expect(
      authApiErrorMessage("sign-up", {
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists. Use another email.",
      }),
    ).toBe("Já existe uma conta com esse e-mail.");
    expect(
      authApiErrorMessage("sign-up", {
        code: "USERNAME_ALREADY_EXISTS",
        message: "Username already taken",
      }),
    ).toBe("Esse usuário já está em uso.");
  });

  it("preserva a mensagem de senha fraca e esconde texto inesperado em inglês", () => {
    expect(
      authApiErrorMessage("sign-up", {
        code: "WEAK_PASSWORD",
        message: "A senha ainda precisa de um número.",
      }),
    ).toBe("A senha ainda precisa de um número.");
    expect(
      authApiErrorMessage("sign-in", {
        message: "Something went wrong with the user session",
      }),
    ).toBe("Não foi possível entrar.");
  });

  it("exige os campos do cadastro em português", () => {
    expect(authFieldErrors("sign-up", empty)).toEqual({
      name: "Informe seu nome.",
      username: "Informe um usuário.",
      email: "Informe seu e-mail.",
      password: "A senha não atende aos requisitos.",
      imageUseConsent: "Aceite o uso da sua imagem para criar a conta.",
    });
  });

  it("aceita um cadastro válido e recusa e-mail malformado no login", () => {
    expect(
      authFieldErrors("sign-up", {
        name: "Ana Silva",
        username: "Ana-Silva",
        email: "ana@example.com",
        password: "Senha123",
        imageUseConsent: true,
      }),
    ).toEqual({});
    expect(
      authFieldErrors("sign-in", {
        ...empty,
        email: "ana",
        password: "senha",
      }),
    ).toEqual({ email: "Informe um e-mail válido." });
  });
});
