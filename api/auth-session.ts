type UnauthorizedHandler = () => Promise<void> | void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let unauthorizedHandlerPromise: Promise<void> | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export function clearUnauthorizedHandler() {
  unauthorizedHandler = null;
}

export function isUnauthorizedStatus(statusCode?: number) {
  return statusCode === 401 || statusCode === 403;
}

export function triggerUnauthorizedHandler() {
  if (!unauthorizedHandler) {
    return Promise.resolve();
  }

  if (!unauthorizedHandlerPromise) {
    unauthorizedHandlerPromise = Promise.resolve(unauthorizedHandler()).finally(
      () => {
        unauthorizedHandlerPromise = null;
      },
    );
  }

  return unauthorizedHandlerPromise;
}
