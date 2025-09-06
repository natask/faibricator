import type { NextApiRequest, NextApiResponse } from 'next';
import { fal } from '@fal-ai/client';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      prompt,
      aspectRatio = '16:9',
      duration = 5,
    }: {
      prompt: string;
      aspectRatio?: '16:9' | '9:16';
      duration?: number;
    } = req.body || {};

    if (!process.env.FAL_KEY) {
      return res.status(500).json({ error: 'FAL_KEY not configured' });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    fal.config({ credentials: process.env.FAL_KEY });

    const result = await fal.subscribe('fal-ai/veo3', {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        duration,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          (update.logs || []).map((log: any) => log.message).forEach(() => {});
        }
      },
    });

    return res.status(200).json({
      data: result.data,
      requestId: result.requestId,
    });
  } catch (error: any) {
    console.error('Error generating video via Veo 3:', error);
    const status = (error && error.status) || 500;
    const detail = (error && error.body && error.body.detail) || undefined;
    return res.status(status).json({ error: 'Failed to generate video', detail });
  }
}


