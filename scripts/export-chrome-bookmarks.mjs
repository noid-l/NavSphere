import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DEFAULT_INPUT = path.join(
  os.homedir(),
  'Library/Application Support/Google/Chrome/Default/Bookmarks',
)

const DEFAULT_OUTPUT = path.join(process.cwd(), '.local/chrome-bookmarks.import.json')

const ROOT_NAMES = {
  bookmark_bar: '书签栏',
  other: '其他书签',
  synced: '同步书签',
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    isPublic: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--input' && argv[index + 1]) {
      options.input = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--output' && argv[index + 1]) {
      options.output = argv[index + 1]
      index += 1
      continue
    }

    if (arg === '--public') {
      options.isPublic = true
    }
  }

  return options
}

function isSupportedUrl(url) {
  return /^https?:\/\//i.test(url)
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildCategoryPayload(categoryName, urls, isPublic, sort) {
  return {
    category: {
      name: categoryName,
      description: '从 Google Chrome 书签自动导入',
      sort,
      is_public: isPublic,
    },
    links: urls.map((entry, index) => ({
      name: entry.name,
      url: entry.url,
      env: 'prod',
      sort: (index + 1) * 10,
      is_public: isPublic,
    })),
  }
}

function collectFromFolder(node, categoryPath, categories, skipped, isPublic, sortRef) {
  if (!node || !Array.isArray(node.children)) {
    return
  }

  const directUrls = []

  for (const child of node.children) {
    if (child?.type === 'url') {
      const name = normalizeText(child.name) || '未命名书签'
      const url = normalizeText(child.url)

      if (!isSupportedUrl(url)) {
        skipped.push({
          name,
          url,
          reason: 'unsupported-url',
        })
        continue
      }

      directUrls.push({ name, url })
      continue
    }

    if (child?.type === 'folder') {
      const folderName = normalizeText(child.name) || '未命名文件夹'
      collectFromFolder(
        child,
        [...categoryPath, folderName],
        categories,
        skipped,
        isPublic,
        sortRef,
      )
    }
  }

  if (directUrls.length > 0) {
    const categoryName = categoryPath.join(' / ')
    categories.push(
      buildCategoryPayload(categoryName, directUrls, isPublic, sortRef.current * 10),
    )
    sortRef.current += 1
  }
}

function buildImportPayload(bookmarks, isPublic) {
  const roots = bookmarks?.roots
  if (!roots || typeof roots !== 'object') {
    throw new Error('Chrome 书签文件缺少 roots 结构。')
  }

  const categories = []
  const skipped = []
  const sortRef = { current: 1 }

  for (const rootKey of ['bookmark_bar', 'other', 'synced']) {
    const root = roots[rootKey]
    if (!root) {
      continue
    }

    const rootName = ROOT_NAMES[rootKey] ?? rootKey
    collectFromFolder(root, [rootName], categories, skipped, isPublic, sortRef)
  }

  return { categories, skipped }
}

function main() {
  const options = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(options.input)) {
    throw new Error(`找不到 Chrome 书签文件：${options.input}`)
  }

  const raw = fs.readFileSync(options.input, 'utf8')
  const bookmarks = JSON.parse(raw)
  const result = buildImportPayload(bookmarks, options.isPublic)

  fs.mkdirSync(path.dirname(options.output), { recursive: true })
  fs.writeFileSync(options.output, `${JSON.stringify(result.categories, null, 2)}\n`, 'utf8')

  console.log(
    JSON.stringify(
      {
        input: options.input,
        output: options.output,
        categories: result.categories.length,
        links: result.categories.reduce((total, item) => total + item.links.length, 0),
        skipped: result.skipped.length,
      },
      null,
      2,
    ),
  )

  if (result.skipped.length > 0) {
    console.log('\nSkipped bookmarks:')
    for (const item of result.skipped.slice(0, 20)) {
      console.log(`- ${item.name}: ${item.url || '(empty url)'} [${item.reason}]`)
    }
  }
}

main()
