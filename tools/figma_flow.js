// Read-only Figma Plugin API. Pass the visible descendants of each finished screen.
// https://developers.figma.com/docs/plugins/api/Action/
function checkFigmaFlow(page, screens, descendants, issue) {
  const byId = new Map(screens.map(screen => [screen.id, screen]))
  const start = (page.flowStartingPoints || []).find(point => byId.has(point.nodeId))
  const entry = start ? byId.get(start.nodeId) : screens[0]
  if (screens.length < 2) {
    issue('prototype-states', entry || page, '在成稿区放入可操作的入口整屏和操作后的结果整屏')
    return {startId: entry ? entry.id : null, reachable: [], roundTrips: []}
  }

  const pointer = new Set(['ON_CLICK', 'ON_DRAG', 'MOUSE_UP', 'MOUSE_DOWN', 'MOUSE_ENTER', 'MOUSE_LEAVE'])
  const navigation = new Set(['NAVIGATE', 'SWAP', 'OVERLAY'])
  const interactions = new Map()
  let usesHistory = false
  for (const screen of screens) {
    const sequences = []
    for (const node of [screen, ...descendants(screen)]) {
      for (const reaction of node.reactions || []) {
        const trigger = reaction.trigger
        if (!trigger) continue
        const shortcut = trigger.type === 'ON_KEY_DOWN' && trigger.keyCodes && trigger.keyCodes.length
        if (!shortcut && (node.id === screen.id || !pointer.has(trigger.type))) continue
        const actions = reaction.actions || [reaction.action]
        // Branches depend on runtime variable values. Never count all alternatives as available.
        if (actions.some(action => action && action.type === 'CONDITIONAL')) continue
        const steps = []
        let valid = true
        for (const action of actions) {
          if (!action) continue
          if (action.type === 'BACK' || action.type === 'CLOSE') {
            steps.push(action)
            if (action.type === 'BACK') usesHistory = true
          }
          if (action.type !== 'NODE' || !navigation.has(action.navigation)) continue
          if (!byId.has(action.destinationId)) {
            issue('prototype-target', node, '将 ' + action.navigation + ' 的目标连接到成稿区的实际整屏, 当前目标 ' +
              (action.destinationId || '已丢失'))
            valid = false
          }
          steps.push(action)
        }
        if (valid && steps.length) sequences.push(steps)
      }
    }
    interactions.set(screen.id, sequences)
  }

  // Retain actual navigation history and the overlay stack. CLOSE on a regular screen
  // and BACK after a top-level SWAP cannot manufacture a return edge.
  function active(state) {
    return state.overlays[state.overlays.length - 1] || state.base
  }

  function follow(state, steps) {
    let {base, history, overlays} = state
    for (const step of steps) {
      if (step.type === 'BACK') {
        if (overlays.length || !history.length) return null
        base = history[history.length - 1]
        history = history.slice(0, -1)
      } else if (step.type === 'CLOSE') {
        if (!overlays.length) return null
        overlays = overlays.slice(0, -1)
      } else {
        const to = step.destinationId
        if (to === (overlays[overlays.length - 1] || base)) continue
        if (step.navigation === 'OVERLAY') {
          overlays = overlays.concat(to)
        } else if (step.navigation === 'SWAP' && overlays.length) {
          overlays = overlays.slice(0, -1).concat(to)
        } else {
          if (usesHistory && step.navigation === 'NAVIGATE') history = history.concat(base)
          base = to
          overlays = []
        }
      }
    }
    return {base, overlays, history}
  }

  // A configured outside click can close an overlay only if the underlying viewport
  // actually leaves a clickable area outside that overlay.
  function outsideCloses(state) {
    if (!state.overlays.length) return false
    const overlay = byId.get(active(state))
    const viewport = byId.get(state.base)
    return overlay.overlayBackgroundInteraction === 'CLOSE_ON_CLICK_OUTSIDE' &&
      (overlay.width < viewport.width || overlay.height < viewport.height)
  }

  const initial = {base: entry.id, overlays: [], history: []}
  const queue = [initial]
  const key = state => JSON.stringify([state.base, state.overlays, state.history])
  const indexes = new Map([[key(initial), 0]])
  const incoming = [[]]
  let limited = false
  for (let i = 0; i < queue.length; i++) {
    const state = queue[i]
    const actions = interactions.get(active(state))
    const choices = outsideCloses(state) ? actions.concat([[{type: 'CLOSE'}]]) : actions
    for (const sequence of choices) {
      const next = follow(state, sequence)
      if (!next) continue
      // A real return to the bare entry finishes this run. A restart uses its own empty history.
      if (next.base === entry.id && !next.overlays.length) {
        incoming[0].push(i)
        continue
      }
      const nextKey = key(next)
      let j = indexes.get(nextKey)
      if (j === undefined) {
        if (queue.length >= 4096 || next.history.length + next.overlays.length > screens.length * 2) {
          limited = true
          continue
        }
        j = queue.length
        indexes.set(nextKey, j)
        queue.push(next)
        incoming.push([])
      }
      incoming[j].push(i)
    }
  }

  const returning = new Set([0])
  const backward = [0]
  for (let i = 0; i < backward.length; i++) {
    for (const prior of incoming[backward[i]]) {
      if (returning.has(prior)) continue
      returning.add(prior)
      backward.push(prior)
    }
  }
  const reached = new Set(queue.map(active))
  const roundTrips = new Set(backward.map(index => active(queue[index])))
  const stranded = new Set(queue.filter((_, i) => !returning.has(i)).map(active))
  for (const screen of screens) {
    if (!reached.has(screen.id)) {
      issue('prototype-reach', screen, '从入口「' + entry.name + '」未找到到此状态的控件交互, 核对目标、触发方式及条件分支')
    } else if (!roundTrips.has(screen.id) || (!limited && stranded.has(screen.id))) {
      issue('prototype-return', screen, '由入口进入此状态后有路径未找到返回「' + entry.name + '」的操作, 核对返回目标、历史或关闭浮层动作')
    }
  }
  if (limited && (roundTrips.size < screens.length || stranded.size)) {
    issue('prototype-review', entry, '导航历史或叠层组合达到自动检查上限, 在演示模式核对未验证的往返路径')
  }
  return {startId: entry.id, reachable: [...reached], roundTrips: [...roundTrips]}
}

if (typeof module !== 'undefined' && module.exports) module.exports = {checkFigmaFlow}
