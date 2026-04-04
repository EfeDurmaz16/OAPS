export interface HeaderRecord {
  [key: string]: string;
}

export interface ResponseOrInit<TStatus extends number = number> extends ResponseInit {
  status?: TStatus;
}

export class HonoRequest {
  constructor(private readonly request: Request, private readonly paramsMap: Record<string, string>) {}

  header(name: string): string | undefined {
    return this.request.headers.get(name) ?? undefined;
  }

  param(name: string): string {
    return this.paramsMap[name] ?? '';
  }

  async json<T>(): Promise<T> {
    return this.request.json() as Promise<T>;
  }
}

export class Context {
  req: HonoRequest;

  constructor(request: Request, params: Record<string, string>) {
    this.req = new HonoRequest(request, params);
  }

  json(object: unknown, init?: number | ResponseOrInit): Response {
    const responseInit = typeof init === 'number' ? { status: init } : (init ?? {});
    return new Response(JSON.stringify(object), {
      ...responseInit,
      headers: {
        'content-type': 'application/json',
        ...(responseInit.headers ?? {}),
      },
    });
  }

  newResponse(body: BodyInit | null, init?: number | ResponseOrInit, headers?: HeaderRecord): Response {
    const responseInit = typeof init === 'number' ? { status: init } : (init ?? {});
    return new Response(body, {
      ...responseInit,
      headers: {
        ...(responseInit.headers ?? {}),
        ...(headers ?? {}),
      },
    });
  }
}

type Handler = (context: Context) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

function compilePath(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const patternSource = path
    .replace(/\/:([^/]+)/g, (_match, paramName) => {
      paramNames.push(paramName);
      return '/([^/]+)';
    })
    .replace(/\//g, '\\/');

  return {
    pattern: new RegExp(`^${patternSource}$`),
    paramNames,
  };
}

export class Hono {
  private readonly routes: Route[] = [];

  get(path: string, handler: Handler): void {
    const compiled = compilePath(path);
    this.routes.push({ method: 'GET', pattern: compiled.pattern, paramNames: compiled.paramNames, handler });
  }

  post(path: string, handler: Handler): void {
    const compiled = compilePath(path);
    this.routes.push({ method: 'POST', pattern: compiled.pattern, paramNames: compiled.paramNames, handler });
  }

  async request(input: string | Request, init?: RequestInit): Promise<Response> {
    const request = input instanceof Request
      ? input
      : new Request(new URL(input, 'http://localhost').toString(), init);
    return this.fetch(request);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = this.routes.find((candidate) => {
      return candidate.method === request.method && candidate.pattern.test(url.pathname);
    });

    if (!route) {
      return new Response(JSON.stringify({
        code: 'NOT_FOUND',
        category: 'discovery',
        message: 'Route not found',
        retryable: false,
      }), {
        status: 404,
        headers: {
          'content-type': 'application/json',
        },
      });
    }

    const match = url.pathname.match(route.pattern);
    const params = Object.fromEntries(route.paramNames.map((name, index) => [name, match?.[index + 1] ?? '']));
    const context = new Context(request, params);
    return route.handler(context);
  }
}
