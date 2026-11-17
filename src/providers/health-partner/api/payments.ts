import { healthPartnerApi } from "./client";

export function getWallet() {
  return healthPartnerApi("/payments");
}

export function getPaymentHistory() {
  return healthPartnerApi("/payments/history");
}

export function saveBankAccount(data: {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}) {
  return healthPartnerApi("/payments/bank", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function withdraw(amount: number) {
  return healthPartnerApi("/payments/withdraw", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export function getWithdrawals() {
  return healthPartnerApi("/payments/withdrawals");
}
