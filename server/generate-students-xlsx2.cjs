const ExcelJS = require('exceljs')

async function gen() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Sheet1')
  ws.addRow(['name', 'email'])
  ws.addRow(['Test User A', 'test.user.a+1@example.com'])
  ws.addRow(['Test User B', 'test.user.b+1@example.com'])

  const out = '../docs/bulk-import-templates/students-template-unique.xlsx'
  await wb.xlsx.writeFile(out)
  console.log('Wrote', out)
}

gen().catch((err) => {
  console.error(err)
  process.exit(1)
})
