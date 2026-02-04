
/**
 * WebM Blob을 WAV Blob으로 변환
 * @param {Blob} webmBlob
 * @returns {Promise<Blob>} wavBlob
 */
export const convertWebMToWav = async (webmBlob) => {
    // 1. Blob -> ArrayBuffer
    const arrayBuffer = await webmBlob.arrayBuffer();

    // 2. AudioContext로 오디오 디코딩 (PCM 데이터 획득)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // 3. WAV 헤더 + PCM 데이터 생성
    const wavBuffer = encodeWAV(audioBuffer);

    // 4. Blob 생성
    return new Blob([wavBuffer], { type: 'audio/wav' });
};

/**
 * AudioBuffer를 WAV 포맷의 ArrayBuffer로 인코딩
 */
const encodeWAV = (audioBuffer) => {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // 채널별 데이터 추출
    for (i = 0; i < numOfChan; i++) {
        channels.push(audioBuffer.getChannelData(i));
    }

    // --- WAV Header 작성 ---
    // "RIFF"
    writeString(view, 0, 'RIFF');
    // 파일 전체 길이 - 8
    view.setUint32(4, 36 + audioBuffer.length * numOfChan * 2, true);
    // "WAVE"
    writeString(view, 8, 'WAVE');
    // "fmt " chunk
    writeString(view, 12, 'fmt ');
    // fmt chunk size (16 for PCM)
    view.setUint32(16, 16, true);
    // format (1 = PCM)
    view.setUint16(20, 1, true);
    // Channels
    view.setUint16(22, numOfChan, true);
    // Sample Rate
    view.setUint32(24, audioBuffer.sampleRate, true);
    // Byte Rate (SampleRate * BlockAlign)
    view.setUint32(28, audioBuffer.sampleRate * 4, true); // 4 = 2 (16bit) * 2 channels (stereo)? -> * numOfChan * 2
    view.setUint32(28, audioBuffer.sampleRate * numOfChan * 2, true);
    // Block Align (NumChannels * BitsPerSample/8)
    view.setUint16(32, numOfChan * 2, true);
    // Bits Per Sample
    view.setUint16(34, 16, true);
    // "data" chunk
    writeString(view, 36, 'data');
    // data chunk size
    view.setUint32(40, audioBuffer.length * numOfChan * 2, true);

    // --- PCM 데이터 작성 (Interleaved) ---
    offset = 44;
    while (pos < audioBuffer.length) {
        for (i = 0; i < numOfChan; i++) {
            // -1 ~ 1 사이의 float 값을 16bit PCM으로 변환
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // 클리핑
            // 16비트 signed int로 변환 (0x7FFF = 32767)
            sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return buffer;
};

const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};
