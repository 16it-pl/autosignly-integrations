/**
 * One edge of a paged query result.
 *
 * Spelled out rather than inferred on purpose. `yarn twenty apply` rewrites
 * twenty-client-sdk inside node_modules with a client that knows this
 * application's objects, so on a machine that has run it these callbacks infer
 * their types and on a clean checkout they do not. Anything relying on that
 * inference compiles for the author and fails in CI.
 */
export type Edge<TNode> = { node?: TNode | null } | null | undefined;
