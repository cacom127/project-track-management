import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "./Login";

const loginMock = vi.fn();

vi.mock("../lib/auth", () => ({
  login: (...args: unknown[]) => loginMock(...args),
}));

function renderLogin() {
  const onLoginSuccess = vi.fn();
  const onNewPasswordRequired = vi.fn();
  render(<Login onLoginSuccess={onLoginSuccess} onNewPasswordRequired={onNewPasswordRequired} />);
  return { onLoginSuccess, onNewPasswordRequired };
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("メールアドレス"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("パスワード"), { target: { value: password } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
}

describe("Login", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("calls login and onLoginSuccess on success (UI-AUTH-01-1)", async () => {
    loginMock.mockResolvedValue({ status: "success", tokens: {} });
    const { onLoginSuccess } = renderLogin();

    fillForm("user@vnext.vn", "password123");
    submit();

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalled());
    expect(loginMock).toHaveBeenCalledWith("user@vnext.vn", "password123");
  });

  it("disables inputs and button while submitting (UI-AUTH-01-4)", async () => {
    let resolveLogin!: (value: unknown) => void;
    loginMock.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderLogin();

    fillForm("user@vnext.vn", "password123");
    submit();

    await waitFor(() => {
      expect(screen.getByLabelText("メールアドレス")).toBeDisabled();
      expect(screen.getByLabelText("パスワード")).toBeDisabled();
      expect(screen.getByRole("button", { name: "ログイン" })).toBeDisabled();
    });

    resolveLogin({ status: "success", tokens: {} });
  });

  it("navigates to change-password challenge without treating it as error (UI-AUTH-01-2)", async () => {
    const cognitoUser = {};
    loginMock.mockResolvedValue({ status: "newPasswordRequired", cognitoUser });
    const { onNewPasswordRequired, onLoginSuccess } = renderLogin();

    fillForm("user@vnext.vn", "temp-password");
    submit();

    await waitFor(() => expect(onNewPasswordRequired).toHaveBeenCalledWith(cognitoUser));
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText(/正しくありません/)).not.toBeInTheDocument();
  });

  it("shows inline error under password field on wrong credentials, keeps email (UI-AUTH-01-3)", async () => {
    const error = new Error("bad");
    error.name = "NotAuthorizedException";
    loginMock.mockRejectedValue(error);
    renderLogin();

    fillForm("user@vnext.vn", "wrong-password");
    submit();

    await waitFor(() => {
      expect(
        screen.getByText("メールアドレスまたはパスワードが正しくありません"),
      ).toBeInTheDocument();
    });
    expect(screen.getByLabelText("メールアドレス")).toHaveValue("user@vnext.vn");
    expect(screen.getByLabelText("メールアドレス")).not.toBeDisabled();
  });

  it("shows the same message for UserNotFoundException (does not leak account existence)", async () => {
    const error = new Error("bad");
    error.name = "UserNotFoundException";
    loginMock.mockRejectedValue(error);
    renderLogin();

    fillForm("nobody@vnext.vn", "password123");
    submit();

    await waitFor(() => {
      expect(
        screen.getByText("メールアドレスまたはパスワードが正しくありません"),
      ).toBeInTheDocument();
    });
  });

  it("shows a generic error message on unexpected/network error", async () => {
    loginMock.mockRejectedValue(new Error("network down"));
    renderLogin();

    fillForm("user@vnext.vn", "password123");
    submit();

    await waitFor(() => {
      expect(
        screen.getByText("エラーが発生しました。しばらくしてから再度お試しください"),
      ).toBeInTheDocument();
    });
  });
});
