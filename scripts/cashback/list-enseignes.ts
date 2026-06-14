import { writeFileSync } from 'node:fs'
import { fetchAllEnseignes } from './client.ts'
import { normalizeName } from './normalize.ts'
import type { EnseigneRef } from './types.ts'

const OUTPUT = 'scripts/cashback/enseignes.json'

async function main() {
  const data = await fetchAllEnseignes()

  const refs: EnseigneRef[] = data.map((e) => ({
    id: e.id,
    nom: e.nom,
    nom_normalise: normalizeName(e.nom),
    cashback_source: e.cashback_source,
  }))

  writeFileSync(OUTPUT, JSON.stringify(refs, null, 2))
  console.log(`${refs.length} enseigne(s) écrite(s) dans ${OUTPUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
