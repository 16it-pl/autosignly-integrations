import { type CoreApiClient } from 'twenty-client-sdk/core';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';

import { SR_SIGNED_DOCUMENT_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { createAutosignlyClient } from 'src/logic-functions/utils/create-autosignly-client.util';

const ATTACHMENT_FILE_FIELD_UNIVERSAL_IDENTIFIER =
  '20202020-15db-460e-8166-c7b5d87ad4be';

const asPdfName = (name: string): string =>
  name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;

// The closing seal is still running; anything else is as final as it gets,
// a failed seal included, since nothing more arrives without a manual retry.
const SEAL_IN_PROGRESS_STATUSES = [
  'AWAITING_FINAL_USB_SIGN',
  'NEED_RETRY_USB_FINALIZE',
];
const SEAL_POLL_INTERVAL_MS = 3_000;
const SEAL_POLL_ATTEMPTS = 10;

/**
 * Holds off until the closing organisational seal is on the document.
 *
 * Autosignly now emits DOCUMENT_ALL_SIGNATURES_DONE at the end of finalization,
 * so against a current backend the first look already reports a sealed document
 * and this returns immediately. It stays because the app is published
 * separately from the API: an installation talking to a backend from before
 * that change still receives the event as the last signature commits, while the
 * seal that replaces the file once more is still running.
 */
export const waitForFinalSeal = async (
  autosignlyDocumentId: string,
): Promise<void> => {
  const client = createAutosignlyClient();

  for (let attempt = 0; attempt < SEAL_POLL_ATTEMPTS; attempt++) {
    const { status } = await client.getDocument(autosignlyDocumentId);

    if (!status || !SEAL_IN_PROGRESS_STATUSES.includes(status)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, SEAL_POLL_INTERVAL_MS));
  }

  console.warn(
    `[autosignly] the closing seal on document ${autosignlyDocumentId} is still running; storing the file as it stands`,
  );
};

export const downloadSignedPdf = async (
  autosignlyDocumentId: string,
): Promise<Buffer> =>
  Buffer.from(await createAutosignlyClient().downloadDocument(autosignlyDocumentId));

export const storeSignedDocumentOnRequest = async ({
  coreClient,
  signatureRequestId,
  signedPdf,
  documentName,
}: {
  coreClient: CoreApiClient;
  signatureRequestId: string;
  signedPdf: Buffer;
  documentName: string;
}): Promise<void> => {
  const fileName = asPdfName(documentName);

  const uploaded = await new MetadataApiClient().uploadFile(
    signedPdf,
    fileName,
    'application/pdf',
    SR_SIGNED_DOCUMENT_FIELD_UNIVERSAL_IDENTIFIER,
  );

  await coreClient.mutation({
    updateSignatureRequest: {
      __args: {
        id: signatureRequestId,
        data: { signedDocument: [{ fileId: uploaded.id, label: fileName }] },
      },
      id: true,
    },
  });
};

/**
 * Writes the document as Autosignly now holds it back over the attachment it
 * was sent from.
 *
 * Called after every signature, not only the last one: Autosignly replaces the
 * stored PDF as each person signs, so a document two people out of three have
 * signed is already a different file, and the copy on the record would
 * otherwise stay the unsigned original until the whole round finished.
 */
export const replaceSourceAttachment = async ({
  coreClient,
  attachmentId,
  signedPdf,
  documentName,
}: {
  coreClient: CoreApiClient;
  attachmentId: string;
  signedPdf: Buffer;
  documentName: string;
}): Promise<void> => {
  const { attachments } = await coreClient.query({
    attachments: {
      __args: { filter: { id: { eq: attachmentId } }, first: 1 },
      edges: { node: { id: true, name: true, file: { label: true } } },
    },
  });

  const attachment = attachments?.edges?.[0]?.node;

  if (!attachment) {
    // The attachment was deleted while the document was out for signature.
    // Not worth failing the delivery over: the signed PDF still lands on the
    // signature request itself.
    console.warn(
      `[autosignly] attachment ${attachmentId} is gone, keeping the signed file on the request only`,
    );

    return;
  }

  // Its own label is kept so the row does not rename itself under the user
  // mid-round; only the bytes behind it change.
  const label =
    attachment.file?.[0]?.label ?? attachment.name ?? asPdfName(documentName);

  const uploaded = await new MetadataApiClient().uploadFile(
    signedPdf,
    asPdfName(label),
    'application/pdf',
    ATTACHMENT_FILE_FIELD_UNIVERSAL_IDENTIFIER,
  );

  await coreClient.mutation({
    updateAttachment: {
      __args: {
        id: attachmentId,
        data: { file: [{ fileId: uploaded.id, label }] },
      },
      id: true,
    },
  });
};
