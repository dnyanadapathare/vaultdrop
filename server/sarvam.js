const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const { exec } = require('child_process');
const { SarvamAIClient } = require('sarvamai');

const execAsync = promisify(exec);

let client = null;

function getClient() {
  if (!client) {
    client = new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY });
  }
  return client;
}

async function getAudioDuration(audioPath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim());
  } catch {
    return null;
  }
}

async function splitAudio(audioPath, duration) {
  const chunkPaths = [];
  const chunkSize = 29;
  const numChunks = Math.ceil(duration / chunkSize);

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const chunkPath = path.join(os.tmpdir(), `vaultdrop_chunk_${Date.now()}_${i}.mp3`);
    await execAsync(
      `ffmpeg -y -i "${audioPath}" -ss ${start} -t ${chunkSize} -acodec libmp3lame -q:a 5 "${chunkPath}"`,
      { timeout: 60000 }
    );
    if (fs.existsSync(chunkPath)) chunkPaths.push(chunkPath);
  }

  return chunkPaths;
}

async function transcribeChunk(chunkPath) {
  const sarvam = getClient();
  const fileStream = fs.createReadStream(chunkPath);
  const response = await sarvam.speechToText.transcribe({
    file: fileStream,
    model: 'saaras:v3',
    mode: 'translate',
    language_code: 'unknown',
  });
  return response.transcript || '';
}

async function transcribeAudio(audioPath) {
  try {
    const duration = await getAudioDuration(audioPath);
    console.log(`[sarvam] audio duration: ${duration?.toFixed(1)}s`);

    let transcript = '';

    if (!duration || duration <= 29) {
      console.log('[sarvam] short audio, sending directly...');
      const sarvam = getClient();
      const fileStream = fs.createReadStream(audioPath);
      const response = await sarvam.speechToText.transcribe({
        file: fileStream,
        model: 'saaras:v3',
        mode: 'translate',
        language_code: 'unknown',
      });
      transcript = response.transcript || '';
    } else {
      console.log(`[sarvam] audio over 30s, splitting into chunks...`);
      const chunkPaths = await splitAudio(audioPath, duration);
      console.log(`[sarvam] ${chunkPaths.length} chunks created`);

      const transcripts = [];
      for (let i = 0; i < chunkPaths.length; i++) {
        console.log(`[sarvam] transcribing chunk ${i + 1}/${chunkPaths.length}...`);
        try {
          const chunkText = await transcribeChunk(chunkPaths[i]);
          transcripts.push(chunkText);
        } catch (err) {
          console.log(`[sarvam] chunk ${i + 1} failed:`, err.message);
        }
        if (fs.existsSync(chunkPaths[i])) fs.unlinkSync(chunkPaths[i]);
      }

      transcript = transcripts.filter(Boolean).join(' ').trim();
    }

    console.log(`[sarvam] transcript length: ${transcript.length} chars`);
    return transcript || null;

  } catch (err) {
    console.log('[sarvam] transcription failed:', err.message);
    return null;
  } finally {
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log('[sarvam] temp audio deleted');
    }
  }
}

module.exports = { transcribeAudio };