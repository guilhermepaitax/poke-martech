import type { Actor } from "@/server/application/actor";
import {
  ForbiddenError,
  UnauthorizedError,
  type AppError,
} from "@/server/shared/app-error";
import { err, success, type Result } from "@/server/shared/result";

function requireUser(actor: Actor | null): Result<Actor, AppError> {
  if (!actor) return err(new UnauthorizedError());
  return success(actor);
}

function requireAdmin(actor: Actor | null): Result<Actor, AppError> {
  if (!actor) return err(new UnauthorizedError());
  if (actor.role !== "admin") return err(new ForbiddenError());
  return success(actor);
}

export { requireAdmin, requireUser };
