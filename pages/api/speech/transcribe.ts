import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

type TranscribeRequestBody = {
  audioBase64: string;
  mimeType?: string;
  languageCode?: string; // ISO-639-3, e.g., "eng"
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  try {
    const { audioBase64, mimeType, languageCode } = req.body as TranscribeRequestBody;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const contentType = mimeType || 'audio/webm';

    // Write to a temp file so we can provide a filename; then read back into Blob
    const ext = contentType.includes('webm') ? 'webm' : contentType.includes('mp4') ? 'mp4' : contentType.includes('m4a') ? 'm4a' : contentType.includes('wav') ? 'wav' : 'mp3';
    const tmpPath = path.join(os.tmpdir(), `stt-${Date.now()}.${ext}`);
    await fsp.writeFile(tmpPath, audioBuffer);
    const fileBlob = new Blob([audioBuffer], { type: contentType });

    try {
      const form = new FormData();
      form.append('model_id', 'scribe_v1');
      if (languageCode) form.append('language_code', languageCode);
      form.append('file', fileBlob, `audio.${ext}`);

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'accept': 'application/json',
        },
        body: form as any,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Transcription failed', details: json?.detail || json });
      }
      const text = (json as any)?.text || (json as any)?.transcription || '';
      return res.status(200).json({ text });
    } catch (sdkErr: any) {
      const message = sdkErr?.message || 'SDK transcription error';
      const details = sdkErr?.response?.data || sdkErr?.response || undefined;
      return res.status(502).json({ error: 'Transcription failed', details: message, extra: details });
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}


