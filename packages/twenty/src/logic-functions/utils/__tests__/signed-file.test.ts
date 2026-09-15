import { beforeEach, describe, expect, it, vi } from 'vitest';

const uploadFile = vi.fn();
const getDocument = vi.fn();
const downloadDocument = vi.fn();

vi.mock('twenty-client-sdk/metadata', () => ({
  MetadataApiClient: class {
    uploadFile = uploadFile;
  },
}));

vi.mock('src/logic-functions/utils/create-autosignly-client.util', () => ({
  createAutosignlyClient: () => ({ getDocument, downloadDocument }),
}));

const { replaceSourceAttachment, waitForFinalSeal } = await import(
  'src/logic-functions/utils/signed-file.util'
);

type CoreClientStub = Parameters<typeof replaceSourceAttachment>[0]['coreClient'];

const coreClientWith = (label: string | null, name: string | null = null) => {
  const mutation = vi.fn().mockResolvedValue({});

  return {
    mutation,
    query: vi.fn().mockResolvedValue({
      attachments: {
        edges: [
          {
            node: {
              id: 'att-1',
              name,
              file: label === null ? [] : [{ label }],
            },
          },
        ],
      },
    }),
  };
};

describe('replaceSourceAttachment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadFile.mockResolvedValue({ id: 'file-2' });
  });

  it('should keep the label the attachment already carries', async () => {
    const coreClient = coreClientWith('Umowa najmu.pdf');

    await replaceSourceAttachment({
      coreClient: coreClient as unknown as CoreClientStub,
      attachmentId: 'att-1',
      signedPdf: Buffer.from('signed'),
      documentName: 'Something else entirely',
    });

    expect(coreClient.mutation).toHaveBeenCalledWith({
      updateAttachment: {
        __args: {
          id: 'att-1',
          data: { file: [{ fileId: 'file-2', label: 'Umowa najmu.pdf' }] },
        },
        id: true,
      },
    });
  });

  it('should upload under a pdf name even when the label has no extension', async () => {
    const coreClient = coreClientWith('Umowa najmu');

    await replaceSourceAttachment({
      coreClient: coreClient as unknown as CoreClientStub,
      attachmentId: 'att-1',
      signedPdf: Buffer.from('signed'),
      documentName: 'Umowa najmu',
    });

    expect(uploadFile).toHaveBeenCalledWith(
      expect.anything(),
      'Umowa najmu.pdf',
      'application/pdf',
      expect.any(String),
    );
  });

  it('should leave the request alone when the attachment was deleted', async () => {
    const coreClient = {
      mutation: vi.fn(),
      query: vi.fn().mockResolvedValue({ attachments: { edges: [] } }),
    };

    await replaceSourceAttachment({
      coreClient: coreClient as unknown as CoreClientStub,
      attachmentId: 'gone',
      signedPdf: Buffer.from('signed'),
      documentName: 'Umowa',
    });

    expect(uploadFile).not.toHaveBeenCalled();
    expect(coreClient.mutation).not.toHaveBeenCalled();
  });
});

describe('waitForFinalSeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return on the first look when the seal is already on', async () => {
    getDocument.mockResolvedValue({ status: 'SIGNED' });

    await waitForFinalSeal('doc-1');

    expect(getDocument).toHaveBeenCalledTimes(1);
  });

  it('should keep looking while the closing seal is running', async () => {
    vi.useFakeTimers();
    getDocument
      .mockResolvedValueOnce({ status: 'AWAITING_FINAL_USB_SIGN' })
      .mockResolvedValue({ status: 'SIGNED' });

    const waiting = waitForFinalSeal('doc-1');

    await vi.advanceTimersByTimeAsync(3_000);
    await waiting;

    expect(getDocument).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('should give up on a seal that failed rather than wait it out', async () => {
    getDocument.mockResolvedValue({ status: 'USB_SIGN_FINAL_FAILED' });

    await waitForFinalSeal('doc-1');

    expect(getDocument).toHaveBeenCalledTimes(1);
  });
});
