export class BusinessAccessError extends Error {
  constructor(public readonly code: "NOT_SIGNED_IN" | "MULTIPLE_BUSINESSES" | "NOT_MEMBER") {
    super(code);
    this.name = "BusinessAccessError";
  }
}
