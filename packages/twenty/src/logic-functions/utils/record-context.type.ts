export type RecordContextObject =
  | 'person'
  | 'company'
  | 'opportunity'
  | 'generic';

export type AttachmentOption = {
  id: string;
  name: string;
  fileUrl: string;
  extension: string | null;
  /** Set while an earlier request for this file is still awaiting signatures. */
  openSignatureRequestId?: string | null;
};

export type SignerCandidate = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  country: string | null;
};

export type RecordContextResult = {
  success: boolean;
  recordName?: string;
  attachments?: AttachmentOption[];
  candidates?: SignerCandidate[];
  error?: string;
};
