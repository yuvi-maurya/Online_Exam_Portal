const ExcelJS = require('exceljs')

async function gen() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  ws.addRow(['name', 'email'])
  ws.addRow(['Ava Patel', 'ava.patel@example.com'])
  ws.addRow(['Noah Williams', 'noah.williams@example.com'])
  ws.addRow(['Mia Chen', 'mia.chen@example.com'])

  const out = '../docs/bulk-import-templates/students-template.xlsx'
  await wb.xlsx.writeFile(out)
  console.log('Wrote', out)
}

gen().catch((err) => {
  console.error(err)
  process.exit(1)
})
