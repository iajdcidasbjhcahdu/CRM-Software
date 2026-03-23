export class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  send(res) {
    const body = { success: this.success, message: this.message };
    if (this.data !== null) body.data = this.data;
    return res.status(this.statusCode).json(body);
  }
}

// Quick helpers
export const ok = (res, message, data) => new ApiResponse(200, message, data).send(res);
export const created = (res, message, data) => new ApiResponse(201, message, data).send(res);
