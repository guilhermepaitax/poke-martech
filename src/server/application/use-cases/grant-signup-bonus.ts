import type { WalletRepository } from "@/server/application/contracts/repositories/wallet-repository";
import { SIGNUP_BONUS } from "@/lib/value-objects/card";
import { success, type Result } from "@/server/shared/result";

class GrantSignupBonus {
  constructor(private readonly wallets: WalletRepository) {}

  async execute(input: { userId: string }): Promise<Result<void>> {
    await this.wallets.grantSignupBonus(input.userId, SIGNUP_BONUS);
    return success(undefined);
  }
}

export { GrantSignupBonus };
