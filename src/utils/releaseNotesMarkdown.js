function appendText(nodes, value) {
  if (!value) return
  const previous = nodes[nodes.length - 1]
  if (previous?.type === 'text') {
    previous.value += value
    return
  }
  nodes.push({ type: 'text', value })
}

export function isSafeReleaseNotesUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function matchInlineToken(source) {
  const code = source.match(/^`([^`\n]+)`/)
  if (code) return { length: code[0].length, node: { type: 'code', value: code[1] } }

  const link = source.match(/^\[([^\]\n]+)\]\(([^)\s]+)\)/)
  if (link) {
    if (!isSafeReleaseNotesUrl(link[2])) return { length: link[0].length, text: link[0] }
    return {
      length: link[0].length,
      node: { type: 'link', value: link[1], href: link[2] }
    }
  }

  const strongAsterisk = source.match(/^\*\*([^*\n]+)\*\*/)
  if (strongAsterisk) {
    return { length: strongAsterisk[0].length, node: { type: 'strong', value: strongAsterisk[1] } }
  }
  const strongUnderscore = source.match(/^__([^_\n]+)__/)
  if (strongUnderscore) {
    return { length: strongUnderscore[0].length, node: { type: 'strong', value: strongUnderscore[1] } }
  }

  const emphasisAsterisk = source.match(/^\*([^*\n]+)\*/)
  if (emphasisAsterisk) {
    return { length: emphasisAsterisk[0].length, node: { type: 'emphasis', value: emphasisAsterisk[1] } }
  }
  const emphasisUnderscore = source.match(/^_([^_\n]+)_/)
  if (emphasisUnderscore) {
    return { length: emphasisUnderscore[0].length, node: { type: 'emphasis', value: emphasisUnderscore[1] } }
  }

  return null
}

function parseInlineMarkdown(value) {
  const source = String(value || '')
  const nodes = []
  let cursor = 0
  while (cursor < source.length) {
    const token = matchInlineToken(source.slice(cursor))
    if (!token) {
      appendText(nodes, source[cursor])
      cursor += 1
      continue
    }
    if (token.node) nodes.push(token.node)
    else appendText(nodes, token.text)
    cursor += token.length
  }
  return nodes
}

function matchHeading(line) {
  const match = line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)\s*$/)
  if (!match) return null
  return { level: match[1].length, content: match[2] }
}

function matchListItem(line) {
  const unordered = line.match(/^ {0,3}[-*+][ \t]+(.+)$/)
  if (unordered) return { ordered: false, content: unordered[1] }
  const ordered = line.match(/^ {0,3}(\d+)\.[ \t]+(.+)$/)
  if (!ordered) return null
  return { ordered: true, number: Number(ordered[1]), content: ordered[2] }
}

function beginsRecognizedBlock(line) {
  return Boolean(matchHeading(line) || matchListItem(line))
}

export function parseReleaseNotesMarkdown(value) {
  const lines = String(value || '').replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = matchHeading(line)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading.level,
        children: parseInlineMarkdown(heading.content)
      })
      index += 1
      continue
    }

    const firstListItem = matchListItem(line)
    if (firstListItem) {
      const block = {
        type: 'list',
        ordered: firstListItem.ordered,
        items: []
      }
      if (block.ordered) block.start = firstListItem.number
      while (index < lines.length) {
        const item = matchListItem(lines[index])
        if (!item || item.ordered !== block.ordered) break
        block.items.push(parseInlineMarkdown(item.content))
        index += 1
      }
      blocks.push(block)
      continue
    }

    const paragraphLines = [line]
    index += 1
    while (index < lines.length && lines[index].trim() && !beginsRecognizedBlock(lines[index])) {
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push({
      type: 'paragraph',
      children: parseInlineMarkdown(paragraphLines.join('\n'))
    })
  }

  return blocks
}
