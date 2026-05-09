// Certificate capture + storage. Renders the on-page <Certificate> node to a
// PNG via html2canvas, and (in live mode) uploads the PNG to the public
// `certificates` bucket. Download remains a local browser save in both modes.

import html2canvas from 'html2canvas';
import { supabase, isLive } from './supabase.js';

export async function capturePng(node) {
  if (!node) return null;
  const canvas = await html2canvas(node, {
    backgroundColor: '#FAFAF8',
    scale: 3,
    useCORS: true,
    logging: false,
  });
  return new Promise((r) => canvas.toBlob(r, 'image/png'));
}

export async function uploadCertificate(blob, { week, recipientSlug }) {
  if (!isLive() || !blob) return null;
  const filename = `w${String(week).padStart(2, '0')}-${recipientSlug || 'cert'}-${Date.now()}.png`;
  const path = `${filename}`;
  const { error } = await supabase
    .storage
    .from('certificates')
    .upload(path, blob, { contentType: 'image/png', upsert: true });
  if (error) {
    console.warn('certificate upload failed', error);
    return null;
  }
  const { data } = supabase.storage.from('certificates').getPublicUrl(path);
  return data.publicUrl;
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s) {
  return (s || 'certificate')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
