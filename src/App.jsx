import { useState, useCallback } from 'react'
import { parseXlsFile, getUniqueGroups, computeTeamResults } from './parseXls'
import styles from './App.module.css'

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
      <div className={styles.dropzoneIcon}>📂</div>
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
              <span className={styles.groupGenderIcon}>{current === 'male' ? '👨' : '👩'}</span>
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

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className={styles.teamCard}>
      <div className={styles.teamHeader}>
        <div className={styles.teamRank}>
          {rank <= 3 ? medals[rank - 1] : <span className={styles.rankNum}>{rank}</span>}
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
            <span className={styles.fileIcon}>📄</span>
            <span>{fileName}</span>
            <span className={styles.participantCount}>
              {participants.length} учасників з командами
            </span>
          </div>

          <GroupsList groups={groups} groupGenders={groupGenders} onChange={handleGenderChange} />

          <div className={styles.resultsGrid}>
            <ResultsSection
              title="Чоловіки"
              teams={results.male}
              icon="👨"
            />
            <ResultsSection
              title="Жінки"
              teams={results.female}
              icon="👩"
            />
          </div>
        </>
      )}
    </div>
  )
}
