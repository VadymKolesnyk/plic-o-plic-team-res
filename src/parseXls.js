import * as XLSX from 'xlsx'

// Windows-1251 decode table
const WIN1251 = (() => {
  const map = new Uint16Array(256)
  for (let i = 0; i < 128; i++) map[i] = i
  const hi = [
    0x0402,0x0403,0x201A,0x0453,0x201E,0x2026,0x2020,0x2021,
    0x20AC,0x2030,0x0409,0x2039,0x040A,0x040C,0x040B,0x040F,
    0x0452,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,
    0xFFFD,0x2122,0x0459,0x203A,0x045A,0x045C,0x045B,0x045F,
    0x00A0,0x040E,0x045E,0x0408,0x00A4,0x0490,0x00A6,0x00A7,
    0x0401,0x00A9,0x0404,0x00AB,0x00AC,0x00AD,0x00AE,0x0407,
    0x00B0,0x00B1,0x0406,0x0456,0x0491,0x00B5,0x00B6,0x00B7,
    0x0451,0x2116,0x0454,0x00BB,0x0458,0x0405,0x0455,0x0457,
    // 0xC0–0xFF: А-я
    0x0410,0x0411,0x0412,0x0413,0x0414,0x0415,0x0416,0x0417,
    0x0418,0x0419,0x041A,0x041B,0x041C,0x041D,0x041E,0x041F,
    0x0420,0x0421,0x0422,0x0423,0x0424,0x0425,0x0426,0x0427,
    0x0428,0x0429,0x042A,0x042B,0x042C,0x042D,0x042E,0x042F,
    0x0430,0x0431,0x0432,0x0433,0x0434,0x0435,0x0436,0x0437,
    0x0438,0x0439,0x043A,0x043B,0x043C,0x043D,0x043E,0x043F,
    0x0440,0x0441,0x0442,0x0443,0x0444,0x0445,0x0446,0x0447,
    0x0448,0x0449,0x044A,0x044B,0x044C,0x044D,0x044E,0x044F,
  ]
  for (let i = 0; i < 128; i++) map[128 + i] = hi[i]
  return map
})()

function decodeWin1251(bytes) {
  let result = ''
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(WIN1251[bytes[i]])
  }
  return result
}

function decodeCell(value) {
  if (typeof value !== 'string') return value
  // Check if string looks like it was mis-decoded (has replacement chars or wrong chars)
  // Re-encode back to bytes as latin1, then decode as win1251
  const bytes = new Uint8Array(value.length)
  for (let i = 0; i < value.length; i++) {
    bytes[i] = value.charCodeAt(i) & 0xFF
  }
  return decodeWin1251(bytes)
}

export function parseXlsFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', codepage: 1252 })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        const participants = []
        for (const row of rows) {
          const fam = decodeCell(String(row['fam'] ?? '')).trim()
          const grup = decodeCell(String(row['grup'] ?? '')).trim()
          const kom2 = decodeCell(String(row['kom2'] ?? '')).trim()
          const r_1 = String(row['r_1'] ?? '').trim()
          const m_1_raw = row['m_1']
          const o_1_raw = row['o_1']

          if (!fam || !grup) continue
          if (!kom2) continue

          const m_1 = parseFloat(m_1_raw)
          const o_1 = parseFloat(o_1_raw)

          participants.push({
            fam,
            grup,
            kom2,
            r_1,
            m_1: isNaN(m_1) ? null : m_1,
            o_1: isNaN(o_1) ? 0 : o_1,
          })
        }

        resolve(participants)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Помилка читання файлу'))
    reader.readAsArrayBuffer(file)
  })
}

export function getUniqueGroups(participants) {
  const groups = [...new Set(participants.map((p) => p.grup))].sort()
  return groups.map((name) => {
    let gender = null
    if (/Ж/i.test(name)) gender = 'female'
    else if (/Ч/i.test(name)) gender = 'male'
    return { name, gender }
  })
}

export function computeTeamResults(participants, groupGenders) {
  // groupGenders: { [grupName]: 'male' | 'female' }

  const maleGroups = Object.entries(groupGenders)
    .filter(([, g]) => g === 'male')
    .map(([name]) => name)

  const femaleGroups = Object.entries(groupGenders)
    .filter(([, g]) => g === 'female')
    .map(([name]) => name)

  const computeForGroups = (targetGroups) => {
    // group participants by grup
    const byGroup = {}
    for (const p of participants) {
      if (!targetGroups.includes(p.grup)) continue
      if (!byGroup[p.grup]) byGroup[p.grup] = []
      byGroup[p.grup].push(p)
    }

    // For each group, for each team, pick top 2 by o_1
    // teamAccum: { teamName: { totalPoints, contributors: [{ fam, grup, o_1, used }] } }
    const teamAccum = {}

    for (const grup of Object.keys(byGroup)) {
      const groupParticipants = byGroup[grup]

      // group by team within this group
      const byTeam = {}
      for (const p of groupParticipants) {
        if (!byTeam[p.kom2]) byTeam[p.kom2] = []
        byTeam[p.kom2].push(p)
      }

      for (const [teamName, members] of Object.entries(byTeam)) {
        // sort by o_1 descending, pick top 2
        const sorted = [...members].sort((a, b) => b.o_1 - a.o_1)
        const top2 = sorted.slice(0, 2)
        const rest = sorted.slice(2)

        if (!teamAccum[teamName]) {
          teamAccum[teamName] = { totalPoints: 0, contributors: [] }
        }

        for (const p of top2) {
          teamAccum[teamName].totalPoints += p.o_1
          teamAccum[teamName].contributors.push({ ...p, used: true })
        }
        for (const p of rest) {
          teamAccum[teamName].contributors.push({ ...p, used: false })
        }
      }
    }

    // sort teams by totalPoints descending
    return Object.entries(teamAccum)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
  }

  return {
    male: computeForGroups(maleGroups),
    female: computeForGroups(femaleGroups),
  }
}
