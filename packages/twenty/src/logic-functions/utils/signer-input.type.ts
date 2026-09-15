export type SignerInput = {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  phoneNumber?: string;
  signatureType?: string;
  verificationMethod?: string;
  order?: number;
  personId?: string;
};

export type SendForSignatureInput = {
  objectType?: 'person' | 'company' | 'opportunity' | 'generic';
  recordId?: string;
  documentName?: string;
  attachmentId?: string;
  attachmentName?: string;
  fileUrl?: string;
  signers?: SignerInput[];
};

export type SendForSignatureResult = {
  success: boolean;
  signatureRequestId?: string;
  autosignlyDocumentId?: string;
  /** Present for the first signer. In a sandbox it is the only way to sign. */
  signingUrl?: string;
  signingUrlExpiresAt?: string;
  environmentType?: string;
  error?: string;
};
