import { useState, useCallback } from 'react'
import { parseXlsFile, getUniqueGroups, computeTeamResults } from './parseXls'
import styles from './App.module.css'

function formatDate(date) {
  const d = new Date(date)
  const day = d.getDate()
  const monthNames = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}р.`
}


function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function PdfModal({ results, onClose }) {
  const [title, setTitle] = useState('Пліч-о-пліч всеукраїнські шкільні ліги" зі спортивного орієнтування серед учнів та учениць закладів загальної середньої освіти у 2025-2026 навчальному році під гаслом "РАЗОМ ПЕРЕМОЖЕМО"')
  const [date, setDate] = useState(todayISO())
  const [location, setLocation] = useState('м. Одеса')
  const [judge, setJudge] = useState('Катерина Колесник')
  const [secretary, setSecretary] = useState('Сергій Стоян')

  const handlePrint = () => {
    const dateLong = formatDate(date)

    const renderSection = (sectionTitle, teams) => {
      if (!teams || teams.length === 0) return ''
      const rows = teams.map((team, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td class="teamname">${team.name}</td>
          <td class="pts">${Math.round(team.totalPoints)}</td>
          <td class="place">${i + 1}</td>
        </tr>`).join('')
      return `
        <div class="section-title">${sectionTitle}</div>
        <table>
          <thead>
            <tr>
              <th class="num">№ п/п</th>
              <th class="teamname">Команда</th>
              <th class="pts">очки</th>
              <th class="place">місце</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Протокол</title>
<style>
  @page { size: A4 portrait; margin: 25mm 30mm 25mm 30mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; margin: 0; padding: 0; }
  .page { padding: 15mm 20mm; }
  .competition-title { text-align: center; font-size: 9pt; font-weight: bold; margin-bottom: 10pt; }
  .main-title { text-align: center; font-size: 15pt; font-weight: bold; letter-spacing: 1px; margin-bottom: 2pt; }
  .sub-title { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 2pt; }
  .sport-title { text-align: center; font-size: 11pt; margin-bottom: 4pt; }
  .date-line { text-align: center; font-size: 11pt; margin-bottom: 20pt; }
  .section-title { text-align: center; font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 20pt 0 8pt; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
  th { font-size: 10pt; font-weight: bold; padding: 4pt 6pt; border-bottom: 1px solid #000; text-align: center; }
  td { font-size: 10pt; padding: 3pt 6pt; border-bottom: 1px solid #ccc; }
  th.teamname, td.teamname { text-align: left; }
  .num { width: 40pt; text-align: center; }
  .pts { width: 55pt; text-align: center; }
  .place { width: 45pt; text-align: center; }
  .signatures { margin-top: 40pt; }
  .sig-row { display: flex; justify-content: space-between; margin-bottom: 16pt; font-size: 11pt; }
  .sig-label { min-width: 200pt; }
  .sig-name { }
  .footer { position: fixed; bottom: 10mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; font-size: 8pt; color: #555; border-top: 1px solid #ccc; padding-top: 4pt; }
</style>
</head>
<body>
<div class="page">
<div class="competition-title">${title}</div>
<div class="main-title">ПІДСУМКОВИЙ&nbsp; ПРОТОКОЛ</div>
<div class="sub-title">ЗАГАЛЬНОКОМАНДНИХ РЕЗУЛЬТАТІВ ЗМАГАНЬ</div>
<div class="sport-title">зі спортивного орієнтування</div>
<div class="date-line">${dateLong}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Місце проведення: ${location}</div>

${renderSection('Жінки', results.female)}
${renderSection('Чоловіки', results.male)}

<div class="signatures">
  <div class="sig-row"><span class="sig-label">Головний суддя</span><span class="sig-name">${judge}</span></div>
  <div class="sig-row"><span class="sig-label">Головний секретар</span><span class="sig-name">${secretary}</span></div>
</div>
</div>
</body>
</html>`

    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Експорт у PDF</h2>
        <div className={styles.modalField}>
          <label>Назва змагань</label>
          <textarea
            className={styles.modalTextarea}
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={4}
          />
        </div>
        <div className={styles.modalField}>
          <label>Дата</label>
          <input
            type="date"
            className={styles.modalInput}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div className={styles.modalField}>
          <label>Місце проведення</label>
          <input
            type="text"
            className={styles.modalInput}
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
        <div className={styles.modalField}>
          <label>Головний суддя</label>
          <input
            type="text"
            className={styles.modalInput}
            value={judge}
            onChange={e => setJudge(e.target.value)}
          />
        </div>
        <div className={styles.modalField}>
          <label>Головний секретар</label>
          <input
            type="text"
            className={styles.modalInput}
            value={secretary}
            onChange={e => setSecretary(e.target.value)}
          />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnSecondary} onClick={onClose}>Скасувати</button>
          <button className={styles.btnPrimary} onClick={handlePrint}>Друк / Зберегти PDF</button>
        </div>
      </div>
    </div>
  )
}

