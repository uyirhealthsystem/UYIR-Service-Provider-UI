// The small part of STOMP 1.2 the driver app needs, sent over a plain WebSocket.

export type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

const NULL = "\0";

export function buildFrame(command: string, headers: Record<string, string> = {}): string {
  const lines = Object.entries(headers).map(([name, value]) => `${name}:${value}`);
  return `${[command, ...lines].join("\n")}\n\n${NULL}`;
}

/** Heartbeats are bare newlines, so they produce no frames. */
export function parseFrames(data: string): StompFrame[] {
  return data
    .split(NULL)
    .map((chunk) => chunk.replace(/^[\r\n]+/, ""))
    .filter(Boolean)
    .map((chunk) => {
      const bodyStart = chunk.search(/\r?\n\r?\n/);
      const head = bodyStart === -1 ? chunk : chunk.slice(0, bodyStart);
      const body = bodyStart === -1 ? "" : chunk.slice(bodyStart).replace(/^\r?\n\r?\n/, "");
      const [command, ...lines] = head.split(/\r?\n/);
      const headers: Record<string, string> = {};
      for (const line of lines) {
        const separator = line.indexOf(":");
        // STOMP keeps the first value when a header repeats.
        if (separator > 0 && !(line.slice(0, separator) in headers)) {
          headers[line.slice(0, separator)] = line.slice(separator + 1);
        }
      }
      return { command, headers, body };
    });
}
