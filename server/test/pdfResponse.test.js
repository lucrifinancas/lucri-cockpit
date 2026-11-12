import test from 'node:test';
import assert from 'node:assert/strict';
import { pdfDisposition } from '../src/utils/pdfResponse.js';

test('visualização e download preservam nome UTF-8 com cabeçalho seguro', () => {
  assert.match(pdfDisposition('relatório.pdf'), /^inline;/);
  assert.match(pdfDisposition('relatório.pdf', true), /^attachment;/);
  assert.match(pdfDisposition('relatório.pdf'), /relat%C3%B3rio.pdf/);
  const header = pdfDisposition('nome"\r\nX-Falso: teste.pdf', true);
  assert.equal(header.includes('\r'), false);
  assert.equal(header.includes('\n'), false);
  assert.match(header, /filename="nome_X-Falso: teste.pdf"/);
});