function FileUpload({ onFile }) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput').click()}
    >
      <div className={styles.dropzoneIcon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p className={styles.dropzoneText}>Перетягніть XLS/XLSX файл сюди або натисніть для вибору</p>
      <input
        id="fileInput"
        type="file"
        accept=".xls,.xlsx"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}

function GroupGenderSelector({ groups, groupGenders, onChange }) {
  const unknownGroups = groups.filter((g) => g.gender === null)

  if (unknownGroups.length === 0) return null

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Визначте стать для груп без позначки Ч/Ж</h3>
      <div className={styles.genderGrid}>
        {unknownGroups.map((g) => (
          <div key={g.name} className={styles.genderRow}>
            <span className={styles.genderGroupName}>{g.name}</span>
            <div className={styles.genderToggle}>
              <button
                className={`${styles.genderBtn} ${groupGenders[g.name] === 'male' ? styles.genderBtnActive : ''}`}
                onClick={() => onChange(g.name, 'male')}
              >
                Чоловіча
              </button>
              <button
                className={`${styles.genderBtn} ${groupGenders[g.name] === 'female' ? styles.genderBtnActiveFemale : ''}`}
                onClick={() => onChange(g.name, 'female')}
              >
                Жіноча
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupsList({ groups, groupGenders, onChange }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Групи у файлі</h3>
      <div className={styles.groupsGrid}>
        {groups.map((g) => {
          const current = groupGenders[g.name]
          return (
            <div
              key={g.name}
              className={`${styles.groupItem} ${current === 'male' ? styles.groupItemMale : styles.groupItemFemale}`}
            >
              <span className={`${styles.groupGenderIcon} ${current === 'male' ? styles.groupGenderIconMale : styles.groupGenderIconFemale}`}>{current === 'male' ? 'Ч' : 'Ж'}</span>
              <span className={styles.groupName}>{g.name}</span>
              <div className={styles.genderToggle}>
                <button
                  className={`${styles.genderBtnSmall} ${current === 'male' ? styles.genderBtnActive : ''}`}
                  onClick={() => onChange(g.name, 'male')}
                >
                  Ч
                </button>
                <button
                  className={`${styles.genderBtnSmall} ${current === 'female' ? styles.genderBtnActiveFemale : ''}`}
                  onClick={() => onChange(g.name, 'female')}
                >
                  Ж
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TeamCard({ team, rank }) {
  const [open, setOpen] = useState(false)

  const byGrup = {}
  for (const c of team.contributors) {
    if (!byGrup[c.grup]) byGrup[c.grup] = []
    byGrup[c.grup].push(c)
  }

  const medalStyles = [styles.medal1, styles.medal2, styles.medal3]

  return (
    <div className={styles.teamCard}>
      <div className={styles.teamHeader}>
        <div className={styles.teamRank}>
          {rank <= 3
            ? <span className={`${styles.rankNum} ${medalStyles[rank - 1]}`}>{rank}</span>
            : <span className={styles.rankNum}>{rank}</span>}
        </div>
        <div className={styles.teamInfo}>
          <span className={styles.teamName}>{team.name}</span>
          <span className={styles.teamPoints}>{team.totalPoints.toFixed(1)} очок</span>
        </div>
        <button
          className={`${styles.toggleBtn} ${open ? styles.toggleBtnOpen : ''}`}
          onClick={() => setOpen(!open)}
          title={open ? 'Згорнути' : 'Розгорнути'}
        >
          ▼
        </button>
      </div>

      {open && (
        <div className={styles.teamDetails}>
          {Object.entries(byGrup).map(([grup, members]) => (
            <div key={grup} className={styles.grupSection}>
              <div className={styles.grupLabel}>{grup}</div>
              <table className={styles.membersTable}>
                <thead>
                  <tr>
                    <th>ПІБ</th>
                    <th>Місце</th>
                    <th>Очки</th>
                    <th>Зараховано</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .sort((a, b) => b.o_1 - a.o_1)
                    .map((m, i) => (
                      <tr key={i} className={m.used ? styles.usedRow : styles.unusedRow}>
                        <td>{m.fam}</td>
                        <td>{m.m_1 ?? '—'}</td>
                        <td>{m.o_1}</td>
                        <td className={styles.usedCell}>
                          {m.used ? <span className={styles.checkmark}>✓</span> : <span className={styles.cross}>✗</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResultsSection({ title, teams, icon }) {
  if (teams.length === 0) {
    return (
      <div className={styles.resultsSection}>
        <h2 className={styles.sectionTitle}>{icon} {title}</h2>
        <p className={styles.emptyMsg}>Немає даних для відображення</p>
      </div>
    )
  }

  return (
    <div className={styles.resultsSection}>
      <h2 className={styles.sectionTitle}>{icon} {title}</h2>
      <div className={styles.teamsList}>
        {teams.map((team, i) => (
          <TeamCard key={team.name} team={team} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [error, setError] = useState(null)
  const [participants, setParticipants] = useState(null)
  const [groups, setGroups] = useState([])
  const [groupGenders, setGroupGenders] = useState({})
  const [fileName, setFileName] = useState('')
  const [showPdfModal, setShowPdfModal] = useState(false)

  const handleFile = async (file) => {
    setError(null)
    try {
      const data = await parseXlsFile(file)
      setFileName(file.name)
      const uniqueGroups = getUniqueGroups(data)

      const initialGenders = {}
      for (const g of uniqueGroups) {
        initialGenders[g.name] = g.gender ?? 'male'
      }

      setParticipants(data)
      setGroups(uniqueGroups)
      setGroupGenders(initialGenders)
    } catch (err) {
      setError('Помилка читання файлу: ' + err.message)
    }
  }

  const handleGenderChange = (grupName, gender) => {
    setGroupGenders((prev) => ({ ...prev, [grupName]: gender }))
  }

  const results = participants ? computeTeamResults(participants, groupGenders) : null

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Пліч-о-пліч</h1>
        <p className={styles.subtitle}>Підрахунок командних результатів змагань</p>
      </header>

      <FileUpload onFile={handleFile} />

      {error && <div className={styles.error}>{error}</div>}

      {participants && (
        <>
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
            <span>{fileName}</span>
            <span className={styles.participantCount}>
              {participants.length} учасників з командами
            </span>
            <button className={styles.btnExport} onClick={() => setShowPdfModal(true)}>
              Експорт PDF
            </button>
          </div>

          <GroupsList groups={groups} groupGenders={groupGenders} onChange={handleGenderChange} />

          <div className={styles.resultsGrid}>
            <ResultsSection
              title="Чоловіки"
              teams={results.male}
              icon={null}
            />
            <ResultsSection
              title="Жінки"
              teams={results.female}
              icon={null}
            />
          </div>
        </>
      )}
      {showPdfModal && results && (
        <PdfModal results={results} onClose={() => setShowPdfModal(false)} />
      )}
    </div>
  )
}
