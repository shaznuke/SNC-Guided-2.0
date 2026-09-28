// Minimal dependency-free OOXML writer. Values are numbers or inline strings, never formulas.
const encode = text => new TextEncoder().encode(text);
const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function header(size, fields) {
  const bytes = new Uint8Array(size), view = new DataView(bytes.buffer);
  for (const [offset, value, width] of fields) width === 4 ? view.setUint32(offset, value, true) : view.setUint16(offset, value, true);
  return bytes;
}
export function zipFiles(files) {
  const parts = [], directory = [];
  let offset = 0, directorySize = 0;
  for (const [path, text] of Object.entries(files)) {
    const name = encode(path), data = encode(text), crc = crc32(data);
    const local = header(30, [[0,0x04034b50,4],[4,20],[10,0],[12,33],[14,crc,4],[18,data.length,4],[22,data.length,4],[26,name.length]]);
    parts.push(local, name, data);
    const central = header(46, [[0,0x02014b50,4],[4,20],[6,20],[14,33],[16,crc,4],[20,data.length,4],[24,data.length,4],[28,name.length],[42,offset,4]]);
    directory.push(central, name);
    directorySize += central.length + name.length;
    offset += local.length + name.length + data.length;
  }
  const count = Object.keys(files).length;
  return new Blob([...parts, ...directory, header(22, [[0,0x06054b50,4],[8,count],[10,count],[12,directorySize,4],[16,offset,4]])], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function columnName(index) {
  let result = '';
  for (index++; index > 0; index = Math.floor((index - 1) / 26)) result = String.fromCharCode(65 + (index - 1) % 26) + result;
  return result;
}
export function createWorkbook(sheets) {
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const relNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const officeRel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files = {
    '[Content_Types].xml': declaration + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    '_rels/.rels': declaration + `<Relationships xmlns="${relNs}"><Relationship Id="rId1" Type="${officeRel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': declaration + `<workbook xmlns="${ns}" xmlns:r="${officeRel}"><sheets>${sheets.map((sheet,i) => `<sheet name="${xml(sheet.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': declaration + `<Relationships xmlns="${relNs}">${sheets.map((_,i) => `<Relationship Id="rId${i+1}" Type="${officeRel}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`
  };
  sheets.forEach((sheet,i) => {
    files[`xl/worksheets/sheet${i+1}.xml`] = declaration + `<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="20" width="22" customWidth="1"/></cols><sheetData>${sheet.rows.map((row,r) => `<row r="${r+1}">${row.map((value,c) => {
      const ref = `${columnName(c)}${r+1}`;
      return typeof value === 'number' && Number.isFinite(value) ? `<c r="${ref}"><v>${value}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join('')}</row>`).join('')}</sheetData></worksheet>`;
  });
  return zipFiles(files);
}
