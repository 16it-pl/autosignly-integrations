import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  SG_STATUS_PENDING,
  SR_STATUS_FAILED,
  SR_STATUS_SENT,
} from 'src/constants/universal-identifiers';
import { createAutosignlyClient } from 'src/logic-functions/utils/create-autosignly-client.util';
import { describeAutosignlyError } from 'src/logic-functions/utils/describe-autosignly-error.util';
import { fetchAttachmentBytes } from 'src/logic-functions/utils/fetch-attachment-bytes.util';
import { findOpenRequestsByAttachment } from 'src/logic-functions/utils/open-signature-requests.util';
import {
  type SendForSignatureInput,
  type SendForSignatureResult,
  type SignerInput,
} from 'src/logic-functions/utils/signer-input.type';

const validateSigners = (signers: SignerInput[]): string | null => {
  if (signers.length === 0) {
    return 'Add at least one signer.';
  }

  for (const signer of signers) {
    const signerName =
      `${signer.firstName ?? ''} ${signer.lastName ?? ''}`.trim();

    if (!signer.email?.includes('@')) {
      return `${signerName || 'This signer'} needs an email address.`;
    }

    if (!signer.country || signer.country.length !== 2) {
      return `${signer.email} needs a two-letter country code.`;
    }

    // An SMS code to an unsupported number is only refused when the signer
    // asks for it, long after the document went out, so it is blocked here.
    if (
      signer.verificationMethod?.toUpperCase().includes('SMS') &&
      !signer.phoneNumber
    ) {
      return `${signer.email} is verified by SMS and needs a phone number.`;
    }
  }

  return null;
};

export const sendForSignatureHandler = async (
  input: SendForSignatureInput,
): Promise<SendForSignatureResult> => {
  const signers = input.signers ?? [];
  const validationError = validateSigners(signers);

  if (validationError) {
    return { success: false, error: validationError };
  }

  if (!input.fileUrl) {
    return { success: false, error: 'Pick an attachment to send.' };
  }

  const documentName =
    input.documentName?.trim() || input.attachmentName?.trim() || 'Document';

  const coreClient = new CoreApiClient();

  // Checked here, not only in the form: the form can be stale, and two live
  // links for one file would leave two records each claiming to be the truth.
  if (input.attachmentId) {
    const openRequests = await findOpenRequestsByAttachment(coreClient, [
      input.attachmentId,
    ]);

    if (openRequests.has(input.attachmentId)) {
      return {
        success: false,
        error:
          'This attachment is already out for signature. Wait for it to finish, or cancel it in Autosignly, before sending it again.',
      };
    }
  }

  const relationInput =
    input.objectType === 'company'
      ? { companyId: input.recordId }
      : input.objectType === 'opportunity'
        ? { opportunityId: input.recordId }
        : input.objectType === 'person'
          ? { personId: input.recordId }
          : {};

  const { createSignatureRequest } = await coreClient.mutation({
    createSignatureRequest: {
      __args: {
        data: {
          name: documentName,
          sourceFileName: input.attachmentName ?? null,
          sourceAttachmentId: input.attachmentId ?? null,
          ...relationInput,
        },
      },
      id: true,
    },
  });

  const signatureRequestId = createSignatureRequest?.id;

  if (!signatureRequestId) {
    return { success: false, error: 'Could not create the signature request.' };
  }

  try {
    const pdf = await fetchAttachmentBytes(input.fileUrl);
    const autosignly = createAutosignlyClient();

    const signingResult = await autosignly.uploadAndSign({
      pdf,
      documentName,
      fileName: input.attachmentName ?? `${documentName}.pdf`,
      signers: signers.map((signer, index) => ({
        firstName: signer.firstName,
        lastName: signer.lastName,
        email: signer.email,
        country: signer.country.toUpperCase(),
        phoneNumber: signer.phoneNumber || undefined,
        signatureType: signer.signatureType || undefined,
        signatureVerificationMethod: signer.verificationMethod || undefined,
        order: signer.order ?? index + 1,
      })),
    });

    const autosignlyDocumentId = signingResult.documentId ?? '';

    // Only a sandbox hands back a signing link, and only for the signer whose
    // turn it is. In production the API returns none on purpose: the link
    // authorises signing by itself, so every signer is emailed their own.
    const firstLink = signingResult.signers.find((signer) => signer.sandboxSignUrl);

    const environmentType = await autosignly
      .describeCredentials()
      .then((credentials) => credentials.environmentType)
      .catch(() => undefined);

    await coreClient.mutation({
      updateSignatureRequest: {
        __args: {
          id: signatureRequestId,
          data: {
            status: SR_STATUS_SENT,
            autosignlyDocumentId,
            sentAt: new Date().toISOString(),
            environment: environmentType ?? null,
            signingLink: firstLink?.sandboxSignUrl
              ? {
                  primaryLinkUrl: firstLink.sandboxSignUrl,
                  primaryLinkLabel: `Sign as ${firstLink.email ?? signers[0].email}`,
                }
              : null,
            signingLinkExpiresAt: firstLink?.expiresAt ?? null,
          },
        },
        id: true,
      },
    });

    await Promise.all(
      signers.map((signer, index) =>
        coreClient.mutation({
          createDocumentSigner: {
            __args: {
              data: {
                name: `${signer.firstName} ${signer.lastName}`.trim(),
                email: signer.email,
                country: signer.country.toUpperCase(),
                phoneNumber: signer.phoneNumber ?? null,
                signatureType: signer.signatureType ?? null,
                verificationMethod: signer.verificationMethod ?? null,
                signingOrder: signer.order ?? index + 1,
                status: SG_STATUS_PENDING,
                signatureRequestId,
              },
            },
            id: true,
          },
        }),
      ),
    );

    return {
      success: true,
      signatureRequestId,
      autosignlyDocumentId,
      signingUrl: firstLink?.sandboxSignUrl,
      signingUrlExpiresAt: firstLink?.expiresAt,
      environmentType,
    };
  } catch (error) {
    const message = describeAutosignlyError(error);

    // The record is kept rather than deleted so the failure stays visible on
    // the source record instead of vanishing.
    await coreClient.mutation({
      updateSignatureRequest: {
        __args: {
          id: signatureRequestId,
          data: { status: SR_STATUS_FAILED, errorMessage: message.slice(0, 500) },
        },
        id: true,
      },
    });

    return { success: false, signatureRequestId, error: message };
  }
};
