import { describe, it } from 'node:test';
import assert from 'node:assert';
import { toLocaleUpper } from '../utils/textUtils';

describe('textUtils - Turkish Locale Uppercase', () => {
  it('correctly converts vakitler to VAKİTLER with dotted İ', () => {
    assert.strictEqual(toLocaleUpper('vakitler', 'tr'), 'VAKİTLER');
    assert.strictEqual(toLocaleUpper('Vakitler', 'tr'), 'VAKİTLER');
    assert.strictEqual(toLocaleUpper('VAKITLER', 'tr'), 'VAKİTLER');
    assert.notStrictEqual(toLocaleUpper('vakitler', 'tr'), 'VAKITLER');
  });

  it('correctly converts Ana Vakitler (6) to ANA VAKİTLER (6)', () => {
    assert.strictEqual(toLocaleUpper('Ana Vakitler (6)', 'tr'), 'ANA VAKİTLER (6)');
    assert.strictEqual(toLocaleUpper('ANA VAKITLER (6)', 'tr'), 'ANA VAKİTLER (6)');
    assert.notStrictEqual(toLocaleUpper('Ana Vakitler (6)', 'tr'), 'ANA VAKITLER (6)');
  });

  it('handles all standard Turkish special characters (i, ı, ş, ğ, ç, ö, ü)', () => {
    assert.strictEqual(toLocaleUpper('şehirler', 'tr'), 'ŞEHİRLER');
    assert.strictEqual(toLocaleUpper('kıble', 'tr'), 'KIBLE');
    assert.strictEqual(toLocaleUpper('günler', 'tr'), 'GÜNLER');
    assert.strictEqual(toLocaleUpper('ikindi', 'tr'), 'İKİNDİ');
    assert.strictEqual(toLocaleUpper('coğrafi kuzey', 'tr'), 'COĞRAFİ KUZEY');
    assert.strictEqual(toLocaleUpper('İstanbul', 'tr'), 'İSTANBUL');
    assert.strictEqual(toLocaleUpper('ışık', 'tr'), 'IŞIK');
  });

  it('handles other languages correctly', () => {
    assert.strictEqual(toLocaleUpper('prayers', 'en'), 'PRAYERS');
    assert.strictEqual(toLocaleUpper('cities', 'en'), 'CITIES');
    assert.strictEqual(toLocaleUpper('الأوقات', 'ar'), 'الأوقات');
  });

  it('handles empty or null string gracefully', () => {
    assert.strictEqual(toLocaleUpper(''), '');
    assert.strictEqual(toLocaleUpper(null as any), '');
    assert.strictEqual(toLocaleUpper(undefined as any), '');
  });
});
