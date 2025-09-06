export const transcribeAudio = async (
  blobOrDataUrl: Blob | string,
  mimeType: string = 'audio/webm',
  languageCode: string = 'en'
): Promise<string> => {
  let audioBase64: string;
  if (typeof blobOrDataUrl !== 'string') {
    const toDataURL = (b: Blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(b);
    });
    audioBase64 = await toDataURL(blobOrDataUrl);
  } else {
    audioBase64 = blobOrDataUrl;
  }

  const response = await fetch('/api/speech/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audioBase64, mimeType, languageCode }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({} as any));
    // Surface detailed server error info to help diagnose issues
    // eslint-disable-next-line no-console
    console.error('Transcription API error', { status: response.status, err });
    const parts = [err?.error, err?.details, typeof err?.extra === 'string' ? err.extra : (err?.extra ? JSON.stringify(err.extra) : '')]
      .filter(Boolean);
    throw new Error(parts.join(' | ') || `Failed to transcribe audio (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.text as string;
};


