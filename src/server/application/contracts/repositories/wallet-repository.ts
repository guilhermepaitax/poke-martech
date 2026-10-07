interface WalletRepository {
  grantSignupBonus(userId: string, amount: number): Promise<void>;
}

export type { WalletRepository };
