import { AutosignlyError, ConnectionError, InvalidSignatureError } from '@16it/autosignly';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { INode } from 'n8n-workflow';

/**
 * Map an error raised by the Autosignly SDK to the n8n error the workflow
 * expects: a config/connectivity problem (bad signature, unreachable host)
 * becomes a NodeOperationError, an API-level rejection (auth, validation,
 * rate limit, ...) becomes a NodeApiError so its HTTP status is visible.
 *
 * `error.message` already carries the useful cause (ConnectionError embeds
 * the address it failed to reach) — this only adds n8n's own itemIndex and
 * errorType/errorId context, never discards it.
 */
export function toNodeError(node: INode, error: unknown, itemIndex: number): Error {
	if (error instanceof AutosignlyError) {
		const description = [
			error.errorType,
			error.errorId ? `errorId=${error.errorId}` : undefined,
		]
			.filter(Boolean)
			.join(' · ');

		if (error instanceof ConnectionError || error instanceof InvalidSignatureError) {
			return new NodeOperationError(node, error.message, {
				itemIndex,
				description: description || undefined,
			});
		}

		return new NodeApiError(
			node,
			{ message: error.message, description },
			{
				itemIndex,
				httpCode: error.statusCode !== undefined ? String(error.statusCode) : undefined,
			},
		);
	}

	if (error instanceof Error) {
		return new NodeOperationError(node, error, { itemIndex });
	}

	return new NodeOperationError(node, String(error), { itemIndex });
}

/** Split a comma-separated field into trimmed, non-empty values. */
export function splitList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}
