import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChangePassword from "./ChangePassword";

const completeNewPasswordMock = vi.fn();

vi.mock("../lib/auth", () => ({
  completeNewPassword: (...args: unknown[]) => completeNewPasswordMock(...args),
}));

const cognitoUser = {} as never;

function renderScreen() {
  const onSuccess = vi.fn();
  render(<ChangePassword cognitoUser={cognitoUser} onSuccess={onSuccess} />);
  return { onSuccess };
}

function fillForm(newPassword: string, confirmPassword: string) {
  fireEvent.change(screen.getByLabelText("新しいパスワード"), {
    target: { value: newPassword },
  });
  fireEvent.change(screen.getByLabelText("確認用パスワード"), {
    target: { value: confirmPassword },
  });
}

function submitButton() {
  return screen.getByRole("button", { name: "設定する" });
}

describe("ChangePassword", () => {
  beforeEach(() => {
    completeNewPasswordMock.mockReset();
  });

  it("disables submit when form is empty", () => {
    renderScreen();
    expect(submitButton()).toBeDisabled();
  });

  it("shows mismatch error and blocks submit before calling Cognito (state matrix: 2 field không khớp)", () => {
    renderScreen();
    fillForm("Passw0rd1", "Passw0rd2");

    expect(screen.getByText("パスワードが一致しません")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("keeps submit disabled when password does not meet policy even if fields match", () => {
    renderScreen();
    fillForm("alllowercase", "alllowercase");

    expect(submitButton()).toBeDisabled();
  });

  it("completes the challenge and calls onSuccess (UI-AUTH-02-1)", async () => {
    completeNewPasswordMock.mockResolvedValue({
      idToken: "x",
      accessToken: "y",
      refreshToken: "z",
    });
    const { onSuccess } = renderScreen();

    fillForm("Passw0rd1", "Passw0rd1");
    expect(submitButton()).not.toBeDisabled();
    fireEvent.click(submitButton());

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(completeNewPasswordMock).toHaveBeenCalledWith(cognitoUser, "Passw0rd1");
  });

  it("shows the policy error message on InvalidPasswordException (UI-AUTH-02-2)", async () => {
    const error = new Error("rejected");
    error.name = "InvalidPasswordException";
    completeNewPasswordMock.mockRejectedValue(error);
    const { onSuccess } = renderScreen();

    fillForm("Passw0rd1", "Passw0rd1");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(
        screen.getByText(
          "パスワードの条件を満たしていません（8文字以上、大文字・小文字・数字を含む）",
        ),
      ).toBeInTheDocument();
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByLabelText("新しいパスワード")).not.toBeDisabled();
  });

  it("disables inputs and button while submitting", async () => {
    let resolveChallenge!: (value: unknown) => void;
    completeNewPasswordMock.mockReturnValue(
      new Promise((resolve) => {
        resolveChallenge = resolve;
      }),
    );
    renderScreen();

    fillForm("Passw0rd1", "Passw0rd1");
    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByLabelText("新しいパスワード")).toBeDisabled();
      expect(screen.getByLabelText("確認用パスワード")).toBeDisabled();
      expect(submitButton()).toBeDisabled();
    });

    resolveChallenge({ idToken: "x", accessToken: "y", refreshToken: "z" });
  });
});
