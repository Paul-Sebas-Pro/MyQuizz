// Classe de base pour les erreurs http client
export class HttpClientError extends Error {
  status: number;
  name: string;

  constructor(message: string, { status } : { status: number}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

// 404 - not found
export class NotFoundError extends HttpClientError {
  constructor(message: string) {
    super(message, {status: 404});
  }
}


// 409 - conflit
export class ConflictError extends HttpClientError {
  constructor(message: string) {
    super(message, {status: 409});
  }
}

// 400 - bad request
export class BadRequestError extends HttpClientError {
  constructor(message: string) {
    super(message, {status: 400});
  }
}

// 401 - unauthorized
export class UnAuthorizedError extends HttpClientError {
  constructor(message: string) {
    super(message, {status: 401});
  }
}

// 403 - forbidden
export class ForbiddenError extends HttpClientError {
  constructor(message: string) {
    super(message, { status: 403 });
  }
}