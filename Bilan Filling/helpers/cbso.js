// helpers/cbso.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const RAW_BASE = process.env.CBSO_BASE || 'https://ws.cbso.nbb.be/authentic';
const BASE = RAW_BASE.replace(/\/+$/, '');
const KEY  = process.env.CBSO_KEY;
const DEBUG = !!process.env.CBSO_DEBUG;

if (!KEY) {
  console.warn('[CBSO] WARNING: CBSO_KEY not set; calls will 401.');
}

function buildHeaders(accept) {
  return {
    'NBB-CBSO-Subscription-Key': KEY,
    'X-Request-Id': uuidv4(),
    'Accept': accept,
  };
}

/** STEP 1: fetch all references for a legal entity (CBE). */
export async function fetchReferences(cbe) {
  const url = `${BASE}/legalEntity/${encodeURIComponent(cbe)}/references`;
  if (DEBUG) console.log('[CBSO] GET refs:', url);
  const resp = await axios.get(url, {
    headers: buildHeaders('application/json'),
    timeout: 20000,
    validateStatus: s => s < 500,
  });
  if (DEBUG) console.log('[CBSO] refs status', resp.status);
  if (resp.status !== 200) {
    const err = new Error(`CBSO references fetch failed: ${resp.status}`);
    err.status = resp.status;
    err.body = resp.data;
    throw err;
  }
  return resp.data; // array
}

/** sort helper (YYYYMMDD descending) */
const norm = d => (d || '').replace(/-/g,'');

/** choose the most recent reference */
export function pickLatestReference(refs=[]) {
  if (!Array.isArray(refs) || !refs.length) return null;
  return [...refs].sort((a,b) => {
    const aEnd = norm(a?.ExerciseDates?.EndDate) || norm(a?.DepositDate);
    const bEnd = norm(b?.ExerciseDates?.EndDate) || norm(b?.DepositDate);
    return bEnd.localeCompare(aEnd);
  })[0];
}

/** STEP 2: download PDF for a reference number. */
export async function fetchPdf(referenceNumber) {
  const url = `${BASE}/deposit/${encodeURIComponent(referenceNumber)}/accountingData`;
  if (DEBUG) console.log('[CBSO] GET pdf:', url);
  const resp = await axios.get(url, {
    headers: buildHeaders('application/pdf'),
    responseType: 'arraybuffer',
    timeout: 30000,
    validateStatus: s => s < 500,
  });
  if (DEBUG) console.log('[CBSO] pdf status', resp.status);
  if (resp.status !== 200) {
    const err = new Error(`CBSO PDF fetch failed: ${resp.status}`);
    err.status = resp.status;
    err.body   = resp.data;
    throw err;
  }
  return {
    buffer: resp.data,
    contentType: resp.headers['content-type'] || 'application/pdf',
    contentLength: resp.headers['content-length'] || resp.data?.length,
  };
}

/**
 * Convenience wrapper: given a CBE, perform the 2-step flow and return
 * { latest, pdf } where latest is the chosen reference object and pdf has buffer/type/length.
 */
export async function getLatestPdfForCbe(cbe) {
  const refs = await fetchReferences(cbe);
  if (!refs?.length) {
    const err = new Error('No published annual accounts found for this CBE.');
    err.status = 404;
    throw err;
  }
  const latest = pickLatestReference(refs);
  if (!latest) {
    const err = new Error('Could not determine latest reference.');
    err.status = 404;
    throw err;
  }
  const pdf = await fetchPdf(latest.ReferenceNumber);
  return { latest, pdf };
}

// helpers/cbso.js (add this next to fetchPdf)

export async function fetchAccountingDataJson(referenceNumber) {
  const url = `${BASE}/deposit/${encodeURIComponent(referenceNumber)}/accountingData`;
  const resp = await axios.get(url, {
    headers: buildHeaders('application/x.jsonxbrl'),
    timeout: 30000,
    validateStatus: s => s < 500,
  });

  if (resp.status !== 200) {
    const err = new Error(`CBSO JSON fetch failed: ${resp.status}`);
    err.status = resp.status;
    err.body = resp.data;
    throw err;
  }

  // Ensure we really got JSON
  const ct = (resp.headers['content-type'] || '').toLowerCase();
  if (!ct.includes('json')) {
    const err = new Error('Structured JSON not available for this reference.');
    err.status = 406;
    err.body = { message: 'No JSON representation; filing may pre-date 4 Apr 2022 or not be XBRL.' };
    throw err;
  }
  return resp.data;
}

