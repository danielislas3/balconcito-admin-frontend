#!/usr/bin/env node

import { consola } from 'consola'
import { execSync } from 'child_process'
import { parseArgs } from 'node:util'
import { readFileSync } from 'fs'

const logger = consola.withTag('release')

function runCommand(command, options = {}) {
  logger.debug(`Ejecutando: ${command}`)
  try {
    const output = execSync(command, { stdio: 'inherit', ...options })
    return output
  } catch {
    logger.error(`Comando falló: ${command}`)
    process.exit(1)
  }
}

function runCommandWithOutput(command) {
  logger.debug(`Ejecutando: ${command}`)
  try {
    return execSync(command, { encoding: 'utf8' }).trim()
  } catch {
    logger.error(`Comando falló: ${command}`)
    process.exit(1)
  }
}

function tryRunCommand(command) {
  logger.debug(`Intentando: ${command}`)
  try {
    execSync(command, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function ensureReleaseLabel() {
  logger.debug('Verificando label "release"...')
  
  // Verificar si el label ya existe
  const checkLabelCommand = 'gh label list --json name --jq ".[] | select(.name == \"release\")"'
  if (tryRunCommand(checkLabelCommand)) {
    logger.debug('Label "release" ya existe')
    return true
  }
  
  // Crear el label si no existe
  logger.info('Creando label "release" en GitHub...')
  const createLabelCommand = 'gh label create "release" --description "Releases y versiones" --color "0E8A16"'
  if (tryRunCommand(createLabelCommand)) {
    logger.debug('Label "release" creado exitosamente')
    return true
  }
  
  logger.warn('No se pudo crear el label "release", continuando sin él')
  return false
}

function isWorkingDirectoryClean() {
  const output = runCommandWithOutput('git status --porcelain')
  return output === ''
}

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
  return packageJson.version
}

function parseArguments() {
  const { values } = parseArgs({
    options: {
      'hotfix': { type: 'boolean', short: 'h' },
      'version': { type: 'string', short: 'v' },
      'dry-run': { type: 'boolean', short: 'd' },
      'help': { type: 'boolean', short: '?' },
      'skip-pr': { type: 'boolean' }
    },
    allowPositionals: true
  })

  if (values.help) {
    logger.info(`
Uso: node scripts/release.js [opciones]

Opciones:
  -h, --hotfix       Realizar un hotfix release desde main (por defecto: release desde develop)
  -v, --version      Especificar versión manualmente (ej. 1.2.3)
  -d, --dry-run      Mostrar acciones sin ejecutarlas
  --skip-pr          Saltar creación de Pull Requests
  -?, --help         Mostrar esta ayuda
    `)
    process.exit(0)
  }

  return {
    isHotfix: values.hotfix || false,
    version: values.version || null,
    dryRun: values['dry-run'] || false,
    skipPr: values['skip-pr'] || false
  }
}

async function main() {
  logger.start('Iniciando proceso de release')

  const args = parseArguments()
  const { isHotfix, version, dryRun, skipPr } = args

  const baseBranch = isHotfix ? 'main' : 'develop'
  const branchPrefix = isHotfix ? 'hotfix' : 'release'

  logger.info(`Tipo: ${isHotfix ? 'Hotfix' : 'Release'}`)
  logger.info(`Rama base: ${baseBranch}`)

  // 1. Verificar GitHub CLI (necesario para PRs)
  if (!skipPr) {
    try {
      execSync('gh --version', { stdio: 'ignore' })
    } catch {
      logger.error('GitHub CLI (gh) no está instalado. Instálalo desde https://cli.github.com/ o usa --skip-pr')
      process.exit(1)
    }
  }

  // 2. Verificar directorio limpio
  if (!isWorkingDirectoryClean()) {
    logger.error('El directorio de trabajo no está limpio. Confirma o guarda tus cambios antes de continuar.')
    process.exit(1)
  }

  // 3. Cambiar a rama base y actualizar
  logger.info(`Cambiando a rama ${baseBranch} y actualizando...`)
  if (!dryRun) {
    runCommand(`git checkout ${baseBranch}`)
    runCommand(`git pull origin ${baseBranch}`)
  } else {
    logger.info(`[DRY RUN] git checkout ${baseBranch} && git pull origin ${baseBranch}`)
  }

  // 4. Determinar versión actual
  const currentVersion = getCurrentVersion()
  logger.info(`Versión actual: ${currentVersion}`)

  // 5. Crear rama de release/hotfix
  // La versión final la determinará standard-version, usamos current como placeholder
  const releaseBranchName = `${branchPrefix}/v${currentVersion}`
  logger.info(`Creando rama: ${releaseBranchName}`)
  if (!dryRun) {
    runCommand(`git checkout -b ${releaseBranchName}`)
  } else {
    logger.info(`[DRY RUN] git checkout -b ${releaseBranchName}`)
  }

  // 6. Ejecutar standard-version
  logger.info('Ejecutando standard-version...')
  const standardVersionArgs = []
  if (version) {
    standardVersionArgs.push(`--release-as ${version}`)
  }
  if (dryRun) {
    standardVersionArgs.push('--dry-run')
  }

  const standardVersionCommand = `npx standard-version ${standardVersionArgs.join(' ')}`
  if (!dryRun) {
    runCommand(standardVersionCommand)
  } else {
    logger.info(`[DRY RUN] ${standardVersionCommand}`)
  }

  // 7. Obtener nueva versión
  const newVersion = dryRun ? currentVersion : getCurrentVersion()
  logger.info(`Nueva versión: ${newVersion}`)

  // 8. Actualizar nombre de rama si la versión cambió
  const actualReleaseBranchName = `${branchPrefix}/v${newVersion}`
  if (releaseBranchName !== actualReleaseBranchName && !dryRun) {
    logger.info(`Renombrando rama a ${actualReleaseBranchName}`)
    runCommand(`git branch -m ${actualReleaseBranchName}`)
  }

  // 9. Push de la rama y tags
  logger.info(`Haciendo push de la rama ${actualReleaseBranchName}...`)
  if (!dryRun) {
    runCommand(`git push --set-upstream origin ${actualReleaseBranchName}`)
    runCommand('git push --tags')
  } else {
    logger.info(`[DRY RUN] git push --set-upstream origin ${actualReleaseBranchName}`)
    logger.info(`[DRY RUN] git push --tags`)
  }

  // 10. Crear PRs si no se salta
  if (!skipPr && !dryRun) {
    logger.info('Creando Pull Requests...')
    const prTitle = `${isHotfix ? 'Hotfix' : 'Release'} v${newVersion}`
    const prBody = `Automáticamente generado por el script de release`

    // Asegurar que el label 'release' existe
    const hasReleaseLabel = ensureReleaseLabel()
    const labelFlag = hasReleaseLabel ? '--label release' : ''

    // PR a main
    logger.info('Creando PR hacia main...')
    runCommand(`gh pr create --base main --head ${actualReleaseBranchName} --title "${prTitle}" --body "${prBody}" ${labelFlag}`.trim())

    // PR a develop (solo para releases, hotfixes ya están en main)
    if (!isHotfix) {
      logger.info('Creando PR hacia develop...')
      runCommand(`gh pr create --base develop --head ${actualReleaseBranchName} --title "${prTitle}" --body "${prBody}"`)
    }
  } else if (skipPr) {
    logger.info('Saltando creación de PRs (--skip-pr)')
  }

  logger.success('Proceso completado exitosamente')

  if (!dryRun) {
    logger.box('Siguientes pasos:',
      skipPr
        ? `1. Revisa los cambios en la rama ${actualReleaseBranchName}\n2. Crea manualmente los PRs si es necesario\n3. Realiza merge cuando estés listo`
        : `1. Revisa los PRs creados\n2. Realiza merge cuando estés listo\n3. Los tags ya fueron creados y pusheados`
    )
  }
}

main().catch((error) => {
  logger.error(error)
  process.exit(1)
})
