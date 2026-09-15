const DOWNLOAD_TIMEOUT_MS = 30_000;

// Twenty resolves a FILE field to a signed, expiring URL that can be fetched
// without any extra header. Same trick the first-party call-recorder app uses
// to read the workspace logo.
export const fetchAttachmentBytes = async (
  fileUrl: string,
): Promise<Uint8Array> => {
  const response = await fetch(fileUrl, {
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    // A 404 here usually means the attachment row outlived its file, which is
    // also true of seeded demo records: they carry a name but nothing was ever
    // stored behind them.
    throw new Error(
      response.status === 404
        ? 'Twenty has no file behind this attachment. Upload the document to the record and try again.'
        : `Could not download the attachment from Twenty (status ${response.status}).`,
    );
  }

  return new Uint8Array(await response.arrayBuffer());
};
