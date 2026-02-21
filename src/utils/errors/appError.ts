export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}