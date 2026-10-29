import type { components, paths } from "./api.generated";

// Regenerate api.generated.ts with `npm run gen:api` whenever the backend contract changes.

export type Schemas = components["schemas"];

type Method = "get" | "post" | "put" | "patch" | "delete";
type Operation<P extends keyof paths, M extends Method> = NonNullable<paths[P][M]>;

type SuccessBody<O> = O extends { responses: infer R }
  ? {
      [K in keyof R]: K extends 200 | 201
        ? R[K] extends { content: { "application/json": infer B } }
          ? B
          : never
        : never;
    }[keyof R]
  : never;

/** Payload inside the backend's `{ success, message, data }` envelope for a 2xx response. */
export type ApiData<P extends keyof paths, M extends Method> =
  SuccessBody<Operation<P, M>> extends { data: infer D } ? D : never;

/** Raw 2xx body for routes the backend marks @RawResponse (not wrapped in the envelope). */
export type ApiRawBody<P extends keyof paths, M extends Method> = SuccessBody<Operation<P, M>>;

/** JSON request body for an operation. */
export type ApiBody<P extends keyof paths, M extends Method> =
  Operation<P, M> extends { requestBody?: { content: { "application/json": infer B } } }
    ? B
    : never;
