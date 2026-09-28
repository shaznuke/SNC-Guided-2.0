let decoderPromise;
export async function convertHeic(file) {
 if(!decoderPromise)decoderPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL('./vendor/heic2any.min.js',import.meta.url).href;
  script.onload=()=>resolve();script.onerror=()=>{decoderPromise=null;script.remove();reject(new Error('HEIC converter could not load. Reopen online and try again.'));};document.head.append(script);
 });
 await decoderPromise;
 let timeout;
 try {const converted=await Promise.race([globalThis.heic2any({blob:file,toType:'image/jpeg',quality:0.9}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('HEIC conversion took too long. Use a smaller photo or JPEG.')),30000);})]);return Array.isArray(converted)?converted[0]:converted;}
 finally {clearTimeout(timeout);}
}
// No credential is bundled into the public app. Keys stay in this browser's storage.
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function validateMealEstimate(value) {
  if (!value || typeof value.name !== 'string' || !value.name.trim()) throw new Error('AI did not return a food name.');
  const result = { name: value.name.trim().slice(0, 200), notes: String(value.notes || '').slice(0, 1500) };
  for (const field of ['calories', 'protein', 'carbs', 'fat']) {
    if (typeof value[field] !== 'number' || !Number.isFinite(value[field]) || value[field] < 0) {
      throw new Error('AI returned incomplete nutrition values. Try another photo or enter the meal manually.');
    }
    result[field] = Math.round(value[field] * 10) / 10;
  }
  return result;
}

export const AIVisionEstimator = {
  getStoredApiKey() { return (localStorage.getItem('snc_gemini_api_key') || '').trim(); },
  setStoredApiKey(key) {
    if (key.trim()) localStorage.setItem('snc_gemini_api_key', key.trim());
    else localStorage.removeItem('snc_gemini_api_key');
  },
  getModel() { return localStorage.getItem('snc_gemini_model') || DEFAULT_GEMINI_MODEL; },
  setModel(model) {
    const value = model.trim() || DEFAULT_GEMINI_MODEL;
    if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new Error('Enter a Gemini model ID, not a URL.');
    localStorage.setItem('snc_gemini_model', value);
  },
  async testConnection() {
    if(globalThis.navigator?.onLine===false)return {success:false,error:'Photo analysis needs internet. Your offline workout and manual meal logs still work.'};
    const apiKey = this.getStoredApiKey();
    if (!apiKey) return { success: false, error: 'Enter and save your Gemini API key first.' };
    const model = this.getModel();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'This is an API connection test. Return exactly this JSON object: {"connection":"ok"}' }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      if (!response.ok) {
        const errors = {
          400: 'Google rejected the request. Check your API key and model.',
          401: 'Google rejected this key (401: invalid authentication). Create a replacement in Google AI Studio.',
          403: 'Google denied access (403). Check the key’s permissions and website restrictions.',
          404: 'This model is unavailable to your project (404). Choose an available model.',
          429: 'Your Gemini quota is exhausted (429). Check your Google project quota or billing.'
        };
        return { success: false, status: response.status, error: errors[response.status] || `Google returned HTTP ${response.status}. Try again later.` };
      }
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text || '').join('');
      let result;
      try { result = JSON.parse(content); } catch { throw new Error('Google responded, but the connection test returned unexpected data.'); }
      if (result.connection !== 'ok') throw new Error('Google responded, but the connection test did not complete.');
      return { success: true, model };
    } catch (error) {
      return { success: false, error: error.name === 'AbortError' ? 'Connection test timed out. Try again.' : error.message || 'Could not connect to Google.' };
    } finally { clearTimeout(timeout); }
  },
  async processImageToJpegBase64(file) {
    if (file.size > 25 * 1024 * 1024) throw new Error('Choose a photo smaller than 25 MB.');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      try { await img.decode(); }
      catch {
        const isHeic=/heic|heif/i.test(file.type||'') || /\.hei[cf]$/i.test(file.name||'');
        if(isHeic){try{return await this.processImageToJpegBase64(await convertHeic(file));}catch(error){throw new Error('HEIC conversion failed. '+(error.message||'Try another photo.')+' You can also open the photo in Files, use Quick Actions → Convert Image → JPEG, then choose that JPEG.');}}
        throw new Error('This image could not be read. Choose a JPEG or PNG photo.');
      }
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image conversion is unavailable in this browser.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 1024, 1024);
      const scale = Math.min(1024 / img.naturalWidth, 1024 / img.naturalHeight);
      const width = img.naturalWidth * scale, height = img.naturalHeight * scale;
      context.drawImage(img, (1024 - width) / 2, (1024 - height) / 2, width, height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } finally { URL.revokeObjectURL(url); }
  },
  async analyzeMealPhotoFile(file) {
    const apiKey = this.getStoredApiKey();
    if (!apiKey) return { success: false, requiresKey: true, error: 'Add your Gemini key in Settings, or log this meal manually.' };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const photoUrl = await this.processImageToJpegBase64(file);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.getModel())}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: 'Examine this food/beverage image. Identify the item (e.g., Beer, Pizza, Steak, Salad, Smoothie). Estimate the visible portion. Return a JSON object with name, calories (kcal), protein (g), carbs (g), fat (g), and notes. Nutrition values must be non-negative numbers. In notes state portion assumptions and uncertainty. Do not claim exact nutrition from a photograph. If no food or beverage is identifiable, return {"error":"No identifiable food or beverage"}.' },
            { inline_data: { mime_type: 'image/jpeg', data: photoUrl.split(',')[1] } }
          ] }], generationConfig: { responseMimeType: 'application/json' }
        })
      });
      if (!response.ok) {
        const errors = { 400: 'Gemini rejected the request. Check your key and model in Settings.', 401: 'Your Gemini key was rejected.', 403: 'Your Gemini key lacks access. Check its restrictions.', 404: 'This model is unavailable. Update the model in Settings.', 429: 'Gemini quota reached. Try later or log the meal manually.' };
        throw new Error(errors[response.status] || `Gemini is unavailable (${response.status}). Try later.`);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text || '').join('');
      if (!text) throw new Error('No usable estimate was returned. Try another photo.');
      let parsed;
      try { parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()); }
      catch { throw new Error('AI returned unreadable data. Try again or enter your meal manually.'); }
      if (parsed.error) throw new Error('No identifiable food or beverage. Try another photo.');
      return { success: true, ...validateMealEstimate(parsed) };
    } catch (error) {
      return { success: false, error: error.name === 'AbortError' ? 'Analysis timed out. Try again or log manually.' : error.message || 'Could not reach Gemini.' };
    } finally { clearTimeout(timeout); }
  }
};
