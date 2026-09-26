function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

function logEvent(event, context = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event,
      ...context,
    })
  );
}

function logError(event, error, context = {}) {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      event,
      error: serializeError(error),
      ...context,
    })
  );
}

module.exports = {
  logEvent,
  logError,
  serializeError,
};
