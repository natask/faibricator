export async function startRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = (window as any).MediaRecorder && (window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  const rec = new MediaRecorder(stream, { mimeType } as MediaRecorderOptions);
  const chunks: BlobPart[] = [];

  rec.ondataavailable = (e: BlobEvent) => e.data && chunks.push(e.data);

  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  rec.start();
  return { rec, done, mimeType };
}


