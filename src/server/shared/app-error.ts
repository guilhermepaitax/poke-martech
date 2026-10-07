class AppError {
  constructor(
    readonly code: string,
    readonly message: string,
    readonly statusCode: number = 500,
  ) {}
}

class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado.") {
    super("UNAUTHORIZED", message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Sem permissão.") {
    super("FORBIDDEN", message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} não encontrado.`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
  }
}

export {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
};
